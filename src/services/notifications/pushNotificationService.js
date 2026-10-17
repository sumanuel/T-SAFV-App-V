/**
 * pushNotificationService.js
 * Registro del dispositivo para notificaciones push (Expo) y sincronizacion
 * del token con T-SAFV-API para que el backend pueda notificar al usuario
 * (ej: fiscalizacion de su unidad, activacion de periodo de prueba).
 *
 * Importante: desde el SDK 53, Expo Go ya no soporta push remoto y con solo
 * importar expo-notifications en Android lanza un error. Por eso el modulo
 * se carga de forma diferida y solo fuera de Expo Go (ver isRunningInExpoGo).
 */
import { isRunningInExpoGo } from "expo";
import Constants from "expo-constants";
import { Platform } from "react-native";
import { logger } from "../../utils/logger";

let notificationsModulePromise = null;

function loadNotifications() {
  if (isRunningInExpoGo()) {
    logger.debug("[push] omitido: corriendo en Expo Go");
    return Promise.resolve(null);
  }

  if (!notificationsModulePromise) {
    notificationsModulePromise = import("expo-notifications").then(
      (Notifications) => {
        Notifications.setNotificationHandler({
          handleNotification: async () => ({
            shouldShowAlert: true,
            shouldPlaySound: true,
            shouldSetBadge: true,
            shouldShowBanner: true,
            shouldShowList: true,
          }),
        });
        return Notifications;
      },
    );
  }

  return notificationsModulePromise;
}

export async function registerForPushNotificationsAsync() {
  logger.debug("[push] iniciando registro de push token...");
  try {
    const Notifications = await loadNotifications();
    if (!Notifications) return null;

    const { status: existingStatus } =
      await Notifications.getPermissionsAsync();
    logger.debug("[push] permiso actual:", existingStatus);
    let finalStatus = existingStatus;
    if (existingStatus !== "granted") {
      const { status } = await Notifications.requestPermissionsAsync();
      logger.debug("[push] permiso tras solicitarlo:", status);
      finalStatus = status;
    }
    if (finalStatus !== "granted") {
      logger.debug("[push] omitido: permiso no concedido:", finalStatus);
      return null;
    }

    if (Platform.OS === "android") {
      await Notifications.setNotificationChannelAsync("default", {
        name: "default",
        importance: Notifications.AndroidImportance.DEFAULT,
      });
    }

    const projectId =
      Constants.expoConfig?.extra?.eas?.projectId ||
      Constants.easConfig?.projectId;
    logger.debug("[push] projectId usado:", projectId);
    const tokenResponse = await Notifications.getExpoPushTokenAsync(
      projectId ? { projectId } : undefined,
    );
    logger.debug("[push] token obtenido:", tokenResponse.data);
    return tokenResponse.data;
  } catch (error) {
    logger.error("[push] No se pudo obtener el push token:", error);
    return null;
  }
}
