import { Ionicons } from "@expo/vector-icons";
import { Image, StyleSheet, Text, View } from "react-native";
import { useTheme } from "../../context/ThemeContext";
import { borderRadius, rf, spacing } from "../../utils/responsive";

const ROLE_LABELS = {
  administrator: "Administrador",
  owner: "Propietario",
  fiscal: "Fiscal",
};

export default function ActiveAssociationCard({ association, userProfile }) {
  const { colors } = useTheme();

  return (
    <View
      style={[
        styles.associationCard,
        {
          backgroundColor: colors.cardBackground,
          borderColor: colors.border,
        },
      ]}
    >
      <View style={styles.associationCardHeader}>
        <View
          style={[
            styles.associationLogoWrap,
            {
              backgroundColor: colors.cardMuted,
              borderColor: colors.border,
            },
          ]}
        >
          {association?.logo_data || association?.logo_url ? (
            <Image
              source={{ uri: association.logo_data || association.logo_url }}
              style={styles.associationLogoImage}
            />
          ) : (
            <Ionicons
              name="business-outline"
              size={rf(28)}
              color={colors.primary}
            />
          )}
        </View>
        <View style={styles.associationCardCopy}>
          <Text style={[styles.associationEyebrow, { color: colors.primary }]}>
            Asociación activa
          </Text>
          <Text style={[styles.associationTitle, { color: colors.text }]}>
            {association?.nombre || "Sin asociación"}
          </Text>
          <Text
            style={[
              styles.associationSubtitle,
              { color: colors.textSecondary },
            ]}
          >
            {association?.rif || "Sin RIF"}
          </Text>
        </View>
      </View>

      <View style={styles.associationInfoList}>
        <Text style={[styles.associationInfoText, { color: colors.text }]}>
          <Text style={styles.associationInfoStrong}>Dirección:</Text>{" "}
          {association?.direccion_fiscal || "Sin dirección fiscal"}
        </Text>
        <Text style={[styles.associationInfoText, { color: colors.text }]}>
          <Text style={styles.associationInfoStrong}>Teléfono:</Text>{" "}
          {association?.telefonos || "Sin teléfonos"}
        </Text>
        <Text style={[styles.associationInfoText, { color: colors.text }]}>
          <Text style={styles.associationInfoStrong}>Usuario:</Text>{" "}
          {userProfile?.fullName || userProfile?.email || "Sin usuario"}
        </Text>
        <Text style={[styles.associationInfoText, { color: colors.text }]}>
          <Text style={styles.associationInfoStrong}>Perfil:</Text>{" "}
          {ROLE_LABELS[userProfile?.role] || userProfile?.role || "Sin perfil"}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  associationCard: {
    borderWidth: 1,
    borderRadius: borderRadius.xl,
    padding: spacing.md,
    gap: spacing.md,
  },
  associationCardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
  associationLogoWrap: {
    width: rf(58),
    height: rf(58),
    borderWidth: 1,
    borderRadius: borderRadius.lg,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  associationLogoImage: {
    width: "100%",
    height: "100%",
  },
  associationCardCopy: { flex: 1, gap: spacing.xs / 2 },
  associationEyebrow: {
    fontSize: rf(11),
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 0.7,
  },
  associationTitle: { fontSize: rf(18), fontWeight: "900" },
  associationSubtitle: { fontSize: rf(13), lineHeight: rf(18) },
  associationInfoList: { gap: spacing.xs },
  associationInfoText: { fontSize: rf(13), lineHeight: rf(18) },
  associationInfoStrong: { fontWeight: "800" },
});
