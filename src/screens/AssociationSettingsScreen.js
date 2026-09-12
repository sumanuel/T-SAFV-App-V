import { useEffect, useState } from "react";
import * as ImagePicker from "expo-image-picker";
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import WorkshopScreenHeader from "../components/common/WorkshopScreenHeader";
import { USER_ROLES } from "../constants/accessControl";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { updateAssociation } from "../services/associations/associationService";
import { resetActiveWorkshopDataForCurrentUser } from "../services/workshops/workshopResetService";
import { borderRadius, rf, spacing } from "../utils/responsive";

function buildAssociationForm(association) {
  return {
    nombre: association?.nombre || "",
    rif: association?.rif || "",
    direccion_fiscal: association?.direccion_fiscal || "",
    email: association?.email || "",
    telefonos: association?.telefonos || "",
    logo_url: association?.logo_url || "",
    logo_data: association?.logo_data || "",
    redes_sociales: association?.redes_sociales
      ? JSON.stringify(association.redes_sociales, null, 2)
      : "",
  };
}

async function pickAssociationLogo() {
  const permissionResult =
    await ImagePicker.requestMediaLibraryPermissionsAsync();

  if (!permissionResult.granted) {
    throw new Error(
      "Debes permitir acceso a la galería para seleccionar el logo de la asociación.",
    );
  }

  const result = await ImagePicker.launchImageLibraryAsync({
    allowsEditing: true,
    aspect: [1, 1],
    base64: true,
    mediaTypes: ["images"],
    quality: 0.55,
  });

  if (result.canceled || !result.assets?.length) {
    return "";
  }

  const [asset] = result.assets;
  if (!asset?.base64) {
    throw new Error("No se pudo preparar la imagen seleccionada.");
  }

  return `data:${asset.mimeType || "image/jpeg"};base64,${asset.base64}`;
}

