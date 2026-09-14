/**
 * AuthContext.js
 * JWT-based auth usando T-SAFV-API para login/registro.
 * Expone token, asociaciones y asociacion activa para los modulos del dominio.
 */
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  useEffect,
} from "react";
import { Alert } from "react-native";
import {
  apiAcceptInvitation,
  apiGetAssociationCreationAccess,
  apiGetMyInvitations,
  apiLogin,
  apiRegister,
  apiRegisterPushToken,
} from "../services/auth/authService";
import { getMyAssociations } from "../services/associations/associationService";
import { getWorkshop } from "../services/mock/mockStore";
import { setSessionExpiredHandler } from "../services/auth/sessionExpiry";
import { registerForPushNotificationsAsync } from "../services/notifications/pushNotificationService";

const AuthContext = createContext();

const WORKSHOP = getWorkshop();
const MOCK_WORKSHOP_ID = WORKSHOP.id;

const AUTH_TOKEN_KEY = "@auth_token";
const AUTH_USER_KEY = "@auth_user";
const ACTIVE_ASSOC_KEY = "@active_association_id";

function mapApiUserToProfile(user) {
  const rawRol = String(user.rol || "ADMIN").toLowerCase();
  let role = "administrator";
  if (rawRol === "owner" || rawRol === "propietario") role = "owner";
  else if (rawRol === "fiscal") role = "fiscal";
  else if (rawRol === "mechanic" || rawRol === "mecanico") role = "mechanic";
  else if (rawRol === "reception" || rawRol === "recepcion") role = "reception";

  const fullName = [user.nombre, user.apellido]
    .filter(Boolean)
    .join(" ")
    .trim();

  return {
    uid: String(user.id),
    fullName,
    email: user.email || "",
    phone: user.telefono || "",
    role,
    associationCreationAccess: user.association_creation_access || null,
    status: "active",
    defaultWorkshopId: MOCK_WORKSHOP_ID,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

function buildMembership(profile) {
  return {
    workshopId: MOCK_WORKSHOP_ID,
    workshopName: WORKSHOP.name,
    role: profile.role,
    status: "active",
    uid: profile.uid,
  };
}

export function AuthProvider({ children }) {
  const [authReady, setAuthReady] = useState(false);
  const [authUser, setAuthUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [authBusy, setAuthBusy] = useState(false);
  const [token, setToken] = useState(null);
  const [associations, setAssociations] = useState([]);
  const [activeAssociationId, setActiveAssociationIdState] = useState(null);
  const [pendingInvitation, setPendingInvitation] = useState(null);
  const [associationsLoadError, setAssociationsLoadError] = useState(false);
  const [activeWorkshop] = useState(WORKSHOP);

  const activeAssociation = useMemo(
    () =>
      associations.find((a) => String(a.id) === String(activeAssociationId)) ||
      associations[0] ||
      null,
    [associations, activeAssociationId],
  );

  const memberships = useMemo(() => {
    if (!userProfile) return [];
    return [buildMembership(userProfile)];
  }, [userProfile]);

  const loadAssociations = useCallback(async (authToken) => {
    if (!authToken) return;
    try {
      const [data, access, invitations] = await Promise.all([
        getMyAssociations(authToken),
        apiGetAssociationCreationAccess(),
        apiGetMyInvitations(),
      ]);
      setAssociationsLoadError(false);
      const hasAssociations = Boolean(data && data.length > 0);
      const hasPendingInvitation = Boolean(invitations && invitations.length > 0);
      setAssociations(data || []);
      setPendingInvitation((invitations || [])[0] || null);
      setUserProfile((current) =>
        current
          ? {
              ...current,
              associationCreationAccess: access || null,
              // Sin asociaciones activas pero con invitacion pendiente: mostrar
              // AccessStatusScreen para que el usuario la vea y pueda aceptarla.
              status: !hasAssociations && hasPendingInvitation ? "missing" : "active",
            }
          : current,
      );
      if (data && data.length > 0) {
        const savedId = await AsyncStorage.getItem(ACTIVE_ASSOC_KEY);
        const match = data.find((a) => String(a.id) === String(savedId));
        setActiveAssociationIdState(match ? match.id : data[0].id);
      } else {
        setActiveAssociationIdState(null);
      }
    } catch (error) {
      console.error("Error loading associations:", error);
      setAssociationsLoadError(true);
    }
  }, []);

  // Registra el push token del dispositivo en el backend (silencioso: no debe
  // bloquear ni romper el flujo de login si falla o el usuario no dio permiso).
  const syncPushToken = useCallback(() => {
    (async () => {
      try {
        const pushToken = await registerForPushNotificationsAsync();
        if (!pushToken) {
          console.log("[push] sin token, no se llama al backend");
          return;
        }
        console.log("[push] enviando token al backend...");
        await apiRegisterPushToken(pushToken);
        console.log("[push] token registrado en el backend con exito");
      } catch (error) {
        console.error("[push] No se pudo registrar el push token:", error);
      }
    })();
  }, []);

  const setActiveAssociationId = useCallback(async (id) => {
    setActiveAssociationIdState(id);
    if (id) {
      await AsyncStorage.setItem(ACTIVE_ASSOC_KEY, String(id));
    }
  }, []);

  const refreshAssociations = useCallback(async () => {
    if (token) await loadAssociations(token);
  }, [token, loadAssociations]);

  const syncCurrentUserProfile = useCallback(async (patch) => {
    let nextUser = null;

    setAuthUser((current) => {
      if (!current) {
        return current;
      }

      nextUser = {
        ...current,
        nombre: patch?.nombre ?? current.nombre,
        apellido: patch?.apellido ?? current.apellido,
        email: patch?.email ?? current.email,
        telefono: patch?.telefono ?? current.telefono,
        rif_cedula: patch?.rif_cedula ?? current.rif_cedula,
        direccion: patch?.direccion ?? current.direccion,
      };

      return nextUser;
    });

    if (!nextUser) {
      return;
    }

    await AsyncStorage.setItem(AUTH_USER_KEY, JSON.stringify(nextUser));
    setUserProfile((profile) => {
      if (!profile) {
        return profile;
      }

      const mapped = mapApiUserToProfile(nextUser);
      return {
        ...mapped,
        associationCreationAccess: profile.associationCreationAccess,
      };
    });
  }, []);

  // Notificacion global de sesion vencida (token 401): cierra sesion en vez de
  // dejar a la app en un estado inconsistente (ej: pantalla de crear/activar
  // prueba pese a que el usuario ya tiene asociacion).
  const signOutUserRef = useRef(null);
  useEffect(() => {
    setSessionExpiredHandler(() => {
      Alert.alert(
        "Sesión expirada",
        "Tu sesión ha expirado. Por favor inicia sesión nuevamente.",
      );
      signOutUserRef.current?.();
    });
    return () => setSessionExpiredHandler(null);
  }, []);

  // Restaurar sesion desde AsyncStorage
  useEffect(() => {
    const restoreSession = async () => {
      try {
        const [storedToken, userJson] = await Promise.all([
          AsyncStorage.getItem(AUTH_TOKEN_KEY),
          AsyncStorage.getItem(AUTH_USER_KEY),
        ]);

        if (storedToken && userJson) {
          const user = JSON.parse(userJson);
          setToken(storedToken);
          setAuthUser(user);
          setUserProfile(mapApiUserToProfile(user));
          await loadAssociations(storedToken);
          syncPushToken();
        }
      } catch (error) {
        console.error("Error restoring session:", error);
      } finally {
        setAuthReady(true);
      }
    };

    restoreSession();
  }, [loadAssociations, syncPushToken]);

  const signIn = async ({ email, password }) => {
    setAuthBusy(true);
    try {
      const { token: jwt, user } = await apiLogin({ email, password });
      await Promise.all([
        AsyncStorage.setItem(AUTH_TOKEN_KEY, jwt),
        AsyncStorage.setItem(AUTH_USER_KEY, JSON.stringify(user)),
      ]);
      setToken(jwt);
      setAuthUser(user);
      setUserProfile(mapApiUserToProfile(user));
      await loadAssociations(jwt);
      syncPushToken();
    } finally {
      setAuthBusy(false);
    }
  };

  const signUp = async ({ fullName, phone, email, password }) => {
    setAuthBusy(true);
    try {
      const parts = (fullName || "").trim().split(/\s+/);
      const nombre = parts[0] || "";
      const apellido = parts.slice(1).join(" ");

      await apiRegister({
        nombre,
        apellido,
        email,
        password,
        telefono: phone || "",
      });

      const { token: jwt, user } = await apiLogin({ email, password });
      await Promise.all([
        AsyncStorage.setItem(AUTH_TOKEN_KEY, jwt),
        AsyncStorage.setItem(AUTH_USER_KEY, JSON.stringify(user)),
      ]);
      setToken(jwt);
      setAuthUser(user);
      setUserProfile(mapApiUserToProfile(user));
      await loadAssociations(jwt);
      syncPushToken();
    } finally {
      setAuthBusy(false);
    }
  };

  const recoverPassword = async (email) => {
    setAuthBusy(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 600));
    } finally {
      setAuthBusy(false);
    }
  };

  const signOutUser = async () => {
    setAuthBusy(true);
    try {
      await Promise.all([
        AsyncStorage.removeItem(AUTH_TOKEN_KEY),
        AsyncStorage.removeItem(AUTH_USER_KEY),
        AsyncStorage.removeItem(ACTIVE_ASSOC_KEY),
      ]);
      setToken(null);
      setAuthUser(null);
      setUserProfile(null);
      setAssociations([]);
      setActiveAssociationIdState(null);
      setAssociationsLoadError(false);
    } finally {
      setAuthBusy(false);
    }
  };
  signOutUserRef.current = signOutUser;

  const activateInvitation = async () => {
    throw new Error("Activacion por invitacion no disponible en esta version.");
  };

  const acceptPendingInvitation = async () => {
    if (!pendingInvitation?.token_invitacion) {
      throw new Error("No hay invitaciones pendientes para aceptar.");
    }

    setAuthBusy(true);
    try {
      await apiAcceptInvitation(pendingInvitation.token_invitacion);
      await loadAssociations(token);
    } finally {
      setAuthBusy(false);
    }
  };

  const switchWorkshop = async () => {};

  const renameActiveWorkshop = async (name) => {
    const { updateWorkshop } =
      await import("../services/workshops/workshopService");
    return updateWorkshop(MOCK_WORKSHOP_ID, { name });
  };

  const updateActiveWorkshop = async (data) => {
    const { updateWorkshop } =
      await import("../services/workshops/workshopService");
    return updateWorkshop(MOCK_WORKSHOP_ID, data);
  };

  const refreshWorkshopContext = async () => {};

  const activeWorkshopId = MOCK_WORKSHOP_ID;

  const value = useMemo(
    () => ({
      activateInvitation,
      acceptPendingInvitation,
      activeAssociation,
      activeAssociationId: activeAssociation?.id ?? null,
      activeWorkshop,
      activeWorkshopId,
      associations,
      associationsLoadError,
      authBusy,
      authReady,
      authUser,
      memberships,
      pendingInvitation,
      recoverPassword,
      refreshAssociations,
      refreshWorkshopContext,
      renameActiveWorkshop,
      requiresWorkshopSetup: false,
      setActiveAssociationId,
      signIn,
      signOutUser,
      signUp,
      syncCurrentUserProfile,
      switchWorkshop,
      token,
      updateActiveWorkshop,
      userProfile,
    }),
    [
      activeAssociation,
      associations,
      associationsLoadError,
      authBusy,
      authReady,
      authUser,
      memberships,
      pendingInvitation,
      refreshAssociations,
      setActiveAssociationId,
      syncCurrentUserProfile,
      token,
      userProfile,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}
