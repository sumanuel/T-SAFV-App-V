import AsyncStorage from "@react-native-async-storage/async-storage";
import { useEffect, useMemo, useState } from "react";
import { Alert, AppState, BackHandler, StyleSheet, View } from "react-native";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { AuthProvider, useAuth } from "./src/context/AuthContext";
import { ThemeProvider, useTheme } from "./src/context/ThemeContext";
import { getBiometricLockEnabled } from "./src/services/security/biometricAuthService";

// Pantallas de autenticacion y navegacion
import AccessStatusScreen from "./src/screens/AccessStatusScreen";
import AuthScreen from "./src/screens/AuthScreen";
import BiometricLockScreen from "./src/screens/BiometricLockScreen";
import LoadingScreen from "./src/screens/LoadingScreen";
import OnboardingScreen, {
  ONBOARDING_STORAGE_KEY,
} from "./src/screens/OnboardingScreen";

// Pantallas de recuperación de contraseña
import ForgotPasswordScreen from "./src/screens/ForgotPasswordScreen";
import VerifyCodeScreen from "./src/screens/VerifyCodeScreen";
import ResetPasswordScreen from "./src/screens/ResetPasswordScreen";

// Pantallas principales
import WorkshopHomeScreen from "./src/screens/WorkshopHomeScreen";
import WorkshopMoreScreen from "./src/screens/WorkshopMoreScreen";
import WorkshopTabBar from "./src/components/common/WorkshopTabBar";

// Propietarios
import PropietariosScreen from "./src/screens/PropietariosScreen";
import PropietarioFormScreen from "./src/screens/PropietarioFormScreen";
import MemberInvitationsScreen from "./src/screens/MemberInvitationsScreen";

// Unidades / Vehiculos
import VehicleFormScreen from "./src/screens/VehicleFormScreen";
import FiscalRecordFormScreen from "./src/screens/FiscalRecordFormScreen";

// Fiscales
import FiscalesScreen from "./src/screens/FiscalesScreen";
import FiscalFormScreen from "./src/screens/FiscalFormScreen";

// Traza
import TrazaScreen from "./src/screens/TrazaScreen";

// Stock (disponible desde Mas)
import StockItemsScreen from "./src/screens/StockItemsScreen";
import StockItemFormScreen from "./src/screens/StockItemFormScreen";
import StockMovementFormScreen from "./src/screens/StockMovementFormScreen";
import TeamAccessScreen from "./src/screens/TeamAccessScreen";
import AssociationSettingsScreen from "./src/screens/AssociationSettingsScreen";
import NotificationsScreen from "./src/screens/NotificationsScreen";

const APP_SCREENS = {
  HOME: "home",
  PROPIETARIOS: "propietarios",
  PROPIETARIO_FORM: "propietario-form",
  VEHICLE_FORM: "vehicle-form",
  FISCAL_RECORD_FORM: "fiscal-record-form",
  MEMBER_INVITATIONS: "member-invitations",
  FISCALES: "fiscales",
  FISCAL_FORM: "fiscal-form",
  TRAZA: "traza",
  STOCK_ITEMS: "stock-items",
  STOCK_ITEM_FORM: "stock-item-form",
  STOCK_MOVEMENT_FORM: "stock-movement-form",
  WORKSHOP_SETTINGS: "workshop-settings",
  COLLABORATORS: "collaborators",
  NOTIFICATIONS: "notifications",
  MORE: "more",
};

const ROOT_TABS = new Set([
  APP_SCREENS.HOME,
  APP_SCREENS.PROPIETARIOS,
  APP_SCREENS.FISCALES,
  APP_SCREENS.TRAZA,
  APP_SCREENS.MORE,
]);

