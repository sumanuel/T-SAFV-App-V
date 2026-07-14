import { Ionicons } from "@expo/vector-icons";
import { useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
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
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { createFiscal, updateFiscal } from "../services/fiscales/fiscalService";
import { borderRadius, rf, spacing } from "../utils/responsive";

const INVITATION_STATES = [
  { value: "PENDIENTE_INVITACION", label: "Pendiente" },
  { value: "INVITACION_ENVIADA", label: "Enviada" },
  { value: "ACEPTADA", label: "Aceptada" },
];

function getEntityId(entity) {
  return entity?.membresia_id || entity?.id || "";
}

export default function FiscalFormScreen({ initialFiscal, onBack, onSaved }) {
  const { colors } = useTheme();
  const { token, activeAssociation } = useAuth();
  const asociacionId = activeAssociation?.id;
  const isEditing = Boolean(getEntityId(initialFiscal));

  const [form, setForm] = useState({
    rif_cedula: initialFiscal?.rif_cedula || "",
    nombre: initialFiscal?.nombre || "",
    apellido: initialFiscal?.apellido || "",
    telefono: initialFiscal?.telefono || "",
    email: initialFiscal?.email || "",
    direccion: initialFiscal?.direccion || "",
    punto_control: initialFiscal?.punto_control || "",
    estado_invitacion:
      initialFiscal?.estado_invitacion || "PENDIENTE_INVITACION",
  });
  const [submitting, setSubmitting] = useState(false);
  const scrollRef = useRef(null);

  const rifRef = useRef(null);
  const nombreRef = useRef(null);
  const apellidoRef = useRef(null);
  const telefonoRef = useRef(null);
  const emailRef = useRef(null);
  const direccionRef = useRef(null);
  const puntoControlRef = useRef(null);

  const focusField = (ref, y) => {
    scrollRef.current?.scrollTo({
      y: Math.max(y - spacing.lg, 0),
      animated: true,
    });
    ref?.current?.focus?.();
  };

  const update = (key, value) =>
    setForm((current) => ({ ...current, [key]: value }));

  const handleSubmit = async () => {
    if (!form.nombre.trim()) {
      Alert.alert("Datos incompletos", "El nombre es obligatorio.");
      return;
    }
    if (!asociacionId) {
      Alert.alert("Sin asociacion", "Selecciona una asociacion activa.");
      return;
    }

    setSubmitting(true);
    try {
      if (isEditing) {
        await updateFiscal(
          token,
          asociacionId,
          getEntityId(initialFiscal),
          form,
        );
      } else {
        await createFiscal(token, asociacionId, form);
      }
      onSaved?.();
    } catch (error) {
      Alert.alert(
        isEditing ? "Error al actualizar" : "Error al crear",
        error?.message || "No se pudo completar la operacion.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView
          ref={scrollRef}
          contentContainerStyle={styles.container}
          keyboardShouldPersistTaps="handled"
        >
          <WorkshopScreenHeader
            onBack={onBack}
            section="Control"
            title={isEditing ? "Editar fiscal" : "Nuevo fiscal"}
            subtitle={
              activeAssociation
                ? activeAssociation.nombre
                : "Sin asociacion activa"
            }
          />

          <View
            style={[
              styles.formCard,
              {
                backgroundColor: colors.cardBackground,
                borderColor: colors.border,
              },
            ]}
          >
            {[
              {
                key: "rif_cedula",
                label: "Identificacion (RIF / Cedula)",
                placeholder: "V-12345678",
                autoCapitalize: "characters",
                ref: rifRef,
                returnKeyType: "next",
                onFocus: () =>
                  scrollRef.current?.scrollTo({ y: 220, animated: true }),
                onSubmitEditing: () => focusField(nombreRef, 280),
              },
              {
                key: "nombre",
                label: "Nombre *",
                placeholder: "Nombre del fiscal",
                autoCapitalize: "words",
                ref: nombreRef,
                returnKeyType: "next",
                onFocus: () =>
                  scrollRef.current?.scrollTo({ y: 280, animated: true }),
                onSubmitEditing: () => apellidoRef.current?.focus(),
              },
              {
                key: "apellido",
                label: "Apellido",
                placeholder: "Apellido",
                autoCapitalize: "words",
                ref: apellidoRef,
                returnKeyType: "next",
                onFocus: () =>
                  scrollRef.current?.scrollTo({ y: 340, animated: true }),
                onSubmitEditing: () => telefonoRef.current?.focus(),
              },
              {
                key: "telefono",
                label: "Telefono",
                placeholder: "0414-0000000",
                keyboardType: "phone-pad",
                ref: telefonoRef,
                returnKeyType: "next",
                onFocus: () =>
                  scrollRef.current?.scrollTo({ y: 400, animated: true }),
                onSubmitEditing: () => emailRef.current?.focus(),
              },
              {
                key: "email",
                label: "Correo electronico",
                placeholder: "correo@ejemplo.com",
                keyboardType: "email-address",
                autoCapitalize: "none",
                ref: emailRef,
                returnKeyType: "next",
                onFocus: () =>
                  scrollRef.current?.scrollTo({ y: 460, animated: true }),
                onSubmitEditing: () => direccionRef.current?.focus(),
              },
              {
                key: "direccion",
                label: "Direccion",
                placeholder: "Direccion",
                autoCapitalize: "sentences",
                ref: direccionRef,
                returnKeyType: "done",
                multiline: true,
                onFocus: () =>
                  scrollRef.current?.scrollTo({ y: 520, animated: true }),
                onSubmitEditing: () => focusField(puntoControlRef, 600),
              },
              {
                key: "punto_control",
                label: "Punto de control",
                placeholder: "Punto o zona asignada",
                autoCapitalize: "sentences",
                ref: puntoControlRef,
                returnKeyType: "done",
                onFocus: () =>
                  scrollRef.current?.scrollTo({ y: 600, animated: true }),
              },
            ].map(({ key, label, ref: fieldRef, ...inputProps }) => (
              <View key={key} style={styles.fieldWrap}>
                <Text style={[styles.label, { color: colors.textSecondary }]}>
                  {label}
                </Text>
                <TextInput
                  ref={fieldRef}
                  value={form[key]}
                  onChangeText={(v) => update(key, v)}
                  placeholderTextColor={colors.textTertiary}
                  style={[
                    styles.input,
                    {
                      backgroundColor: colors.inputBackground,
                      borderColor: colors.border,
                      color: colors.text,
                    },
                  ]}
                  {...inputProps}
                />
              </View>
            ))}

            <View style={styles.fieldWrap}>
              <Text style={[styles.label, { color: colors.textSecondary }]}>
                Estado de invitación
              </Text>
              <View style={styles.stateChipRow}>
                {INVITATION_STATES.map((state) => {
                  const active = form.estado_invitacion === state.value;
                  return (
                    <Pressable
                      key={state.value}
                      onPress={() => update("estado_invitacion", state.value)}
                      style={[
                        styles.stateChip,
                        {
                          backgroundColor: active
                            ? colors.accent
                            : colors.cardMuted,
                          borderColor: active ? colors.accent : colors.border,
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.stateChipText,
                          { color: active ? colors.white : colors.text },
                        ]}
                      >
                        {state.label}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>
          </View>

          <Pressable
            onPress={handleSubmit}
            disabled={submitting}
            style={[
              styles.submitBtn,
              { backgroundColor: submitting ? colors.border : colors.accent },
            ]}
          >
            {submitting ? (
              <ActivityIndicator color={colors.white} size="small" />
            ) : (
              <>
                <Ionicons
                  name={isEditing ? "save-outline" : "shield-checkmark-outline"}
                  size={rf(18)}
                  color={colors.white}
                />
                <Text style={[styles.submitText, { color: colors.white }]}>
                  {isEditing ? "Guardar cambios" : "Crear fiscal"}
                </Text>
              </>
            )}
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
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
  formCard: {
    borderWidth: 1,
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    gap: spacing.md,
  },
  fieldWrap: { gap: spacing.xs },
  label: {
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
  stateChipRow: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
  stateChip: {
    borderWidth: 1,
    borderRadius: borderRadius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  stateChipText: { fontSize: rf(12), fontWeight: "800" },
  submitBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    borderRadius: borderRadius.xl,
    minHeight: rf(52),
    paddingHorizontal: spacing.lg,
  },
  submitText: { fontSize: rf(15), fontWeight: "800" },
});
