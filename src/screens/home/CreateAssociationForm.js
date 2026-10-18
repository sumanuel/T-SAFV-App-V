import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useTheme } from "../../context/ThemeContext";
import { borderRadius, rf, spacing } from "../../utils/responsive";

const FIELDS = [
  {
    key: "nombre",
    label: "Nombre *",
    placeholder: "Nombre de la asociacion",
    autoCapitalize: "words",
  },
  {
    key: "rif",
    label: "RIF *",
    placeholder: "J-12345678-9",
    autoCapitalize: "characters",
  },
  {
    key: "direccion_fiscal",
    label: "Dirección fiscal *",
    placeholder: "Dirección fiscal",
    autoCapitalize: "sentences",
  },
  {
    key: "email",
    label: "Correo *",
    placeholder: "correo@asociacion.com",
    autoCapitalize: "none",
    keyboardType: "email-address",
  },
  {
    key: "telefonos",
    label: "Teléfonos *",
    placeholder: "0414-0000000 / 0212-0000000",
  },
  {
    key: "logo_url",
    label: "Logo URL",
    placeholder: "https://...",
    autoCapitalize: "none",
  },
  {
    key: "redes_sociales",
    label: "Redes sociales JSON",
    placeholder: '{"instagram":"@mi_asociacion"}',
    autoCapitalize: "none",
    multiline: true,
  },
];

export default function CreateAssociationForm({
  draft,
  onChange,
  canStartTrial,
  creating,
  onCancel,
  onSubmit,
}) {
  const { colors } = useTheme();

  return (
    <View
      style={[
        styles.formCard,
        {
          backgroundColor: colors.cardBackground,
          borderColor: colors.border,
        },
      ]}
    >
      <Text style={[styles.formTitle, { color: colors.text }]}>
        Nueva asociacion
      </Text>
      {FIELDS.map((field) => (
        <View key={field.key} style={styles.fieldWrap}>
          <Text style={[styles.label, { color: colors.textSecondary }]}>
            {field.label}
          </Text>
          <TextInput
            value={draft[field.key]}
            onChangeText={(value) => onChange(field.key, value)}
            placeholder={field.placeholder}
            placeholderTextColor={colors.textTertiary}
            autoCapitalize={field.autoCapitalize}
            keyboardType={field.keyboardType}
            multiline={field.multiline}
            style={[
              styles.input,
              field.multiline ? styles.multilineInput : null,
              {
                backgroundColor: colors.inputBackground,
                borderColor: colors.border,
                color: colors.text,
              },
            ]}
          />
        </View>
      ))}
      <View style={styles.formActions}>
        <Pressable
          onPress={onCancel}
          style={[
            styles.cancelBtn,
            {
              backgroundColor: colors.cardMuted,
              borderColor: colors.border,
            },
          ]}
        >
          <Text style={[styles.cancelBtnText, { color: colors.text }]}>
            Cancelar
          </Text>
        </Pressable>
        <Pressable
          onPress={onSubmit}
          disabled={creating}
          style={[
            styles.confirmBtn,
            {
              backgroundColor: creating ? colors.border : colors.primary,
            },
          ]}
        >
          {creating ? (
            <ActivityIndicator color={colors.white} size="small" />
          ) : (
            <Text style={[styles.confirmBtnText, { color: colors.white }]}>
              {canStartTrial ? "Crear y activar prueba" : "Crear"}
            </Text>
          )}
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  formCard: {
    borderWidth: 1,
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    gap: spacing.md,
  },
  formTitle: { fontSize: rf(16), fontWeight: "800" },
  fieldWrap: { gap: spacing.xs },
  label: {
    fontSize: rf(12),
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  input: {
    borderWidth: 1,
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    fontSize: rf(14),
    minHeight: rf(44),
  },
  multilineInput: {
    minHeight: rf(88),
    textAlignVertical: "top",
  },
  formActions: { flexDirection: "row", gap: spacing.sm, marginTop: spacing.xs },
  cancelBtn: {
    flex: 1,
    borderWidth: 1,
    borderRadius: borderRadius.lg,
    minHeight: rf(44),
    alignItems: "center",
    justifyContent: "center",
  },
  cancelBtnText: { fontSize: rf(14), fontWeight: "700" },
  confirmBtn: {
    flex: 1,
    borderRadius: borderRadius.lg,
    minHeight: rf(44),
    alignItems: "center",
    justifyContent: "center",
  },
  confirmBtnText: { fontSize: rf(14), fontWeight: "800" },
});
