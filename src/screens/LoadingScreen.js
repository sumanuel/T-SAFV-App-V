import { ActivityIndicator, Image, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTheme } from "../context/ThemeContext";
import { rf, spacing } from "../utils/responsive";

export default function LoadingScreen() {
  const { colors } = useTheme();

  return (
    <SafeAreaView
      style={[styles.safeArea, { backgroundColor: colors.background }]}
    >
      <View style={styles.container}>
        <Image
          source={require("../../assets/adaptive-icon.png")}
          style={styles.logo}
          resizeMode="contain"
        />
        <Text style={[styles.brand, { color: colors.text }]}>T-SAFV</Text>
        <ActivityIndicator color={colors.primary} size="large" />
        <Text style={[styles.title, { color: colors.text }]}>
          Preparando acceso
        </Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          Verificando sesion y perfil de la asociación.
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.md,
    padding: spacing.xl,
  },
  logo: {
    width: 112,
    height: 112,
  },
  brand: {
    fontSize: rf(26),
    fontWeight: "800",
    letterSpacing: 1,
    marginTop: -spacing.sm,
  },
  title: {
    fontSize: rf(22),
    fontWeight: "800",
  },
  subtitle: {
    fontSize: rf(14),
    textAlign: "center",
    lineHeight: rf(20),
  },
});
