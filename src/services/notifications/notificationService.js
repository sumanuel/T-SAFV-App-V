/**
 * notificationService.js
 * Notificaciones del usuario (campana): listado, no leidas y marcar como leida.
 */
import sdk from "../api/sdk";

function resolveError(res, fallback) {
  return res?.data?.message || res?.data?.error || fallback;
}

export async function getMyNotifications(token, limit) {
  const res = await sdk.getMyNotifications(token, limit);
  if (res.status !== 200) {
    throw new Error(resolveError(res, "No se pudieron cargar las notificaciones."));
  }
  return res.data || { notificaciones: [], no_leidas: 0 };
}

export async function markNotificationRead(token, notificacionId) {
  const res = await sdk.markNotificationRead(token, notificacionId);
  if (res.status !== 200) {
    throw new Error(resolveError(res, "No se pudo actualizar la notificación."));
  }
  return res.data;
}

export async function markAllNotificationsRead(token) {
  const res = await sdk.markAllNotificationsRead(token);
  if (res.status !== 200) {
    throw new Error(resolveError(res, "No se pudieron actualizar las notificaciones."));
  }
  return res.data;
}