export default function AssociationSettingsScreen({ onBack, userProfile }) {
  const { colors } = useTheme();
  const {
    activeAssociation,
    activeAssociationId,
    authBusy,
    memberships,
    refreshAssociations,
    token,
  } = useAuth();
  const activeMembership = memberships[0] || null;
  const currentRole = activeMembership?.role || userProfile?.role;
  const isAssociationCreator =
    currentRole === "administrator" &&
    String(activeAssociation?.creada_por) === String(userProfile?.uid);
  const canManageAssociation = isAssociationCreator;
  const canResetAssociation = isAssociationCreator;
  const [associationForm, setAssociationForm] = useState(
    buildAssociationForm(),
  );
  const [submitting, setSubmitting] = useState(false);
  const [resetSubmitting, setResetSubmitting] = useState(false);

  const logoPreview =
    associationForm.logo_data?.trim() || associationForm.logo_url.trim();

  useEffect(() => {
    setAssociationForm(buildAssociationForm(activeAssociation));
  }, [
    activeAssociation?.direccion_fiscal,
    activeAssociation?.email,
    activeAssociation?.logo_data,
    activeAssociation?.logo_url,
    activeAssociation?.nombre,
    activeAssociation?.redes_sociales,
    activeAssociation?.rif,
    activeAssociation?.telefonos,
  ]);

  const updateField = (key, value) => {
    setAssociationForm((current) => ({ ...current, [key]: value }));
  };

  const handlePickLogo = async () => {
    try {
      const nextLogo = await pickAssociationLogo();
      if (!nextLogo) return;
      updateField("logo_data", nextLogo);
      updateField("logo_url", "");
    } catch (error) {
      Alert.alert(
        "Asociaciones",
        error?.message || "No se pudo seleccionar el logo de la asociación.",
      );
    }
  };

  const handleSave = async () => {
    if (!associationForm.nombre.trim()) {
      Alert.alert("Asociaciones", "Ingresa el nombre de la asociación activa.");
      return;
    }

    try {
      setSubmitting(true);
      const redesSociales = associationForm.redes_sociales.trim()
        ? JSON.parse(associationForm.redes_sociales)
        : undefined;

      await updateAssociation(token, activeAssociationId, {
        nombre: associationForm.nombre,
        rif: associationForm.rif,
        direccion_fiscal: associationForm.direccion_fiscal,
        email: associationForm.email,
        telefonos: associationForm.telefonos,
        logo_url: associationForm.logo_url,
        logo_data: associationForm.logo_data,
        redes_sociales: redesSociales,
      });
      await refreshAssociations();
      Alert.alert(
        "Asociaciones",
        "Los datos de la asociación fueron actualizados.",
      );
    } catch (error) {
      Alert.alert(
        "Asociaciones",
        error?.message || "No se pudo actualizar la asociación activa.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleResetAssociation = () => {
    Alert.alert(
      "Reiniciar asociación",
      "Se eliminarán los registros operativos de la asociación activa. La identidad comercial, la asociación y los colaboradores se conservan. Esta acción no se puede deshacer.",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Reiniciar",
          style: "destructive",
          onPress: async () => {
            try {
              setResetSubmitting(true);
              const result = await resetActiveWorkshopDataForCurrentUser();
              Alert.alert(
                "Asociación reiniciada",
                `Se eliminaron ${result.deletedDocuments} registros operativos de la asociación activa.`,
              );
            } catch (error) {
              Alert.alert(
                "Reiniciar asociación",
                error?.message ||
                  "No se pudo reiniciar la data de la asociación.",
              );
            } finally {
              setResetSubmitting(false);
            }
          },
        },
      ],
    );
  };

  return (
    <SafeAreaView
      style={[styles.safeArea, { backgroundColor: colors.background }]}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={{ flex: 1 }}
      >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <WorkshopScreenHeader
          onBack={onBack}
          section="Configuración"
          title="Datos de la asociación"
          subtitle="Identidad comercial, contexto activo y mantenimiento operativo de la asociación."
        />

        <View
          style={[
            styles.panel,
            {
              backgroundColor: colors.cardBackground,
              borderColor: colors.border,
            },
          ]}
        >
          <Text style={[styles.panelTitle, { color: colors.text }]}>
            Asociación activa
          </Text>
          <Text style={[styles.panelText, { color: colors.textSecondary }]}>
            Identidad y contexto operativo de la asociación seleccionada.
          </Text>

          <View
            style={[
              styles.summaryCard,
              {
                backgroundColor: colors.cardMuted,
                borderColor: colors.primary,
              },
            ]}
          >
            <View style={styles.summaryCopy}>
              <Text style={[styles.summaryTitle, { color: colors.text }]}>
                {activeAssociation?.nombre || "Sin asociación activa"}
              </Text>
              <Text
                style={[styles.summaryMeta, { color: colors.textSecondary }]}
              >
                {activeAssociation?.rif || "Sin RIF"}
              </Text>
            </View>
            <View
              style={[styles.activeBadge, { backgroundColor: colors.primary }]}
            >
              <Text style={[styles.activeBadgeText, { color: colors.white }]}>
                Activa
              </Text>
            </View>
          </View>
        </View>

        {canManageAssociation ? (
          <View
            style={[
              styles.panel,
              {
                backgroundColor: colors.cardBackground,
                borderColor: colors.border,
              },
            ]}
          >
            <Text style={[styles.panelTitle, { color: colors.text }]}>
              Editar asociación
            </Text>
            <Text style={[styles.panelText, { color: colors.textSecondary }]}>
              Actualiza nombre, RIF, dirección fiscal, contacto, logo y redes
              sociales de la asociación activa.
            </Text>

            <Field
              colors={colors}
              label="Nombre"
              value={associationForm.nombre}
              onChangeText={(value) => updateField("nombre", value)}
            />
            <Field
              colors={colors}
              label="RIF"
              value={associationForm.rif}
              onChangeText={(value) => updateField("rif", value)}
            />
            <Field
              colors={colors}
              label="Dirección fiscal"
              value={associationForm.direccion_fiscal}
              onChangeText={(value) => updateField("direccion_fiscal", value)}
              multiline
            />
            <Field
              colors={colors}
              label="Correo"
              value={associationForm.email}
              onChangeText={(value) => updateField("email", value)}
              autoCapitalize="none"
              keyboardType="email-address"
            />
            <Field
              colors={colors}
              label="Teléfonos"
              value={associationForm.telefonos}
              onChangeText={(value) => updateField("telefonos", value)}
            />
            <Field
              colors={colors}
              label="Logo URL"
              value={associationForm.logo_url}
              onChangeText={(value) => updateField("logo_url", value)}
              autoCapitalize="none"
            />

            <View style={styles.formGroup}>
              <Text style={[styles.fieldLabel, { color: colors.text }]}>
                Logo de la asociación
              </Text>
              <View style={styles.logoActionsRow}>
                <Pressable
                  onPress={handlePickLogo}
                  style={[
                    styles.secondaryFilledAction,
                    styles.logoActionButton,
                    {
                      backgroundColor: colors.cardMuted,
                      borderColor: colors.border,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.secondaryFilledActionText,
                      { color: colors.text },
                    ]}
                  >
                    Seleccionar logo
                  </Text>
                </Pressable>
                <Pressable
                  disabled={!logoPreview}
                  onPress={() => {
                    updateField("logo_data", "");
                    updateField("logo_url", "");
                  }}
                  style={[
                    styles.secondaryAction,
                    styles.logoActionButton,
                    {
                      borderColor: colors.borderStrong,
                      backgroundColor: colors.cardBackground,
                    },
                    !logoPreview ? styles.disabledAction : null,
                  ]}
                >
                  <Text
                    style={[styles.secondaryActionText, { color: colors.text }]}
                  >
                    Quitar logo
                  </Text>
                </Pressable>
              </View>

              {logoPreview ? (
                <View
                  style={[
                    styles.logoPreviewCard,
                    {
                      backgroundColor: colors.cardMuted,
                      borderColor: colors.border,
                    },
                  ]}
                >
                  <Image
                    source={{ uri: logoPreview }}
                    style={styles.logoPreviewImage}
                  />
                  <Text
                    style={[
                      styles.logoPreviewText,
                      { color: colors.textSecondary },
                    ]}
                  >
                    Vista previa del logo de la asociación.
                  </Text>
                </View>
              ) : (
                <View
                  style={[
                    styles.logoPlaceholderCard,
                    {
                      backgroundColor: colors.cardMuted,
                      borderColor: colors.border,
                    },
                  ]}
                >
                  <View
                    style={[
                      styles.logoPlaceholderBadge,
                      {
                        backgroundColor: colors.cardBackground,
                        borderColor: colors.border,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.logoPlaceholderInitials,
                        { color: colors.textSecondary },
                      ]}
                    >
                      LOGO
                    </Text>
                  </View>
                  <Text
                    style={[styles.logoPreviewText, { color: colors.text }]}
                  >
                    Aún no hay logo cargado
                  </Text>
                  <Text
                    style={[styles.rowMeta, { color: colors.textSecondary }]}
                  >
                    Selecciona una imagen o usa una URL para mostrar el logo de
                    la asociación.
                  </Text>
                </View>
              )}
            </View>

            <Field
              colors={colors}
              label="Redes sociales (JSON)"
              value={associationForm.redes_sociales}
              onChangeText={(value) => updateField("redes_sociales", value)}
              multiline
              placeholder='{"instagram":"@mi_asociacion"}'
            />

            <Pressable
              disabled={submitting || authBusy || !activeAssociationId}
              onPress={handleSave}
              style={[
                styles.primaryAction,
                { backgroundColor: colors.primary },
              ]}
            >
              {submitting ? (
                <ActivityIndicator color={colors.white} size="small" />
              ) : (
                <Text
                  style={[styles.primaryActionText, { color: colors.white }]}
                >
                  Guardar datos de la asociación
                </Text>
              )}
            </Pressable>
          </View>
        ) : (
          <View
            style={[
              styles.accessNotice,
              {
                backgroundColor: colors.cardBackground,
                borderColor: colors.border,
              },
            ]}
          >
            <Text style={[styles.panelTitle, { color: colors.text }]}>
              Gestión de la asociación restringida
            </Text>
            <Text style={[styles.panelText, { color: colors.textSecondary }]}>
              Tu perfil puede operar el flujo diario, pero no cambiar la
              identidad comercial ni el contacto de la asociación.
            </Text>
          </View>
        )}

        {canResetAssociation ? (
          <View
            style={[
              styles.resetPanel,
              {
                backgroundColor: colors.cardBackground,
                borderColor: colors.border,
              },
            ]}
          >
            <Text style={[styles.fieldLabel, { color: colors.text }]}>
              Reiniciar datos de la asociación
            </Text>
            <Text style={[styles.panelText, { color: colors.textSecondary }]}>
              Borra toda la data operativa de la asociación activa y conserva la
              identidad comercial y los colaboradores.
            </Text>
            <Pressable
              disabled={resetSubmitting || authBusy}
              onPress={handleResetAssociation}
              style={[
                styles.dangerAction,
                {
                  backgroundColor: colors.cardMuted,
                  borderColor: colors.danger,
                },
              ]}
            >
              <Text style={[styles.dangerActionText, { color: colors.danger }]}>
                {resetSubmitting
                  ? "Reiniciando..."
                  : "Reiniciar datos de la asociación"}
              </Text>
            </Pressable>
          </View>
        ) : null}
      </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function Field({ colors, label, multiline = false, ...props }) {
  return (
    <View style={styles.formGroup}>
      <Text style={[styles.fieldLabel, { color: colors.text }]}>{label}</Text>
      <TextInput
        placeholderTextColor={colors.textTertiary}
        style={[
          styles.input,
          multiline ? styles.notesInput : null,
          {
            backgroundColor: colors.inputBackground,
            borderColor: colors.border,
            color: colors.text,
          },
        ]}
        multiline={multiline}
        textAlignVertical={multiline ? "top" : "center"}
        {...props}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  scrollContent: {
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
    gap: spacing.xl,
  },
  panel: {
    borderWidth: 1,
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    gap: spacing.md,
  },
  panelTitle: { fontSize: rf(17), fontWeight: "800" },
  panelText: { fontSize: rf(13), lineHeight: rf(19) },
  summaryCard: {
    borderWidth: 1,
    borderRadius: borderRadius.xl,
    padding: spacing.md,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.md,
  },
  summaryCopy: { flex: 1, gap: spacing.xs / 2 },
  summaryTitle: { fontSize: rf(15), fontWeight: "800" },
  summaryMeta: { fontSize: rf(12) },
  activeBadge: {
    borderRadius: borderRadius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  activeBadgeText: { fontSize: rf(12), fontWeight: "800" },
  formGroup: { gap: spacing.xs },
  fieldLabel: {
    fontSize: rf(12),
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.6,
  },
  input: {
    borderWidth: 1,
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    fontSize: rf(14),
    minHeight: rf(44),
  },
  notesInput: { minHeight: rf(96) },
  logoActionsRow: { flexDirection: "row", gap: spacing.sm },
  logoActionButton: { flex: 1 },
  logoPreviewCard: {
    borderWidth: 1,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    gap: spacing.sm,
    alignItems: "center",
  },
  logoPreviewImage: {
    width: rf(120),
    height: rf(120),
    borderRadius: borderRadius.lg,
  },
  logoPreviewText: {
    fontSize: rf(12),
    lineHeight: rf(18),
    textAlign: "center",
  },
  logoPlaceholderCard: {
    borderWidth: 1,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    gap: spacing.sm,
    alignItems: "center",
  },
  logoPlaceholderBadge: {
    width: rf(64),
    height: rf(64),
    borderWidth: 1,
    borderRadius: borderRadius.lg,
    alignItems: "center",
    justifyContent: "center",
  },
  logoPlaceholderInitials: { fontSize: rf(11), fontWeight: "800" },
  rowMeta: { fontSize: rf(12), lineHeight: rf(18), textAlign: "center" },
  primaryAction: {
    minHeight: rf(48),
    borderRadius: borderRadius.xl,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing.lg,
  },
  primaryActionText: { fontSize: rf(14), fontWeight: "800" },
  secondaryFilledAction: {
    minHeight: rf(44),
    borderWidth: 1,
    borderRadius: borderRadius.lg,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing.md,
  },
  secondaryFilledActionText: { fontSize: rf(13), fontWeight: "700" },
  secondaryAction: {
    minHeight: rf(44),
    borderWidth: 1,
    borderRadius: borderRadius.lg,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing.md,
  },
  secondaryActionText: { fontSize: rf(13), fontWeight: "700" },
  disabledAction: { opacity: 0.45 },
  accessNotice: {
    borderWidth: 1,
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    gap: spacing.sm,
  },
  resetPanel: {
    borderWidth: 1,
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    gap: spacing.md,
  },
  dangerAction: {
    minHeight: rf(46),
    borderWidth: 1,
    borderRadius: borderRadius.xl,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing.lg,
  },
  dangerActionText: { fontSize: rf(13), fontWeight: "800" },
});
