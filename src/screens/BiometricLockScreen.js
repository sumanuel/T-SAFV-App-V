import { Ionicons } from "@expo/vector-icons";
import { useEffect, useState } from "react";
import { Image, Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTheme } from "../context/ThemeContext";
import { authenticateWithBiometrics } from "../services/security/biometricAuthService";
import { borderRadius, rf, spacing } from "../utils/responsive";

export default function BiometricLockScreen({ onUnlock, onSignOut }) {
  const { colors } = useTheme();
  const [authenticating, setAuthenticating] = useState(false);
  const [failed, setFailed] = useState(false);

  const tryUnlock = async () => {
    setAuthenticating(true);
    setFailed(false);
    try {
      const success = await authenticateWithBiometrics(
        "Desbloquea T-SAFV para continuar",
      );
      if (success) {
        onUnlock?.();
      } else {
        setFailed(true);
      }
    } finally {
      setAuthenticating(false);
    }
  };

  useEffect(() => {
    tryUnlock();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <SafeAreaView
      style={[styles.safeArea, { backgroundColor: colors.background }]}
    >
      <View style={styles.container}>
        <View
          style={[
            styles.logoWrap,
            { backgroundColor: colors.cardBackground, borderColor: colors.border },
          ]}
        >
          <Image
            source={require("../../assets/icon.png")}
            resizeMode="contain"
            style={styles.logo}
          />
        </View>

        <Text style={[styles.title, { color: colors.text }]}>
          Sesión bloqueada
        </Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          {failed
            ? "No se pudo verificar tu identidad. Intenta de nuevo."
            : "Usa tu huella o Face ID para continuar."}
        </Text>

        <Pressable
          disabled={authenticating}
          onPress={tryUnlock}
          style={[
            styles.unlockBtn,
            { backgroundColor: colors.primary, opacity: authenticating ? 0.7 : 1 },
          ]}
        >
          <Ionicons name="finger-print-outline" size={rf(26)} color={colors.white} />
          <Text style={[styles.unlockBtnText, { color: colors.white }]}>
            {authenticating ? "Verificando..." : "Desbloquear"}
          </Text>
        </Pressable>

        {onSignOut ? (
          <Pressable onPress={onSignOut} style={styles.signOutBtn}>
            <Text style={[styles.signOutText, { color: colors.textSecondary }]}>
              Cerrar sesión
            </Text>
          </Pressable>
        ) : null}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.md,
    padding: spacing.xl,
  },
  logoWrap: {
    width: rf(84),
    height: rf(84),
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  logo: { width: "100%", height: "100%" },
  title: { fontSize: rf(22), fontWeight: "800" },
  subtitle: {
    fontSize: rf(14),
    textAlign: "center",
    lineHeight: rf(20),
    marginBottom: spacing.md,
  },
  unlockBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    borderRadius: borderRadius.pill,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
  },
  unlockBtnText: { fontSize: rf(16), fontWeight: "800" },
  signOutBtn: { marginTop: spacing.lg, padding: spacing.sm },
  signOutText: { fontSize: rf(13), fontWeight: "700" },
});
