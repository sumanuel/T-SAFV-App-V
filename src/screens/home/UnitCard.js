import { Ionicons } from "@expo/vector-icons";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useTheme } from "../../context/ThemeContext";
import { borderRadius, rf, spacing } from "../../utils/responsive";

export default function UnitCard({ unit, isFiscalUser, onPress }) {
  const { colors } = useTheme();
  const ownerName = [unit.propietario_nombre, unit.propietario_apellido]
    .filter(Boolean)
    .join(" ");

  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.unitCard,
        {
          backgroundColor: colors.cardBackground,
          borderColor: colors.border,
        },
      ]}
    >
      <View style={styles.unitCardTopRow}>
        <View
          style={[
            styles.unitPill,
            {
              backgroundColor: colors.cardMuted,
              borderColor: colors.border,
            },
          ]}
        >
          <Ionicons name="bus-outline" size={rf(14)} color={colors.primary} />
          <Text style={[styles.unitPillText, { color: colors.primary }]}>
            Unidad
          </Text>
        </View>
        <View style={[styles.unitActionPill, { borderColor: colors.primary }]}>
          <Text style={[styles.unitActionText, { color: colors.primary }]}>
            {isFiscalUser ? "Fiscalizar" : "Ver traza"}
          </Text>
        </View>
      </View>
      <Text style={[styles.unitTitle, { color: colors.text }]}>
        {[unit.marca, unit.modelo, unit.ano].filter(Boolean).join(" ") ||
          "Unidad sin descripción"}
      </Text>
      <Text style={[styles.unitCode, { color: colors.accent }]}>
        Unidad N° {unit.numero_unidad || unit.id}
      </Text>
      <Text style={[styles.unitAccent, { color: colors.primary }]}>
        Placa: {unit.placa || "Sin placa"}
      </Text>
      {ownerName ? (
        <Text style={[styles.unitMeta, { color: colors.textSecondary }]}>
          Propietario: {ownerName}
        </Text>
      ) : null}
      <Text style={[styles.unitOwner, { color: colors.textTertiary }]}>
        Chofer: {unit.ultimo_chofer || unit.chofer || "Sin chofer"}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  unitCard: {
    borderWidth: 1,
    borderRadius: borderRadius.xl,
    padding: spacing.md,
    gap: spacing.sm,
  },
  unitCardTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.sm,
  },
  unitPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    alignSelf: "flex-start",
    borderWidth: 1,
    borderRadius: borderRadius.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  unitPillText: { fontSize: rf(10), fontWeight: "800" },
  unitActionPill: {
    borderWidth: 1,
    borderRadius: borderRadius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  unitActionText: { fontSize: rf(11), fontWeight: "800" },
  unitTitle: { fontSize: rf(17), fontWeight: "800" },
  unitAccent: { fontSize: rf(14), fontWeight: "900" },
  unitCode: { fontSize: rf(18), fontWeight: "800" },
  unitMeta: { fontSize: rf(13), lineHeight: rf(18) },
  unitOwner: { fontSize: rf(12), lineHeight: rf(18) },
});
