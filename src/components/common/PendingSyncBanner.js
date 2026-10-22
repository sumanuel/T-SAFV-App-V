import { Ionicons } from "@expo/vector-icons";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useTheme } from "../../context/ThemeContext";
import { KIND_LABELS } from "../../services/offline/outbox";
import { borderRadius, rf, spacing } from "../../utils/responsive";

const plural = (n, one, many) => `${n} ${n === 1 ? one : many}`;

// Aviso de fiscalizaciones e incidencias guardadas en el telefono que aun no
// llegaron al servidor (pendientes) o que el servidor rechazo (fallidas).
export default function PendingSyncBanner({
  pending,
  failed,
  syncing,
  onRetry,
  onDiscard,
}) {
  const { colors } = useTheme();

  if (!pending.length && !failed.length) return null;

  const confirmDiscard = (item) => {
    Alert.alert(
      `Descartar ${KIND_LABELS[item.kind] || "registro"}`,
      `No se pudo enviar: ${item.lastError || "error desconocido"}.\n\n¿Descartarla definitivamente?`,
      [
        { text: "Conservar", style: "cancel" },
        {
          text: "Descartar",
          style: "destructive",
          onPress: () => onDiscard(item.id),
        },
      ],
    );
  };

  return (
    <View style={styles.wrap}>
      {pending.length > 0 ? (
        <View
          accessibilityRole="alert"
          style={[
            styles.banner,
            {
              backgroundColor: colors.cardBackground,
              borderColor: colors.warning,
            },
          ]}
        >
          <Ionicons
            name="cloud-upload-outline"
            size={rf(18)}
            color={colors.warning}
          />
          <Text style={[styles.text, { color: colors.text }]}>
            {plural(
              pending.length,
              "registro pendiente",
              "registros pendientes",
            )}{" "}
            de envío
          </Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Reintentar envío"
            disabled={syncing}
            onPress={onRetry}
            style={[
              styles.action,
              { backgroundColor: colors.primary, opacity: syncing ? 0.7 : 1 },
            ]}
          >
            {syncing ? (
              <ActivityIndicator size="small" color={colors.white} />
            ) : (
              <Text style={[styles.actionText, { color: colors.white }]}>
                Reintentar
              </Text>
            )}
          </Pressable>
        </View>
      ) : null}

      {failed.length > 0 ? (
        <View
          accessibilityRole="alert"
          style={[
            styles.banner,
            {
              backgroundColor: colors.cardBackground,
              borderColor: colors.danger,
            },
          ]}
        >
          <Ionicons
            name="alert-circle-outline"
            size={rf(18)}
            color={colors.danger}
          />
          <Text style={[styles.text, { color: colors.text }]}>
            {plural(
              failed.length,
              "registro fue rechazado",
              "registros fueron rechazados",
            )}
          </Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Revisar registros rechazados"
            onPress={() => confirmDiscard(failed[0])}
            style={[styles.action, { backgroundColor: colors.danger }]}
          >
            <Text style={[styles.actionText, { color: colors.white }]}>
              Revisar
            </Text>
          </Pressable>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.xs,
    gap: spacing.xs,
  },
  banner: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    borderWidth: 1,
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  text: { flex: 1, fontSize: rf(12), fontWeight: "600" },
  action: {
    minWidth: rf(74),
    alignItems: "center",
    justifyContent: "center",
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  actionText: { fontSize: rf(12), fontWeight: "700" },
});
