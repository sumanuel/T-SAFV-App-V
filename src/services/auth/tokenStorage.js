import AsyncStorage from "@react-native-async-storage/async-storage";
import { logger } from "../../utils/logger";

// SecureStore no admite "@" en las claves, por eso difieren de las legadas.
const ACCESS = { secure: "auth_token", fallback: "@auth_token" };
const REFRESH = { secure: "refresh_token", fallback: "@refresh_token" };

let secureStorePromise = null;

// Carga perezosa: en un build que aun no incluye el modulo nativo (p. ej. un
// APK de desarrollo anterior) el import lanza error; en ese caso se usa
// AsyncStorage en lugar de romper la app al abrirla.
function loadSecureStore() {
  if (!secureStorePromise) {
    secureStorePromise = (async () => {
      try {
        const SecureStore = require("expo-secure-store");
        return (await SecureStore.isAvailableAsync()) ? SecureStore : null;
      } catch (error) {
        logger.warn(
          "[tokenStorage] SecureStore no disponible:",
          error?.message,
        );
        return null;
      }
    })();
  }
  return secureStorePromise;
}

async function read(keys) {
  const SecureStore = await loadSecureStore();
  if (!SecureStore) return AsyncStorage.getItem(keys.fallback);

  const secureValue = await SecureStore.getItemAsync(keys.secure);
  if (secureValue) return secureValue;

  // Migracion: valores guardados antes de usar SecureStore.
  const legacyValue = await AsyncStorage.getItem(keys.fallback);
  if (legacyValue) {
    await SecureStore.setItemAsync(keys.secure, legacyValue);
    await AsyncStorage.removeItem(keys.fallback);
  }
  return legacyValue;
}

async function write(keys, value) {
  const SecureStore = await loadSecureStore();
  if (!SecureStore) {
    await AsyncStorage.setItem(keys.fallback, value);
    return;
  }
  await SecureStore.setItemAsync(keys.secure, value);
  await AsyncStorage.removeItem(keys.fallback);
}

async function remove(keys) {
  const SecureStore = await loadSecureStore();
  if (SecureStore) await SecureStore.deleteItemAsync(keys.secure);
  await AsyncStorage.removeItem(keys.fallback);
}

export const getToken = () => read(ACCESS);
export const setToken = (token) => write(ACCESS, token);
export const removeToken = () => remove(ACCESS);

export const getRefreshToken = () => read(REFRESH);
export const setRefreshToken = (token) => write(REFRESH, token);
export const removeRefreshToken = () => remove(REFRESH);
