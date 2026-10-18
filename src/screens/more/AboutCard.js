import { Image, StyleSheet, Text, View } from "react-native";
import { useTheme } from "../../context/ThemeContext";
import { borderRadius, rf, spacing } from "../../utils/responsive";

export default function AboutCard({ appVersion }) {
  const { colors } = useTheme();

  return (
    <View
      style={[
        styles.aboutCard,
        {
          backgroundColor: colors.cardMuted,
          borderColor: colors.border,
        },
      ]}
    >
      <View
        style={[
          styles.aboutLogoWrap,
          {
            backgroundColor: colors.cardBackground,
            borderColor: colors.border,
          },
        ]}
      >
        <Image
          source={require("../../../assets/icon.png")}
          resizeMode="contain"
          style={styles.aboutLogo}
        />
      </View>

      <View style={styles.aboutCopy}>
        <Text style={[styles.aboutEyebrow, { color: colors.primary }]}>
          T-SAFV
        </Text>
        <Text style={[styles.aboutTitle, { color: colors.text }]}>
          Centro operativo de la asociación
        </Text>
        <Text
          style={[styles.aboutDescription, { color: colors.textSecondary }]}
        >
          Version {appVersion}
        </Text>
      </View>

      <View
        style={[
          styles.versionBadge,
          {
            backgroundColor: colors.cardBackground,
            borderColor: colors.border,
          },
        ]}
      >
        <Text style={[styles.versionBadgeText, { color: colors.text }]}>
          v{appVersion}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  aboutCard: {
    borderWidth: 1,
    borderRadius: borderRadius.xl,
    padding: spacing.md,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
  aboutLogoWrap: {
    width: rf(92),
    height: rf(92),
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: spacing.xs,
  },
  aboutLogo: {
    width: "100%",
    height: "100%",
    borderRadius: borderRadius.md,
  },
  aboutCopy: {
    flex: 1,
    gap: 4,
  },
  aboutEyebrow: {
    fontSize: rf(10),
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  aboutTitle: {
    fontSize: rf(16),
    fontWeight: "800",
  },
  aboutDescription: {
    fontSize: rf(12),
    lineHeight: rf(18),
    fontWeight: "600",
  },
  versionBadge: {
    borderWidth: 1,
    borderRadius: borderRadius.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  versionBadgeText: {
    fontSize: rf(11),
    fontWeight: "800",
  },
});
