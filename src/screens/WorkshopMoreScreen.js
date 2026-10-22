import Constants from "expo-constants";
import { ScrollView, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import ShortcutRow from "../components/common/ShortcutRow";
import WorkshopScreenHeader from "../components/common/WorkshopScreenHeader";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { useBiometricLock } from "../hooks/useBiometricLock";
import { getVisibleAdminItems } from "../utils/associationAccess";
import { spacing } from "../utils/responsive";
import AboutCard from "./more/AboutCard";
import AdminActionRow from "./more/AdminActionRow";
import AppSettingsList from "./more/AppSettingsList";
import AssociationHeroCard from "./more/AssociationHeroCard";
import SectionCard from "./more/SectionCard";

const ADMIN_ITEMS = [
  {
    key: "workshop-settings",
    title: "Datos de la asociación",
    subtitle: "Identidad, logo, contacto y datos fiscales de la asociación.",
    icon: "business-outline",
    eyebrow: "Administracion",
  },
  {
    key: "team",
    title: "Miembros e invitaciones",
    subtitle: "Invitaciones, roles, estados y control de accesos.",
    icon: "people-outline",
    eyebrow: "Administracion",
  },
];

export default function WorkshopMoreScreen({
  onBack,
  onOpenCollaborators,
  onOpenIncidencias,
  onOpenOnboarding,
  onOpenWorkshopSettings,
  onSignOut,
  onToggleTheme,
  themeLabel,
}) {
  const { colors } = useTheme();
  const { activeAssociation, activeAssociationId, associations, userProfile } =
    useAuth();
  const biometric = useBiometricLock();
  const appVersion = Constants?.expoConfig?.version || "-";
  const visibleAdminItems = getVisibleAdminItems(
    ADMIN_ITEMS,
    userProfile,
    activeAssociation,
  );

  return (
    <SafeAreaView
      style={[styles.safeArea, { backgroundColor: colors.background }]}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <WorkshopScreenHeader
          onBack={onBack}
          section="Configuracion"
          subtitle="Agrupa la administración de la asociación y las preferencias de la app en una sola vista ordenada."
          title="Mas opciones"
        />

        <AssociationHeroCard
          associationName={activeAssociation?.nombre}
          userProfile={userProfile}
          associationCount={associations.length}
          hasActiveAssociation={Boolean(activeAssociationId)}
        />

        {onOpenIncidencias ? (
          <SectionCard
            title="Operación"
            subtitle="Registro de eventos de la operación diaria."
          >
            <ShortcutRow
              icon="alert-circle-outline"
              title="Incidencias"
              subtitle="Infracciones y eventos fuera de una fiscalización, con fotos."
              onPress={onOpenIncidencias}
            />
          </SectionCard>
        ) : null}

        {visibleAdminItems.length ? (
          <SectionCard
            title="Administracion"
            subtitle="Configuración de la asociación, miembros e invitaciones."
          >
            <View style={styles.listWrap}>
              {visibleAdminItems.map((item) => (
                <AdminActionRow
                  key={item.key}
                  item={item}
                  userProfile={userProfile}
                  activeAssociation={activeAssociation}
                  onPress={
                    item.key === "workshop-settings"
                      ? onOpenWorkshopSettings
                      : onOpenCollaborators
                  }
                />
              ))}
            </View>
          </SectionCard>
        ) : null}

        <SectionCard
          title="Aplicacion"
          subtitle="Preferencias visuales y acciones de sesion para este dispositivo."
        >
          <AppSettingsList
            themeLabel={themeLabel}
            biometric={biometric}
            onOpenOnboarding={onOpenOnboarding}
            onToggleTheme={onToggleTheme}
            onSignOut={onSignOut}
          />
        </SectionCard>

        <SectionCard
          title="Acerca de"
          subtitle="Identidad visual y versión actual del centro operativo de la asociación."
        >
          <AboutCard appVersion={appVersion} />
        </SectionCard>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  scrollContent: {
    padding: spacing.md,
    paddingBottom: spacing.xxl * 2,
    gap: spacing.md,
  },
  listWrap: { gap: spacing.sm },
});
