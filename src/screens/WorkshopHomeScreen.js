import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import WorkshopScreenHeader from "../components/common/WorkshopScreenHeader";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { useUnits } from "../hooks/useUnits";
import { useUnreadNotifications } from "../hooks/useUnreadNotifications";
import { createAssociation } from "../services/associations/associationService";
import {
  EMPTY_ASSOCIATION_DRAFT,
  buildAssociationPayload,
  hasRequiredAssociationFields,
  parseSocialLinks,
} from "../utils/associationDraft";
import { borderRadius, rf, spacing } from "../utils/responsive";
import { filterUnits } from "../utils/unitFilters";
import ActiveAssociationCard from "./home/ActiveAssociationCard";
import AssociationLoadError from "./home/AssociationLoadError";
import CreateAssociationForm from "./home/CreateAssociationForm";
import NoAssociationCard from "./home/NoAssociationCard";
import UnitCard from "./home/UnitCard";

const HEADER_SUBTITLE =
  "Sistema operativo para control y fiscalización de unidades.";

export default function WorkshopHomeScreen({
  onOpenFiscalRecord,
  onOpenNotifications,
  currentRole,
  userProfile,
}) {
  const { colors } = useTheme();
  const {
    token,
    associations,
    associationsLoadError,
    activeAssociation,
    pendingInvitation,
    acceptPendingInvitation,
    refreshAssociations,
  } = useAuth();
  const [retrying, setRetrying] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [draft, setDraft] = useState(EMPTY_ASSOCIATION_DRAFT);
  const [creating, setCreating] = useState(false);

  const hasAssociation = associations.length > 0;
  const associationCreationAccess = userProfile?.associationCreationAccess;
  const canCreateAssociation = associationCreationAccess?.allowed !== false;
  const canStartTrial = Boolean(associationCreationAccess?.can_start_trial);
  const isFiscalUser = currentRole === "fiscal";
  const isOwnerUser = currentRole === "owner";

  const { vehicles, loading } = useUnits({
    token,
    associationId: activeAssociation?.id,
    isOwner: isOwnerUser,
    onError: () => Alert.alert("Unidades", "No se pudo cargar las unidades."),
  });
  const unreadNotifications = useUnreadNotifications(token);
  const filtered = filterUnits(vehicles, searchQuery);

  const handleRetryLoad = async () => {
    setRetrying(true);
    try {
      await refreshAssociations();
    } finally {
      setRetrying(false);
    }
  };

  const handleAcceptInvitation = async () => {
    try {
      await acceptPendingInvitation();
    } catch (error) {
      Alert.alert(
        "Invitación",
        error?.message || "No se pudo aceptar la invitación.",
      );
    }
  };

  const handleCreateAssociation = async () => {
    if (!hasRequiredAssociationFields(draft)) {
      Alert.alert(
        "Datos incompletos",
        "Nombre, RIF, dirección fiscal, correo y teléfonos son obligatorios.",
      );
      return;
    }

    const social = parseSocialLinks(draft.redes_sociales);
    if (!social.ok) {
      Alert.alert(
        "Redes sociales inválidas",
        'Si indicas redes sociales, usa un JSON válido. Ejemplo: {"instagram":"@mi_asociacion"}',
      );
      return;
    }

    setCreating(true);
    try {
      await createAssociation(
        token,
        buildAssociationPayload(draft, social.value),
      );
      await refreshAssociations();
      setShowCreateForm(false);
      setDraft(EMPTY_ASSOCIATION_DRAFT);
    } catch (error) {
      Alert.alert("Error", error?.message || "No se pudo crear la asociación.");
    } finally {
      setCreating(false);
    }
  };

  if (!hasAssociation && associationsLoadError) {
    return (
      <SafeAreaView
        style={[styles.safe, { backgroundColor: colors.background }]}
      >
        <ScrollView contentContainerStyle={styles.container}>
          <WorkshopScreenHeader
            section="Fiscalización"
            title="T-SAFV"
            subtitle={HEADER_SUBTITLE}
          />
          <AssociationLoadError retrying={retrying} onRetry={handleRetryLoad} />
        </ScrollView>
      </SafeAreaView>
    );
  }

  if (!hasAssociation) {
    return (
      <SafeAreaView
        style={[styles.safe, { backgroundColor: colors.background }]}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          style={{ flex: 1 }}
        >
          <ScrollView
            contentContainerStyle={styles.container}
            keyboardShouldPersistTaps="handled"
          >
            <WorkshopScreenHeader
              section="Fiscalización"
              title="T-SAFV"
              subtitle={HEADER_SUBTITLE}
            />
            {showCreateForm ? (
              <CreateAssociationForm
                draft={draft}
                onChange={(field, value) =>
                  setDraft((current) => ({ ...current, [field]: value }))
                }
                canStartTrial={canStartTrial}
                creating={creating}
                onCancel={() => setShowCreateForm(false)}
                onSubmit={handleCreateAssociation}
              />
            ) : (
              <NoAssociationCard
                accessMessage={associationCreationAccess?.message}
                canCreate={canCreateAssociation}
                canStartTrial={canStartTrial}
                pendingInvitation={pendingInvitation}
                onStartCreate={() => setShowCreateForm(true)}
                onAcceptInvitation={handleAcceptInvitation}
              />
            )}
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
      <FlatList
        data={loading ? [] : filtered}
        keyExtractor={(unit) => String(unit.id)}
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
        initialNumToRender={8}
        windowSize={7}
        ListHeaderComponent={
          <View style={styles.listHeader}>
            <WorkshopScreenHeader
              badgeImageSource={require("../../assets/icon.png")}
              section="Fiscalización"
              title="T-SAFV"
              subtitle={HEADER_SUBTITLE}
              rightAction={
                onOpenNotifications
                  ? {
                      icon: "notifications-outline",
                      label: "Notificaciones",
                      onPress: onOpenNotifications,
                      badgeCount: unreadNotifications,
                    }
                  : undefined
              }
            />
            <ActiveAssociationCard
              association={activeAssociation}
              userProfile={userProfile}
            />
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Unidades activas
            </Text>
            <View
              style={[
                styles.searchPanel,
                {
                  backgroundColor: colors.cardBackground,
                  borderColor: colors.border,
                },
              ]}
            >
              <TextInput
                value={searchQuery}
                onChangeText={setSearchQuery}
                placeholder="Buscar por placa, unidad, marca o chofer"
                placeholderTextColor={colors.textTertiary}
                style={[
                  styles.searchInput,
                  {
                    backgroundColor: colors.inputBackground,
                    borderColor: colors.border,
                    color: colors.text,
                  },
                ]}
              />
            </View>
          </View>
        }
        renderItem={({ item }) => (
          <UnitCard
            unit={item}
            isFiscalUser={isFiscalUser}
            onPress={() => onOpenFiscalRecord?.(item)}
          />
        )}
        ListEmptyComponent={
          loading ? (
            <ActivityIndicator
              color={colors.primary}
              style={{ marginTop: spacing.lg }}
            />
          ) : (
            <View
              style={[
                styles.emptyBlock,
                {
                  backgroundColor: colors.cardBackground,
                  borderColor: colors.border,
                },
              ]}
            >
              <Ionicons
                name="car-outline"
                size={rf(32)}
                color={colors.textTertiary}
              />
              <Text style={[styles.emptyTitle, { color: colors.text }]}>
                Sin unidades
              </Text>
              <Text style={[styles.emptyMsg, { color: colors.textSecondary }]}>
                Registra propietarios y asígnales unidades para verlas aquí.
              </Text>
            </View>
          )
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  container: {
    padding: spacing.md,
    gap: spacing.md,
    paddingBottom: spacing.xxl * 2,
  },
  listHeader: { gap: spacing.md },
  sectionTitle: {
    fontSize: rf(15),
    fontWeight: "800",
    paddingHorizontal: spacing.xs,
  },
  searchPanel: {
    borderWidth: 1,
    borderRadius: borderRadius.xl,
    padding: spacing.md,
  },
  searchInput: {
    borderWidth: 1,
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    fontSize: rf(14),
    minHeight: rf(44),
  },
  emptyBlock: {
    borderWidth: 1,
    borderRadius: borderRadius.xl,
    padding: spacing.xl,
    alignItems: "center",
    gap: spacing.md,
  },
  emptyTitle: { fontSize: rf(16), fontWeight: "800" },
  emptyMsg: { fontSize: rf(13), textAlign: "center", lineHeight: rf(19) },
});
