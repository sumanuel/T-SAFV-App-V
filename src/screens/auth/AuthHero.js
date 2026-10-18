import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { StyleSheet, Text, View } from "react-native";
import { borderRadius, hs, rf, s, spacing, vs } from "../../utils/responsive";

const HEADLINES = {
  login: {
    kicker: "Acceso seguro",
    title: "T-SAFV",
    subtitle:
      "Inicia sesión para cargar tu espacio de trabajo y sincronizar tus datos de asociación.",
    pills: ["Seguridad", "JWT", "Tu sistema"],
    icons: [
      "cloud-done-outline",
      "shield-checkmark-outline",
      "car-sport-outline",
    ],
  },
  register: {
    kicker: "Registro operativo",
    title: "Crear cuenta",
    subtitle:
      "Registra tu acceso para entrar al panel de fiscalización y sincronizar tu información desde el primer inicio.",
    pills: ["Cuenta nueva", "Perfil", "Sincronización"],
    icons: [
      "person-add-outline",
      "document-text-outline",
      "cloud-upload-outline",
    ],
  },
};

export default function AuthHero({ mode, palette, isDarkMode }) {
  const headline = HEADLINES[mode] || HEADLINES.login;

  return (
    <LinearGradient
      colors={
        isDarkMode
          ? ["#1C5FB8", "#0E366E", "#09111A"]
          : ["#1C5FB8", "#124B97", "#0D2E62"]
      }
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[
        styles.heroCard,
        { shadowColor: palette.shadow, borderColor: palette.border },
      ]}
    >
      <Text style={styles.heroEyebrow}>{headline.kicker}</Text>
      <Text style={styles.heroTitle}>{headline.title}</Text>
      <Text style={styles.heroSubtitle}>{headline.subtitle}</Text>

      <View style={styles.heroHighlights}>
        {headline.pills.map((pill, index) => (
          <View
            key={`${pill}-${index}`}
            style={[
              styles.heroHighlightPill,
              { backgroundColor: palette.accentSoft },
            ]}
          >
            <Ionicons
              color={palette.white}
              name={headline.icons[index] || "ellipse-outline"}
              size={rf(16)}
            />
            <Text style={styles.heroHighlightText}>{pill}</Text>
          </View>
        ))}
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  heroCard: {
    borderRadius: borderRadius.xl,
    borderCurve: "continuous",
    padding: spacing.xl,
    gap: vs(10),
    shadowOffset: { width: 0, height: s(8) },
    shadowOpacity: 0.12,
    shadowRadius: s(18),
    elevation: 10,
  },
  heroEyebrow: {
    color: "rgba(255,255,255,0.74)",
    fontSize: rf(12),
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  heroTitle: {
    color: "#ffffff",
    fontSize: rf(26),
    fontWeight: "800",
  },
  heroSubtitle: {
    color: "rgba(255,255,255,0.88)",
    fontSize: rf(14),
    lineHeight: vs(20),
  },
  heroHighlights: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: hs(10),
    marginTop: vs(8),
  },
  heroHighlightPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: hs(6),
    borderRadius: borderRadius.xl,
    borderCurve: "continuous",
    paddingHorizontal: hs(12),
    paddingVertical: vs(8),
  },
  heroHighlightText: {
    color: "#ffffff",
    fontSize: rf(12),
    fontWeight: "700",
  },
});
