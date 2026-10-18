import { useEffect, useState } from "react";
import { getMyNotifications } from "../services/notifications/notificationService";

// Cantidad de notificaciones sin leer (para la insignia de la campana).
export function useUnreadNotifications(token) {
  const [unread, setUnread] = useState(0);

  useEffect(() => {
    if (!token) return;
    getMyNotifications(token, 1)
      .then((result) => setUnread(result.no_leidas || 0))
      .catch(() => {});
  }, [token]);

  return unread;
}
