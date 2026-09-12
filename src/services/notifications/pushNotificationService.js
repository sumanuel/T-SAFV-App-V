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

let notificationsModulePromise = null;

function loadNotifications() {
  if (isRunningInExpoGo()) return Promise.resolve(null);

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
  try {
    const Notifications = await loadNotifications();
    if (!Notifications) return null;

    const { status: existingStatus } =
      await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    if (existingStatus !== "granted") {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    if (finalStatus !== "granted") return null;

    if (Platform.OS === "android") {
      await Notifications.setNotificationChannelAsync("default", {
        name: "default",
        importance: Notifications.AndroidImportance.DEFAULT,
      });
    }

    const projectId =
      Constants.expoConfig?.extra?.eas?.projectId ||
      Constants.easConfig?.projectId;
    const tokenResponse = await Notifications.getExpoPushTokenAsync(
      projectId ? { projectId } : undefined,
    );
    return tokenResponse.data;
  } catch (error) {
    console.error("No se pudo obtener el push token:", error?.message);
    return null;
  }
}
