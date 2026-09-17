import { Ionicons } from "@expo/vector-icons";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import WorkshopScreenHeader from "../components/common/WorkshopScreenHeader";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import {
  deleteAllNotifications,
  deleteNotification,
  getMyNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from "../services/notifications/notificationService";
import { borderRadius, rf, spacing } from "../utils/responsive";

function iconForType(tipo) {
  switch (tipo) {
    case "fiscalizacion":
      return "shield-checkmark-outline";
    case "trial_activo":
    case "pago_confirmado":
      return "card-outline";
    default:
      return "notifications-outline";
  }
}

function formatDateTime(value) {
  const date = value ? new Date(value) : null;
  if (!date || Number.isNaN(date.getTime())) return "";
  return date.toLocaleString("es-VE");
}

export default function NotificationsScreen({ onBack, onUnreadCountChange }) {
  const { colors } = useTheme();
  const { token } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(
    async (isRefresh = false) => {
      if (!token) return;
      isRefresh ? setRefreshing(true) : setLoading(true);
      try {
        const result = await getMyNotifications(token);
        setNotifications(result.notificaciones || []);
        onUnreadCountChange?.(result.no_leidas || 0);
      } catch (error) {
        Alert.alert(
          "Notificaciones",
          error?.message || "No se pudieron cargar las notificaciones.",
        );
      } finally {
        isRefresh ? setRefreshing(false) : setLoading(false);
      }
    },
    [token, onUnreadCountChange],
  );

  useEffect(() => {
    load();
  }, [load]);

  const handleOpenNotification = async (notification) => {
    if (notification.leida) return;
    setNotifications((current) =>
      current.map((item) =>
        item.id === notification.id ? { ...item, leida: true } : item,
      ),
    );
    onUnreadCountChange?.(
      Math.max(0, notifications.filter((n) => !n.leida).length - 1),
    );
    try {
      await markNotificationRead(token, notification.id);
    } catch (error) {
      // Revertir si falla
      setNotifications((current) =>
        current.map((item) =>
          item.id === notification.id ? { ...item, leida: false } : item,
        ),
      );
    }
  };

  const handleMarkAllRead = async () => {
    const hadUnread = notifications.some((item) => !item.leida);
    if (!hadUnread) return;
    setNotifications((current) => current.map((item) => ({ ...item, leida: true })));
    onUnreadCountChange?.(0);
    try {
      await markAllNotificationsRead(token);
    } catch (error) {
      Alert.alert(
        "Notificaciones",
        error?.message || "No se pudieron marcar como leídas.",
      );
      load();
    }
  };

  const handleDeleteNotification = (notification) => {
    Alert.alert(
      "Eliminar notificación",
      "¿Quieres eliminar esta notificación?",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Eliminar",
          style: "destructive",
          onPress: async () => {
            const previous = notifications;
            setNotifications((current) =>
              current.filter((item) => item.id !== notification.id),
            );
            if (!notification.leida) {
              onUnreadCountChange?.(
                Math.max(0, previous.filter((n) => !n.leida).length - 1),
              );
            }
            try {
              await deleteNotification(token, notification.id);
            } catch (error) {
              setNotifications(previous);
              Alert.alert(
                "Notificaciones",
                error?.message || "No se pudo eliminar la notificación.",
              );
            }
          },
        },
      ],
    );
  };

  const handleDeleteAll = () => {
    if (!notifications.length) return;
    Alert.alert(
      "Eliminar todas",
      "¿Quieres eliminar todas tus notificaciones? Esta acción no se puede deshacer.",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Eliminar todas",
          style: "destructive",
          onPress: async () => {
            const previous = notifications;
            setNotifications([]);
            onUnreadCountChange?.(0);
            try {
              await deleteAllNotifications(token);
            } catch (error) {
              setNotifications(previous);
              Alert.alert(
                "Notificaciones",
                error?.message || "No se pudieron eliminar las notificaciones.",
              );
            }
          },
        },
      ],
    );
  };

  const unreadCount = notifications.filter((item) => !item.leida).length;

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
      <ScrollView
        contentContainerStyle={styles.container}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => load(true)} />
        }
      >
        <WorkshopScreenHeader
          onBack={onBack}
          section="Notificaciones"
          title="Notificaciones"
          subtitle="Avisos sobre tus unidades, invitaciones y periodo de prueba."
          rightAction={
            notifications.length > 0
              ? { icon: "trash-outline", onPress: handleDeleteAll }
              : undefined
          }
        />

        {unreadCount > 0 ? (
          <Pressable onPress={handleMarkAllRead} style={styles.markAllBtn}>
            <Ionicons
              name="checkmark-done-outline"
              size={rf(16)}
              color={colors.primary}
            />
            <Text style={[styles.markAllText, { color: colors.primary }]}>
              Marcar todas como leídas
            </Text>
          </Pressable>
        ) : null}

        {loading ? (
          <View style={styles.loadingBlock}>
            <ActivityIndicator color={colors.primary} />
          </View>
        ) : notifications.length === 0 ? (
          <View
            style={[
              styles.emptyBlock,
              { backgroundColor: colors.cardBackground, borderColor: colors.border },
            ]}
          >
            <Ionicons
              name="notifications-off-outline"
              size={rf(36)}
              color={colors.textTertiary}
            />
            <Text style={[styles.emptyTitle, { color: colors.text }]}>
              Sin notificaciones
            </Text>
            <Text style={[styles.emptyMsg, { color: colors.textSecondary }]}>
              Aquí verás avisos cuando fiscalicen tus unidades o cambie el
              estado de tu asociación.
            </Text>
          </View>
        ) : (
          <View style={styles.list}>
            {notifications.map((item) => (
              <Pressable
                key={item.id}
                onPress={() => handleOpenNotification(item)}
                style={[
                  styles.card,
                  {
                    backgroundColor: item.leida
                      ? colors.cardBackground
                      : colors.cardMuted,
                    borderColor: colors.border,
                  },
                ]}
              >
                <View
                  style={[
                    styles.cardIcon,
                    { backgroundColor: colors.background },
                  ]}
                >
                  <Ionicons
                    name={iconForType(item.tipo)}
                    size={rf(18)}
                    color={colors.primary}
                  />
                </View>
                <View style={styles.cardCopy}>
                  <View style={styles.cardTitleRow}>
                    <Text
                      style={[styles.cardTitle, { color: colors.text }]}
                      numberOfLines={1}
                    >
                      {item.titulo}
                    </Text>
                    {!item.leida ? (
                      <View
                        style={[styles.dot, { backgroundColor: colors.primary }]}
                      />
                    ) : null}
                  </View>
                  {item.cuerpo ? (
                    <Text
                      style={[styles.cardBody, { color: colors.textSecondary }]}
                    >
                      {item.cuerpo}
                    </Text>
                  ) : null}
                  <Text
                    style={[styles.cardMeta, { color: colors.textTertiary }]}
                  >
                    {formatDateTime(item.created_at)}
                  </Text>
                </View>
                <Pressable
                  hitSlop={8}
                  onPress={() => handleDeleteNotification(item)}
                  style={styles.deleteBtn}
                >
                  <Ionicons
                    name="trash-outline"
                    size={rf(16)}
                    color={colors.textTertiary}
                  />
                </Pressable>
              </Pressable>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  container: {
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
    gap: spacing.md,
  },
  markAllBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    alignSelf: "flex-end",
  },
  markAllText: { fontSize: rf(13), fontWeight: "700" },
  loadingBlock: { paddingVertical: spacing.xxl, alignItems: "center" },
  emptyBlock: {
    borderWidth: 1,
    borderRadius: borderRadius.xl,
    padding: spacing.xl,
    alignItems: "center",
    gap: spacing.sm,
  },
  emptyTitle: { fontSize: rf(16), fontWeight: "800" },
  emptyMsg: { fontSize: rf(13), textAlign: "center", lineHeight: rf(19) },
  list: { gap: spacing.sm },
  card: {
    flexDirection: "row",
    gap: spacing.sm,
    borderWidth: 1,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
  },
  cardIcon: {
    width: rf(36),
    height: rf(36),
    borderRadius: borderRadius.pill,
    alignItems: "center",
    justifyContent: "center",
  },
  cardCopy: { flex: 1, gap: 2 },
  cardTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },
  cardTitle: { flex: 1, fontSize: rf(14), fontWeight: "800" },
  dot: { width: rf(8), height: rf(8), borderRadius: rf(4) },
  cardBody: { fontSize: rf(13), lineHeight: rf(18) },
  cardMeta: { fontSize: rf(11), marginTop: 2 },
  deleteBtn: { alignSelf: "center", padding: spacing.xs },
});
