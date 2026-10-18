import { StyleSheet, Text, TextInput, View } from "react-native";
import { useTheme } from "../../context/ThemeContext";
import { borderRadius, rf, spacing } from "../../utils/responsive";

// Una tarjeta de campos. `startIndex` es la posicion global de su primer campo
// y `inputRefs` la lista de referencias de todos los campos del formulario, para
// que "siguiente" en el teclado enfoque el campo que sigue aunque sea de otra
// seccion.
export default function VehicleFormSection({
  section,
  startIndex,
  inputRefs,
  draft,
  onChange,
  onFocusScroll,
}) {
  const { colors } = useTheme();
  const lastIndex = inputRefs.length - 1;

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
      <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>
        {section.title}
      </Text>
      {section.fields.map((field, offset) => {
        const index = startIndex + offset;
        const isLast = index === lastIndex;
        return (
          <View key={field.key} style={styles.fieldWrap}>
            <Text style={[styles.label, { color: colors.textSecondary }]}>
              {field.label}
            </Text>
            <TextInput
              ref={inputRefs[index]}
              value={draft[field.key]}
              onChangeText={(value) => onChange(field.key, value)}
              placeholder={field.placeholder}
              placeholderTextColor={colors.textTertiary}
              autoCapitalize={field.autoCapitalize}
              keyboardType={field.keyboardType}
              returnKeyType={isLast ? "done" : "next"}
              onFocus={() => onFocusScroll(field.scrollY)}
              onSubmitEditing={
                isLast ? undefined : () => inputRefs[index + 1].current?.focus()
              }
              style={[
                styles.input,
                {
                  backgroundColor: colors.inputBackground,
                  borderColor: colors.border,
                  color: colors.text,
                },
              ]}
            />
          </View>
        );
      })}
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
  sectionLabel: {
    fontSize: rf(11),
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.6,
    marginBottom: spacing.xs,
  },
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
});
