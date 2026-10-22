import { Ionicons } from "@expo/vector-icons";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useTheme } from "../../context/ThemeContext";
import { borderRadius, rf, spacing } from "../../utils/responsive";

// Fila tocable con icono, titulo y descripcion corta (accesos directos).
export default function ShortcutRow({ icon, title, subtitle, onPress }) {
  const { colors } = useTheme();

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      style={[
        styles.row,
        { backgroundColor: colors.cardMuted, borderColor: colors.border },
      ]}
    >
      <View
        style={[styles.iconBadge, { backgroundColor: colors.cardBackground }]}
      >
        <Ionicons name={icon} size={rf(20)} color={colors.primary} />
      </View>
      <View style={styles.copy}>
        <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          {subtitle}
        </Text>
      </View>
      <Ionicons
        name="chevron-forward"
        size={rf(18)}
        color={colors.textTertiary}
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    borderWidth: 1,
    borderRadius: borderRadius.xl,
    padding: spacing.md,
  },
  iconBadge: {
    width: rf(40),
    height: rf(40),
    borderRadius: borderRadius.lg,
    alignItems: "center",
    justifyContent: "center",
  },
  copy: { flex: 1, gap: 2 },
  title: { fontSize: rf(14), fontWeight: "800" },
  subtitle: { fontSize: rf(12), lineHeight: rf(17) },
});
