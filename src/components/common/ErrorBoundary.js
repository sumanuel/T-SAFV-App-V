import { Component } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTheme } from "../../context/ThemeContext";
import { logger } from "../../utils/logger";
import { rf, spacing } from "../../utils/responsive";

function ErrorFallback({ onRetry }) {
  const { colors } = useTheme();

  return (
    <SafeAreaView
      style={[styles.safeArea, { backgroundColor: colors.background }]}
    >
      <View style={styles.container}>
        <Ionicons name="alert-circle-outline" size={56} color={colors.danger} />
        <Text style={[styles.title, { color: colors.text }]}>
          Algo salió mal
        </Text>
        <Text style={[styles.message, { color: colors.textSecondary }]}>
          Ocurrió un error inesperado. Puedes intentar de nuevo; si el problema
          continúa, cierra y vuelve a abrir la app.
        </Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Reintentar"
          onPress={onRetry}
          style={({ pressed }) => [
            styles.button,
            { backgroundColor: colors.primary, opacity: pressed ? 0.85 : 1 },
          ]}
        >
          <Text style={[styles.buttonText, { color: colors.white }]}>
            Reintentar
          </Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

export default class ErrorBoundary extends Component {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    logger.error("[ErrorBoundary]", error, info?.componentStack);
  }

  handleRetry = () => {
    this.setState({ hasError: false });
  };

  render() {
    if (this.state.hasError) {
      return <ErrorFallback onRetry={this.handleRetry} />;
    }
    return this.props.children;
  }
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
  title: { fontSize: rf(22), fontWeight: "800" },
  message: { fontSize: rf(14), textAlign: "center", lineHeight: rf(20) },
  button: {
    marginTop: spacing.sm,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: 14,
  },
  buttonText: { fontSize: rf(15), fontWeight: "700" },
});
