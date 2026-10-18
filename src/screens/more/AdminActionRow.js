import { Ionicons } from "@expo/vector-icons";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useTheme } from "../../context/ThemeContext";
import { getAdminActionState } from "../../utils/associationAccess";
import { borderRadius, rf, spacing } from "../../utils/responsive";

export default function AdminActionRow({
  item,
  userProfile,
  activeAssociation,
  onPress,
}) {
  const { colors } = useTheme();
  const actionState = getAdminActionState(
    item.key,
    userProfile,
    activeAssociation,
  );

  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.row,
        {
          backgroundColor: colors.cardMuted,
          borderColor: colors.border,
        },
      ]}
    >
      <View
        style={[styles.iconBadge, { backgroundColor: colors.cardBackground }]}
      >
        <Ionicons
          color={colors[actionState.iconColor]}
          name={item.icon}
          size={rf(20)}
        />
      </View>

      <View style={styles.rowCopy}>
        <View style={styles.rowTopMeta}>
          <Text style={[styles.rowEyebrow, { color: colors.primary }]}>
            {item.eyebrow}
          </Text>
          <View
            style={[
              styles.stateBadge,
              {
                backgroundColor: colors.cardBackground,
                borderColor: colors.border,
              },
            ]}
          >
            <Text
              style={[
                styles.stateBadgeText,
                { color: colors[actionState.stateTone] },
              ]}
            >
              {actionState.stateLabel}
            </Text>
          </View>
        </View>
        <Text style={[styles.rowTitle, { color: colors.text }]}>
          {item.title}
        </Text>
        <Text style={[styles.rowSubtitle, { color: colors.textSecondary }]}>
          {item.subtitle}
        </Text>
      </View>

      <Ionicons
        color={colors.textTertiary}
        name="chevron-forward"
        size={rf(18)}
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    borderWidth: 1,
    borderRadius: borderRadius.xl,
    padding: spacing.md,
    gap: spacing.md,
    flexDirection: "row",
    alignItems: "center",
  },
  iconBadge: {
    width: rf(42),
    height: rf(42),
    borderRadius: borderRadius.md,
    alignItems: "center",
    justifyContent: "center",
  },
  rowCopy: { flex: 1, gap: spacing.xs },
  rowTopMeta: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: spacing.sm,
  },
  rowEyebrow: {
    fontSize: rf(10),
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  stateBadge: {
    borderWidth: 1,
    borderRadius: borderRadius.pill,
    paddingVertical: 4,
    paddingHorizontal: spacing.sm,
  },
  stateBadgeText: {
    fontSize: rf(10),
    fontWeight: "800",
  },
  rowTitle: { fontSize: rf(15), fontWeight: "800" },
  rowSubtitle: { fontSize: rf(12), lineHeight: rf(18) },
});
