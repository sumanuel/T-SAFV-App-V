import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import WorkshopScreenHeader from "../components/common/WorkshopScreenHeader";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { updateAssociation } from "../services/associations/associationService";
import { pickAssociationLogo } from "../services/media/logoPicker";
import { parseSocialLinks } from "../utils/associationDraft";
import { isAssociationCreator } from "../utils/associationAccess";
import {
  buildAssociationForm,
  buildAssociationUpdatePayload,
  getLogoPreview,
} from "../utils/associationForm";
import { borderRadius, rf, spacing } from "../utils/responsive";
import LabeledField from "./associationSettings/LabeledField";
import LogoEditor from "./associationSettings/LogoEditor";

export default function AssociationSettingsScreen({ onBack, userProfile }) {
  const { colors } = useTheme();
  const {
    activeAssociation,
    activeAssociationId,
    authBusy,
    refreshAssociations,
    token,
  } = useAuth();
  const canManageAssociation = isAssociationCreator(
    userProfile,
    activeAssociation,
  );
  const [form, setForm] = useState(buildAssociationForm());
  const [submitting, setSubmitting] = useState(false);
  const logoPreview = getLogoPreview(form);

  useEffect(() => {
    setForm(buildAssociationForm(activeAssociation));
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
    setForm((current) => ({ ...current, [key]: value }));
  };

  const handlePickLogo = async () => {
    try {
      const nextLogo = await pickAssociationLogo();
      if (!nextLogo) return;
      setForm((current) => ({
        ...current,
        logo_data: nextLogo,
        logo_url: "",
      }));
    } catch (error) {
      Alert.alert(
        "Asociaciones",
        error?.message || "No se pudo seleccionar el logo de la asociación.",
      );
    }
  };

  const handleSave = async () => {
    if (!form.nombre.trim()) {
      Alert.alert("Asociaciones", "Ingresa el nombre de la asociación activa.");
      return;
    }

    const social = parseSocialLinks(form.redes_sociales);
    if (!social.ok) {
      Alert.alert(
        "Redes sociales inválidas",
        'Si indicas redes sociales, usa un JSON válido. Ejemplo: {"instagram":"@mi_asociacion"}',
      );
      return;
    }

    try {
      setSubmitting(true);
      await updateAssociation(
        token,
        activeAssociationId,
        buildAssociationUpdatePayload(form, social.value),
      );
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
                style={[
                  styles.activeBadge,
                  { backgroundColor: colors.primary },
                ]}
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

              <LabeledField
                label="Nombre"
                value={form.nombre}
                onChangeText={(value) => updateField("nombre", value)}
              />
              <LabeledField
                label="RIF"
                value={form.rif}
                onChangeText={(value) => updateField("rif", value)}
              />
              <LabeledField
                label="Dirección fiscal"
                value={form.direccion_fiscal}
                onChangeText={(value) => updateField("direccion_fiscal", value)}
                multiline
              />
              <LabeledField
                label="Correo"
                value={form.email}
                onChangeText={(value) => updateField("email", value)}
                autoCapitalize="none"
                keyboardType="email-address"
              />
              <LabeledField
                label="Teléfonos"
                value={form.telefonos}
                onChangeText={(value) => updateField("telefonos", value)}
              />
              <LabeledField
                label="Logo URL"
                value={form.logo_url}
                onChangeText={(value) => updateField("logo_url", value)}
                autoCapitalize="none"
              />

              <LogoEditor
                logoPreview={logoPreview}
                onPick={handlePickLogo}
                onClear={() =>
                  setForm((current) => ({
                    ...current,
                    logo_data: "",
                    logo_url: "",
                  }))
                }
              />

              <LabeledField
                label="Redes sociales (JSON)"
                value={form.redes_sociales}
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
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
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
  primaryAction: {
    minHeight: rf(48),
    borderRadius: borderRadius.xl,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing.lg,
  },
  primaryActionText: { fontSize: rf(14), fontWeight: "800" },
  accessNotice: {
    borderWidth: 1,
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    gap: spacing.sm,
  },
});
