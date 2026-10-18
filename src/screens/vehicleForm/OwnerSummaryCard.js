import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { useTheme } from "../../context/ThemeContext";
import { getFullName } from "../../utils/propietarios";
import { borderRadius, rf, spacing } from "../../utils/responsive";

// Propietario al que se asocia la unidad (solo informativo).
export default function OwnerSummaryCard({
  loading,
  propietarios,
  selectedId,
}) {
  const { colors } = useTheme();
  const owner =
    propietarios.find(
      (p) => String(p.id || p.membresia_id) === String(selectedId),
    ) || propietarios[0];

  return (
    <View
      style={[
        styles.sectionCard,
        {
          backgroundColor: colors.cardBackground,
          borderColor: colors.border,
        },
      ]}
    >
      <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>
        Propietario *
      </Text>
      {loading ? (
        <ActivityIndicator color={colors.primary} size="small" />
      ) : owner ? (
        <View
          style={[
            styles.ownerOption,
            {
              backgroundColor: colors.cardMuted,
              borderColor: colors.border,
            },
          ]}
        >
          <Text style={[styles.ownerText, { color: colors.text }]}>
            {getFullName(owner) || "Propietario sin nombre"}
          </Text>
          <Text style={[styles.ownerMeta, { color: colors.textSecondary }]}>
            {owner.rif_cedula || "Sin cédula"}
          </Text>
        </View>
      ) : (
        <Text style={[styles.noOwnersText, { color: colors.textSecondary }]}>
          No hay propietarios. Registra uno primero.
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  sectionCard: {
    borderWidth: 1,
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    gap: spacing.sm,
  },
  sectionLabel: {
    fontSize: rf(11),
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.6,
    marginBottom: spacing.xs,
  },
  ownerOption: {
    borderWidth: 1,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    gap: spacing.xs / 2,
  },
  ownerText: { fontSize: rf(14), fontWeight: "700" },
  ownerMeta: { fontSize: rf(12) },
  noOwnersText: { fontSize: rf(13), lineHeight: rf(19) },
});
