import { Pressable, StyleSheet, Text, View } from "react-native";
import { useTheme } from "../../context/ThemeContext";
import { ROLE_FILTERS, getRoleFilterLabel } from "../../utils/invitations";
import { borderRadius, rf, spacing } from "../../utils/responsive";

export default function RoleFilterChips({ value, onChange }) {
  const { colors } = useTheme();

  return (
    <View style={styles.filterRow}>
      {ROLE_FILTERS.map((role) => {
        const active = role === value;
        return (
          <Pressable
            key={role}
            accessibilityRole="button"
            accessibilityState={{ selected: active }}
            onPress={() => onChange(role)}
            style={[
              styles.filterChip,
              {
                backgroundColor: active
                  ? colors.primary
                  : colors.cardBackground,
                borderColor: active ? colors.primary : colors.border,
              },
            ]}
          >
            <Text
              style={[
                styles.filterChipText,
                { color: active ? colors.white : colors.text },
              ]}
            >
              {getRoleFilterLabel(role)}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  filterRow: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
  filterChip: {
    borderWidth: 1,
    borderRadius: borderRadius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  filterChipText: { fontSize: rf(12), fontWeight: "800" },
});
