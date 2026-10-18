import { Ionicons } from "@expo/vector-icons";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useTheme } from "../../context/ThemeContext";
import { borderRadius, rf, spacing } from "../../utils/responsive";

// Se muestra cuando fallo la carga de asociaciones (no equivale a "sin asociacion").
export default function AssociationLoadError({ retrying, onRetry }) {
  const { colors } = useTheme();

  return (
    <View
      style={[
        styles.noAssocBlock,
        {
          backgroundColor: colors.cardBackground,
          borderColor: colors.border,
        },
      ]}
    >
      <Ionicons
        name="cloud-offline-outline"
        size={rf(40)}
        color={colors.textTertiary}
      />
      <Text style={[styles.noAssocTitle, { color: colors.text }]}>
        No se pudo cargar tu información
      </Text>
      <Text style={[styles.noAssocMsg, { color: colors.textSecondary }]}>
        Ocurrió un problema al conectar con el servidor. Verifica tu conexión e
        intenta de nuevo.
      </Text>
      <Pressable
        disabled={retrying}
        onPress={onRetry}
        style={[
          styles.createAssocBtn,
          {
            backgroundColor: colors.primary,
            opacity: retrying ? 0.7 : 1,
          },
        ]}
      >
        {retrying ? (
          <ActivityIndicator size="small" color={colors.white} />
        ) : (
          <Ionicons name="refresh-outline" size={rf(18)} color={colors.white} />
        )}
        <Text style={[styles.createAssocBtnText, { color: colors.white }]}>
          Reintentar
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  noAssocBlock: {
    borderWidth: 1,
    borderRadius: borderRadius.xl,
    padding: spacing.xxl,
    alignItems: "center",
    gap: spacing.lg,
  },
  noAssocTitle: { fontSize: rf(18), fontWeight: "800", textAlign: "center" },
  noAssocMsg: { fontSize: rf(14), textAlign: "center", lineHeight: rf(20) },
  createAssocBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    borderRadius: borderRadius.xl,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
  },
  createAssocBtnText: { fontSize: rf(15), fontWeight: "800" },
});
