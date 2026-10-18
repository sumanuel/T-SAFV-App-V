import { StyleSheet, Text, View } from "react-native";
import { useTheme } from "../../context/ThemeContext";
import { borderRadius, rf, spacing } from "../../utils/responsive";

export default function SectionCard({ title, subtitle, children }) {
  const { colors } = useTheme();

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
      <Text style={[styles.sectionTitle, { color: colors.text }]}>{title}</Text>
      <Text style={[styles.sectionSubtitle, { color: colors.textSecondary }]}>
        {subtitle}
      </Text>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  sectionCard: {
    borderWidth: 1,
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    gap: spacing.md,
  },
  sectionTitle: {
    fontSize: rf(17),
    fontWeight: "800",
  },
  sectionSubtitle: {
    fontSize: rf(13),
    lineHeight: rf(19),
  },
});
