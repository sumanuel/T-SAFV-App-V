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
import {
  createPropietario,
  updatePropietario,
} from "../services/propietarios/propietarioService";
import { borderRadius, rf, spacing } from "../utils/responsive";

function getEntityId(entity) {
  return entity?.membresia_id || entity?.id || "";
}

export default function PropietarioFormScreen({
  initialPropietario,
  onBack,
  onSaved,
}) {
  const { colors } = useTheme();
  const { token, activeAssociation } = useAuth();
  const asociacionId = activeAssociation?.id;
  const isEditing = Boolean(getEntityId(initialPropietario));

  const [form, setForm] = useState({
    rif_cedula: initialPropietario?.rif_cedula || "",
    nombre: initialPropietario?.nombre || "",
    apellido: initialPropietario?.apellido || "",
    telefono: initialPropietario?.telefono || "",
    email: initialPropietario?.email || "",
    direccion: initialPropietario?.direccion || "",
  });
  const [submitting, setSubmitting] = useState(false);

  const apellidoRef = useRef(null);
  const telefonoRef = useRef(null);
  const emailRef = useRef(null);
  const direccionRef = useRef(null);

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
        await updatePropietario(
          token,
          asociacionId,
          getEntityId(initialPropietario),
          form,
        );
      } else {
        await createPropietario(token, asociacionId, form);
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

  const fields = [
    {
      key: "rif_cedula",
      label: "Identificacion (RIF / Cedula)",
      placeholder: "V-12345678",
      autoCapitalize: "characters",
      returnKeyType: "next",
      onSubmitEditing: () => apellidoRef.current?.focus(),
    },
    {
      key: "nombre",
      label: "Nombre *",
      placeholder: "Nombre del propietario",
      autoCapitalize: "words",
      returnKeyType: "next",
      onSubmitEditing: () => apellidoRef.current?.focus(),
    },
    {
      key: "apellido",
      label: "Apellido",
      placeholder: "Apellido",
      autoCapitalize: "words",
      ref: apellidoRef,
      returnKeyType: "next",
      onSubmitEditing: () => telefonoRef.current?.focus(),
    },
    {
      key: "telefono",
      label: "Telefono",
      placeholder: "0414-0000000",
      keyboardType: "phone-pad",
      ref: telefonoRef,
      returnKeyType: "next",
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
      onSubmitEditing: () => direccionRef.current?.focus(),
    },
    {
      key: "direccion",
      label: "Direccion",
      placeholder: "Direccion del propietario",
      autoCapitalize: "sentences",
      ref: direccionRef,
      returnKeyType: "done",
      multiline: true,
    },
  ];

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.container}>
          <WorkshopScreenHeader
            onBack={onBack}
            section="Recepcion"
            title={isEditing ? "Editar propietario" : "Nuevo propietario"}
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
            {fields.map(({ key, label, ref, ...inputProps }) => (
              <View key={key} style={styles.fieldWrap}>
                <Text style={[styles.label, { color: colors.textSecondary }]}>
                  {label}
                </Text>
                <TextInput
                  ref={ref}
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
          </View>

          <Pressable
            onPress={handleSubmit}
            disabled={submitting}
            style={[
              styles.submitBtn,
              { backgroundColor: submitting ? colors.border : colors.primary },
            ]}
          >
            {submitting ? (
              <ActivityIndicator color={colors.white} size="small" />
            ) : (
              <>
                <Ionicons
                  name={isEditing ? "save-outline" : "person-add-outline"}
                  size={rf(18)}
                  color={colors.white}
                />
                <Text style={[styles.submitText, { color: colors.white }]}>
                  {isEditing ? "Guardar cambios" : "Crear propietario"}
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
