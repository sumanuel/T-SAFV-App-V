import { StyleSheet, Text, View } from "react-native";
import { useTheme } from "../../context/ThemeContext";
import { getEstado } from "../../utils/incidencias";
import { borderRadius, rf, spacing } from "../../utils/responsive";

export default function EstadoBadge({ estado }) {
  const { colors } = useTheme();
  const { label, tone } = getEstado(estado);

  return (
    <View
      style={[
        styles.badge,
        { borderColor: colors[tone], backgroundColor: colors.cardMuted },
      ]}
    >
      <Text style={[styles.text, { color: colors[tone] }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    borderWidth: 1,
    borderRadius: borderRadius.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs / 2,
  },
  text: { fontSize: rf(11), fontWeight: "800" },
});
