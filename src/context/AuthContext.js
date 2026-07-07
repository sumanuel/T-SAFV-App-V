/**
 * AuthContext.js
 * JWT-based auth using T-SAFV-API for login/register.
 * All other user data (role, workshop) is resolved from mock data.
 */
import AsyncStorage from "@react-native-async-storage/async-storage";
import { createContext, useContext, useMemo, useState, useEffect } from "react";
import { apiLogin, apiRegister } from "../services/auth/authService";
import { getWorkshop } from "../services/mock/mockStore";

const AuthContext = createContext();

const WORKSHOP = getWorkshop();
const MOCK_WORKSHOP_ID = WORKSHOP.id;

const AUTH_TOKEN_KEY = "@auth_token";
const AUTH_USER_KEY = "@auth_user";

/**
 * Maps the API user object to the profile shape used by screens.
 */
function mapApiUserToProfile(user) {
  const rawRol = String(user.rol || "ADMIN").toLowerCase();
  let role = "administrator";
  if (rawRol === "owner") role = "owner";
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
  const [authUser, setAuthUser] = useState(null); // raw API user
  const [userProfile, setUserProfile] = useState(null); // mapped profile
  const [authBusy, setAuthBusy] = useState(false);
  const [activeWorkshop] = useState(WORKSHOP);
  const [activeWorkshopId] = useState(MOCK_WORKSHOP_ID);

  // Memberships derived from userProfile
  const memberships = useMemo(() => {
    if (!userProfile) return [];
    return [buildMembership(userProfile)];
  }, [userProfile]);

  // On mount: restore session from AsyncStorage
  useEffect(() => {
    const restoreSession = async () => {
      try {
        const [token, userJson] = await Promise.all([
          AsyncStorage.getItem(AUTH_TOKEN_KEY),
          AsyncStorage.getItem(AUTH_USER_KEY),
        ]);

        if (token && userJson) {
          const user = JSON.parse(userJson);
          setAuthUser(user);
          setUserProfile(mapApiUserToProfile(user));
        }
      } catch (error) {
        console.error("Error restoring session:", error);
      } finally {
        setAuthReady(true);
      }
    };

    restoreSession();
  }, []);

  const signIn = async ({ email, password }) => {
    setAuthBusy(true);
    try {
      const { token, user } = await apiLogin({ email, password });
      await Promise.all([
        AsyncStorage.setItem(AUTH_TOKEN_KEY, token),
        AsyncStorage.setItem(AUTH_USER_KEY, JSON.stringify(user)),
      ]);
      setAuthUser(user);
      setUserProfile(mapApiUserToProfile(user));
    } finally {
      setAuthBusy(false);
    }
  };

  const signUp = async ({ fullName, phone, email, password }) => {
    setAuthBusy(true);
    try {
      // Parse fullName → nombre + apellido
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

      // Auto-login after successful registration
      const { token, user } = await apiLogin({ email, password });
      await Promise.all([
        AsyncStorage.setItem(AUTH_TOKEN_KEY, token),
        AsyncStorage.setItem(AUTH_USER_KEY, JSON.stringify(user)),
      ]);
      setAuthUser(user);
      setUserProfile(mapApiUserToProfile(user));
    } finally {
      setAuthBusy(false);
    }
  };

  const recoverPassword = async (email) => {
    // Password recovery not yet available in T-SAFV-API
    setAuthBusy(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 600));
      // Simulate success silently; screens handle the feedback message
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
      ]);
      setAuthUser(null);
      setUserProfile(null);
    } finally {
      setAuthBusy(false);
    }
  };

  // Stub methods retained for API compatibility with screens
  const activateInvitation = async () => {
    throw new Error("Activación por invitación no disponible en esta versión.");
  };

  const acceptPendingInvitation = async () => {
    throw new Error("Invitaciones no disponibles en esta versión.");
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

  const value = useMemo(
    () => ({
      activateInvitation,
      acceptPendingInvitation,
      activeWorkshop,
      activeWorkshopId,
      authBusy,
      authReady,
      authUser,
      memberships,
      pendingInvitation: null,
      recoverPassword,
      refreshWorkshopContext,
      renameActiveWorkshop,
      requiresWorkshopSetup: false,
      signIn,
      signOutUser,
      signUp,
      switchWorkshop,
      updateActiveWorkshop,
      userProfile,
    }),
    [authBusy, authReady, authUser, userProfile, memberships],
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
