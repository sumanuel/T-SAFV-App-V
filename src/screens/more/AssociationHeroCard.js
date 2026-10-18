import { StyleSheet, Text, View } from "react-native";
import { useTheme } from "../../context/ThemeContext";
import { getRoleLabel } from "../../utils/associationAccess";
import { borderRadius, rf, spacing } from "../../utils/responsive";

export default function AssociationHeroCard({
  associationName,
  userProfile,
  associationCount,
  hasActiveAssociation,
}) {
  const { colors } = useTheme();

  return (
    <View
      style={[
        styles.heroCard,
        {
          backgroundColor: colors.cardBackground,
          borderColor: colors.border,
        },
      ]}
    >
      <View style={styles.heroCopy}>
        <Text style={[styles.heroEyebrow, { color: colors.primary }]}>
          Centro de la asociación
        </Text>
        <Text style={[styles.heroTitle, { color: colors.text }]}>
          {associationName || "Asociación activa"}
        </Text>
        <Text style={[styles.heroSubtitle, { color: colors.textSecondary }]}>
          {userProfile?.fullName || userProfile?.email || "Usuario activo"} ·{" "}
          {getRoleLabel(userProfile?.role)}
        </Text>
      </View>

      <View style={styles.heroStats}>
        <View
          style={[
            styles.heroStat,
            {
              backgroundColor: colors.cardMuted,
              borderColor: colors.primary,
            },
          ]}
        >
          <Text style={[styles.heroStatValue, { color: colors.text }]}>
            {associationCount}
          </Text>
          <Text style={[styles.heroStatLabel, { color: colors.textSecondary }]}>
            {associationCount === 1 ? "Asociación" : "Asociaciones"}
          </Text>
        </View>
        <View
          style={[
            styles.heroStat,
            {
              backgroundColor: colors.cardMuted,
              borderColor: colors.border,
            },
          ]}
        >
          <Text style={[styles.heroStatValue, { color: colors.text }]}>
            {hasActiveAssociation ? "Activa" : "Sin sesión"}
          </Text>
          <Text style={[styles.heroStatLabel, { color: colors.textSecondary }]}>
            Contexto
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  heroCard: {
    borderWidth: 1,
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    gap: spacing.lg,
  },
  heroCopy: {
    gap: spacing.xs,
  },
  heroEyebrow: {
    fontSize: rf(11),
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 0.9,
  },
  heroTitle: {
    fontSize: rf(24),
    fontWeight: "900",
    letterSpacing: -0.7,
  },
  heroSubtitle: {
    fontSize: rf(13),
    lineHeight: rf(19),
  },
  heroStats: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  heroStat: {
    flex: 1,
    borderWidth: 1,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    gap: 2,
  },
  heroStatValue: {
    fontSize: rf(16),
    fontWeight: "800",
  },
  heroStatLabel: {
    fontSize: rf(12),
    fontWeight: "600",
  },
});