function AppContent() {
  const { isDarkMode, toggleTheme } = useTheme();
  const {
    acceptPendingInvitation,
    activeWorkshopId,
    authUser,
    authReady,
    memberships,
    pendingInvitation,
    signOutUser,
    syncCurrentUserProfile,
    userProfile,
  } = useAuth();

  const [activeScreen, setActiveScreen] = useState(APP_SCREENS.HOME);
  const [onboardingReady, setOnboardingReady] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [biometricLockEnabled, setBiometricLockEnabledFlag] = useState(false);
  const [lockChecked, setLockChecked] = useState(false);
  const [isLocked, setIsLocked] = useState(false);

  // Estado para navegación de autenticación
  const [authScreen, setAuthScreen] = useState("AuthScreen");
  const [authScreenContext, setAuthScreenContext] = useState({});

  // Contextos de formularios
  const [propietarioFormContext, setPropietarioFormContext] = useState({
    propietario: null,
  });
  const [propietariosViewState, setPropietariosViewState] = useState({
    selectedClientId: null,
    screenMode: "list",
  });
  const [vehicleFormContext, setVehicleFormContext] = useState({
    propietario: null,
    vehicle: null,
  });
  const [fiscalRecordContext, setFiscalRecordContext] = useState({
    unit: null,
  });
  const [memberInvitationContext, setMemberInvitationContext] = useState({
    role: "TODOS",
    memberId: null,
  });
  const [fiscalFormContext, setFiscalFormContext] = useState({ fiscal: null });
  const [stockItemFormContext, setStockItemFormContext] = useState({
    stockItem: null,
    draft: null,
  });
  const [stockMovementFormContext, setStockMovementFormContext] = useState({
    stockItem: null,
    movementType: "in",
  });
  const [stockItemsViewState, setStockItemsViewState] = useState({
    selectedStockItemId: null,
  });
  const [trazaViewState, setTrazaViewState] = useState({ unit: null });

  useEffect(() => {
    const load = async () => {
      try {
        const completed = await AsyncStorage.getItem(ONBOARDING_STORAGE_KEY);
        setShowOnboarding(!completed);
      } finally {
        setOnboardingReady(true);
      }
    };
    load();
  }, []);

  // Bloqueo con huella/Face ID: si el usuario lo activo en Mas > Configuracion,
  // se exige desbloquear cada vez que hay una sesion restaurada o la app vuelve
  // de segundo plano.
  useEffect(() => {
    let cancelled = false;
    if (!authReady) return undefined;
    if (!authUser) {
      setLockChecked(true);
      setIsLocked(false);
      return undefined;
    }
    (async () => {
      const enabled = await getBiometricLockEnabled();
      if (cancelled) return;
      setBiometricLockEnabledFlag(enabled);
      setIsLocked(enabled);
      setLockChecked(true);
    })();
    return () => {
      cancelled = true;
    };
  }, [authReady, authUser?.id]);

  useEffect(() => {
    if (!biometricLockEnabled) return undefined;
    let previousState = AppState.currentState;
    const subscription = AppState.addEventListener("change", (nextState) => {
      if (/background/.test(previousState) && nextState === "active") {
        setIsLocked(true);
      }
      previousState = nextState;
    });
    return () => subscription.remove();
  }, [biometricLockEnabled]);

  // Limpiar estado al cambiar de usuario
  useEffect(() => {
    setActiveScreen(APP_SCREENS.HOME);
    setPropietarioFormContext({ propietario: null });
    setPropietariosViewState({ selectedClientId: null, screenMode: "list" });
    setVehicleFormContext({ propietario: null, vehicle: null });
    setFiscalRecordContext({ unit: null });
    setMemberInvitationContext({ role: "TODOS", memberId: null });
    setFiscalFormContext({ fiscal: null });
    setStockItemFormContext({ stockItem: null, draft: null });
    setStockMovementFormContext({ stockItem: null, movementType: "in" });
    setStockItemsViewState({ selectedStockItemId: null });
    setTrazaViewState({ unit: null });
  }, [authUser?.id]);

  const activeTab = useMemo(() => {
    if (ROOT_TABS.has(activeScreen)) return activeScreen;
    if (
      [APP_SCREENS.PROPIETARIO_FORM, APP_SCREENS.VEHICLE_FORM].includes(
        activeScreen,
      )
    )
      return APP_SCREENS.PROPIETARIOS;
    if (activeScreen === APP_SCREENS.FISCAL_RECORD_FORM)
      return APP_SCREENS.HOME;
    if (activeScreen === APP_SCREENS.MEMBER_INVITATIONS)
      return APP_SCREENS.MORE;
    if (activeScreen === APP_SCREENS.FISCAL_FORM) return APP_SCREENS.FISCALES;
    if (
      [
        APP_SCREENS.STOCK_ITEMS,
        APP_SCREENS.STOCK_ITEM_FORM,
        APP_SCREENS.STOCK_MOVEMENT_FORM,
        APP_SCREENS.WORKSHOP_SETTINGS,
        APP_SCREENS.COLLABORATORS,
      ].includes(activeScreen)
    )
      return APP_SCREENS.MORE;
    return APP_SCREENS.HOME;
  }, [activeScreen]);

  const profileStatus = userProfile?.status;
  const activeMembership = memberships.find(
    (m) => m.workshopId === activeWorkshopId,
  );
  const currentRole = activeMembership?.role || userProfile?.role || "";
  const isFiscalUser = currentRole === "fiscal";
  const visibleTabs = isFiscalUser
    ? [
        APP_SCREENS.HOME,
        APP_SCREENS.FISCALES,
        APP_SCREENS.TRAZA,
        APP_SCREENS.MORE,
      ]
    : [
        APP_SCREENS.HOME,
        APP_SCREENS.PROPIETARIOS,
        APP_SCREENS.FISCALES,
        APP_SCREENS.TRAZA,
        APP_SCREENS.MORE,
      ];

  // Hardware back button handler
  useEffect(() => {
    if (!authReady || !authUser || !userProfile || profileStatus !== "active")
      return undefined;

    const subscription = BackHandler.addEventListener(
      "hardwareBackPress",
      () => {
        if (activeScreen === APP_SCREENS.PROPIETARIO_FORM) {
          setActiveScreen(APP_SCREENS.PROPIETARIOS);
          return true;
        }
        if (activeScreen === APP_SCREENS.VEHICLE_FORM) {
          setActiveScreen(APP_SCREENS.PROPIETARIOS);
          return true;
        }
        if (activeScreen === APP_SCREENS.FISCAL_RECORD_FORM) {
          setActiveScreen(APP_SCREENS.HOME);
          return true;
        }
        if (activeScreen === APP_SCREENS.MEMBER_INVITATIONS) {
          setActiveScreen(APP_SCREENS.MORE);
          return true;
        }
        if (activeScreen === APP_SCREENS.FISCAL_FORM) {
          setActiveScreen(APP_SCREENS.FISCALES);
          return true;
        }
        if (activeScreen === APP_SCREENS.TRAZA) {
          setActiveScreen(APP_SCREENS.HOME);
          return true;
        }
        if (activeScreen === APP_SCREENS.NOTIFICATIONS) {
          setActiveScreen(APP_SCREENS.HOME);
          return true;
        }
        if (
          [
            APP_SCREENS.STOCK_ITEMS,
            APP_SCREENS.STOCK_ITEM_FORM,
            APP_SCREENS.STOCK_MOVEMENT_FORM,
            APP_SCREENS.WORKSHOP_SETTINGS,
            APP_SCREENS.COLLABORATORS,
          ].includes(activeScreen)
        ) {
          setActiveScreen(APP_SCREENS.MORE);
          return true;
        }
        if (activeScreen === APP_SCREENS.MORE) {
          setActiveScreen(APP_SCREENS.HOME);
          return true;
        }
        if (activeScreen === APP_SCREENS.PROPIETARIOS) {
          setActiveScreen(APP_SCREENS.HOME);
          return true;
        }
        if (activeScreen === APP_SCREENS.FISCALES) {
          setActiveScreen(APP_SCREENS.HOME);
          return true;
        }
        return false;
      },
    );

    return () => subscription.remove();
  }, [activeScreen, authReady, authUser, profileStatus, userProfile]);

  if (!authReady || !onboardingReady) {
    return (
      <>
        <StatusBar style={isDarkMode ? "light" : "dark"} />
        <LoadingScreen />
      </>
    );
  }

  if (showOnboarding) {
    return (
      <>
        <StatusBar style={isDarkMode ? "light" : "dark"} />
        <OnboardingScreen onComplete={() => setShowOnboarding(false)} />
      </>
    );
  }

  if (!authUser) {
    // Handler para navegación entre pantallas de autenticación
    const handleAuthNavigation = (screen, context = {}) => {
      setAuthScreen(screen);
      setAuthScreenContext(context);
    };

    // Renderizar pantallas de autenticación
    const renderAuthScreen = () => {
      if (authScreen === "ForgotPasswordScreen") {
        return (
          <ForgotPasswordScreen
            onNavigate={handleAuthNavigation}
            screenContext={authScreenContext}
          />
        );
      }
      if (authScreen === "VerifyCodeScreen") {
        return (
          <VerifyCodeScreen
            onNavigate={handleAuthNavigation}
            screenContext={authScreenContext}
          />
        );
      }
      if (authScreen === "ResetPasswordScreen") {
        return (
          <ResetPasswordScreen
            onNavigate={handleAuthNavigation}
            screenContext={authScreenContext}
          />
        );
      }
      return <AuthScreen onNavigate={handleAuthNavigation} />;
    };

    return (
      <>
        <StatusBar style={isDarkMode ? "light" : "dark"} />
        {renderAuthScreen()}
      </>
    );
  }

  if (!lockChecked) {
    return (
      <>
        <StatusBar style={isDarkMode ? "light" : "dark"} />
        <LoadingScreen />
      </>
    );
  }

  if (isLocked) {
    return (
      <>
        <StatusBar style={isDarkMode ? "light" : "dark"} />
        <BiometricLockScreen
          onUnlock={() => setIsLocked(false)}
          onSignOut={signOutUser}
        />
      </>
    );
  }

  if (!userProfile || profileStatus !== "active") {
    return (
      <>
        <StatusBar style={isDarkMode ? "light" : "dark"} />
        <AccessStatusScreen
          authUser={authUser}
          onAcceptInvitation={acceptPendingInvitation}
          onSignOut={signOutUser}
          pendingInvitation={pendingInvitation}
          userProfile={userProfile}
        />
      </>
    );
  }

  const handleTabChange = (nextTab) => {
    if (nextTab === APP_SCREENS.HOME) {
      setActiveScreen(APP_SCREENS.HOME);
      return;
    }
    if (nextTab === APP_SCREENS.PROPIETARIOS) {
      setPropietariosViewState({ selectedClientId: null, screenMode: "list" });
      setActiveScreen(APP_SCREENS.PROPIETARIOS);
      return;
    }
    if (nextTab === APP_SCREENS.FISCALES) {
      setActiveScreen(APP_SCREENS.FISCALES);
      return;
    }
    if (nextTab === APP_SCREENS.TRAZA) {
      setTrazaViewState({ unit: null });
      setActiveScreen(APP_SCREENS.TRAZA);
      return;
    }
    setActiveScreen(APP_SCREENS.MORE);
  };

  const renderScreen = () => {
    if (activeScreen === APP_SCREENS.HOME) {
      return (
        <WorkshopHomeScreen
          onOpenPropietarios={() => {
            setPropietariosViewState({
              selectedClientId: null,
              screenMode: "list",
            });
            setActiveScreen(APP_SCREENS.PROPIETARIOS);
          }}
          onOpenFiscales={() => setActiveScreen(APP_SCREENS.FISCALES)}
          onOpenTraza={() => {
            setTrazaViewState({ unit: null });
            setActiveScreen(APP_SCREENS.TRAZA);
          }}
          onOpenFiscalRecord={(vehicle) => {
            if (isFiscalUser) {
              setFiscalRecordContext({ unit: vehicle || null });
              setActiveScreen(APP_SCREENS.FISCAL_RECORD_FORM);
              return;
            }
            setTrazaViewState({ unit: vehicle || null });
            setActiveScreen(APP_SCREENS.TRAZA);
          }}
          onOpenNotifications={() => setActiveScreen(APP_SCREENS.NOTIFICATIONS)}
          onSignOut={signOutUser}
          currentRole={currentRole}
          userProfile={userProfile}
        />
      );
    }

    if (activeScreen === APP_SCREENS.NOTIFICATIONS) {
      return <NotificationsScreen onBack={() => setActiveScreen(APP_SCREENS.HOME)} />;
    }

    if (activeScreen === APP_SCREENS.PROPIETARIOS) {
      return (
        <PropietariosScreen
          onBack={() => setActiveScreen(APP_SCREENS.HOME)}
          onOpenInvitationCenter={(role, memberId) => {
            setMemberInvitationContext({
              role: role || "TODOS",
              memberId: memberId || null,
            });
            setActiveScreen(APP_SCREENS.MEMBER_INVITATIONS);
          }}
          onOpenPropietarioForm={(propietario, options = {}) => {
            setPropietarioFormContext({ propietario: propietario || null });
            setActiveScreen(APP_SCREENS.PROPIETARIO_FORM);
          }}
          onOpenVehicleForm={(propietario, vehicle) => {
            setVehicleFormContext({
              propietario: propietario || null,
              vehicle: vehicle || null,
            });
            setActiveScreen(APP_SCREENS.VEHICLE_FORM);
          }}
          currentRole={currentRole}
          userProfile={userProfile}
          viewState={propietariosViewState}
        />
      );
    }

    if (activeScreen === APP_SCREENS.PROPIETARIO_FORM) {
      return (
        <PropietarioFormScreen
          currentRole={currentRole}
          initialPropietario={propietarioFormContext.propietario}
          onBack={() => setActiveScreen(APP_SCREENS.PROPIETARIOS)}
          onProfileSaved={syncCurrentUserProfile}
          onSaved={() => {
            setPropietariosViewState({
              selectedClientId: null,
              screenMode: "list",
            });
            setActiveScreen(APP_SCREENS.PROPIETARIOS);
          }}
        />
      );
    }

    if (activeScreen === APP_SCREENS.VEHICLE_FORM) {
      return (
        <VehicleFormScreen
          currentRole={currentRole}
          initialPropietario={vehicleFormContext.propietario}
          initialVehicle={vehicleFormContext.vehicle}
          onBack={() => {
            if (vehicleFormContext.propietario) {
              setPropietariosViewState({
                selectedClientId:
                  vehicleFormContext.propietario?.id ||
                  vehicleFormContext.propietario?.membresia_id ||
                  null,
                screenMode: "detail",
              });
              setActiveScreen(APP_SCREENS.PROPIETARIOS);
            } else {
              setActiveScreen(APP_SCREENS.HOME);
            }
          }}
          onSaved={() => {
            if (vehicleFormContext.propietario) {
              setPropietariosViewState({
                selectedClientId:
                  vehicleFormContext.propietario?.id ||
                  vehicleFormContext.propietario?.membresia_id ||
                  null,
                screenMode: "detail",
              });
              setActiveScreen(APP_SCREENS.PROPIETARIOS);
            } else {
              setActiveScreen(APP_SCREENS.HOME);
            }
          }}
        />
      );
    }

    if (activeScreen === APP_SCREENS.FISCAL_RECORD_FORM) {
      return (
        <FiscalRecordFormScreen
          initialUnit={fiscalRecordContext.unit}
          onBack={() => setActiveScreen(APP_SCREENS.HOME)}
          onSaved={() => setActiveScreen(APP_SCREENS.HOME)}
        />
      );
    }

    if (activeScreen === APP_SCREENS.MEMBER_INVITATIONS) {
      return (
        <MemberInvitationsScreen
          initialRole={memberInvitationContext.role}
          initialMemberId={memberInvitationContext.memberId}
          onBack={() => setActiveScreen(APP_SCREENS.MORE)}
        />
      );
    }

    if (activeScreen === APP_SCREENS.FISCALES) {
      return (
        <FiscalesScreen
          onBack={() => setActiveScreen(APP_SCREENS.HOME)}
          onOpenInvitationCenter={(role, memberId) => {
            setMemberInvitationContext({
              role: role || "TODOS",
              memberId: memberId || null,
            });
            setActiveScreen(APP_SCREENS.MEMBER_INVITATIONS);
          }}
          onOpenFiscalForm={(fiscal) => {
            setFiscalFormContext({ fiscal: fiscal || null });
            setActiveScreen(APP_SCREENS.FISCAL_FORM);
          }}
          currentRole={currentRole}
          userProfile={userProfile}
        />
      );
    }

    if (activeScreen === APP_SCREENS.FISCAL_FORM) {
      return (
        <FiscalFormScreen
          initialFiscal={fiscalFormContext.fiscal}
          onBack={() => setActiveScreen(APP_SCREENS.FISCALES)}
          onSaved={() => setActiveScreen(APP_SCREENS.FISCALES)}
        />
      );
    }

    if (activeScreen === APP_SCREENS.TRAZA) {
      return (
        <TrazaScreen
          initialUnit={trazaViewState.unit}
          onBack={() => setActiveScreen(APP_SCREENS.HOME)}
          currentRole={currentRole}
          userProfile={userProfile}
        />
      );
    }

    if (activeScreen === APP_SCREENS.STOCK_ITEMS) {
      return (
        <StockItemsScreen
          onBack={() => setActiveScreen(APP_SCREENS.MORE)}
          onOpenStockItemForm={(stockItem, options = {}) => {
            setStockItemFormContext({
              stockItem: stockItem || null,
              draft: options.seedData || null,
            });
            setActiveScreen(APP_SCREENS.STOCK_ITEM_FORM);
          }}
          onOpenStockMovementForm={(stockItem, options = {}) => {
            setStockMovementFormContext({
              stockItem: stockItem || null,
              movementType: options.movementType || "in",
            });
            setActiveScreen(APP_SCREENS.STOCK_MOVEMENT_FORM);
          }}
          userProfile={userProfile}
          viewState={stockItemsViewState}
        />
      );
    }

    if (activeScreen === APP_SCREENS.STOCK_ITEM_FORM) {
      return (
        <StockItemFormScreen
          initialDraft={stockItemFormContext.draft}
          initialStockItem={stockItemFormContext.stockItem}
          onBack={() => setActiveScreen(APP_SCREENS.STOCK_ITEMS)}
          onSaved={(savedId) => {
            setStockItemsViewState({ selectedStockItemId: savedId });
            setActiveScreen(APP_SCREENS.STOCK_ITEMS);
          }}
        />
      );
    }

    if (activeScreen === APP_SCREENS.STOCK_MOVEMENT_FORM) {
      return (
        <StockMovementFormScreen
          initialMovementType={stockMovementFormContext.movementType}
          initialStockItem={stockMovementFormContext.stockItem}
          onBack={() => setActiveScreen(APP_SCREENS.STOCK_ITEMS)}
          onSaved={(savedId) => {
            setStockItemsViewState({ selectedStockItemId: savedId });
            setActiveScreen(APP_SCREENS.STOCK_ITEMS);
          }}
        />
      );
    }

    if (activeScreen === APP_SCREENS.WORKSHOP_SETTINGS) {
      return (
        <AssociationSettingsScreen
          onBack={() => setActiveScreen(APP_SCREENS.MORE)}
          userProfile={userProfile}
        />
      );
    }

    if (activeScreen === APP_SCREENS.COLLABORATORS) {
      return (
        <TeamAccessScreen
          onBack={() => setActiveScreen(APP_SCREENS.MORE)}
          screenMode="collaborators"
          userProfile={userProfile}
        />
      );
    }

    if (activeScreen === APP_SCREENS.MORE) {
      return (
        <WorkshopMoreScreen
          onBack={() => setActiveScreen(APP_SCREENS.HOME)}
          onOpenCollaborators={() => {
            setMemberInvitationContext({ role: "TODOS", memberId: null });
            setActiveScreen(APP_SCREENS.MEMBER_INVITATIONS);
          }}
          onOpenOnboarding={() => setShowOnboarding(true)}
          onOpenStockItems={() => {
            setStockItemsViewState({ selectedStockItemId: null });
            setActiveScreen(APP_SCREENS.STOCK_ITEMS);
          }}
          onOpenWorkshopManagement={() => setActiveScreen(APP_SCREENS.MORE)}
          onOpenWorkshopSettings={() =>
            setActiveScreen(APP_SCREENS.WORKSHOP_SETTINGS)
          }
          onSignOut={signOutUser}
          onToggleTheme={toggleTheme}
          themeLabel={
            isDarkMode ? "Cambiar a modo claro" : "Cambiar a modo oscuro"
          }
        />
      );
    }

    // default: HOME
    return (
      <WorkshopHomeScreen
        onOpenPropietarios={() => setActiveScreen(APP_SCREENS.PROPIETARIOS)}
        onOpenFiscales={() => setActiveScreen(APP_SCREENS.FISCALES)}
        onOpenTraza={() => {
          setTrazaViewState({ unit: null });
          setActiveScreen(APP_SCREENS.TRAZA);
        }}
        onOpenFiscalRecord={(vehicle) => {
          setFiscalRecordContext({ unit: vehicle || null });
          setActiveScreen(APP_SCREENS.FISCAL_RECORD_FORM);
        }}
        onOpenNotifications={() => setActiveScreen(APP_SCREENS.NOTIFICATIONS)}
        onSignOut={signOutUser}
        currentRole={currentRole}
        userProfile={userProfile}
      />
    );
  };

  return (
    <>
      <StatusBar style={isDarkMode ? "light" : "dark"} />
      <View style={styles.shell}>
        <View style={styles.content}>{renderScreen()}</View>
        <WorkshopTabBar
          activeTab={activeTab}
          onChange={handleTabChange}
          visibleTabs={visibleTabs}
        />
      </View>
    </>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <AuthProvider>
          <AppContent />
        </AuthProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  shell: { flex: 1 },
  content: { flex: 1 },
});
