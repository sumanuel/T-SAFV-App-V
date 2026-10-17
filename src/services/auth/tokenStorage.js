import AsyncStorage from "@react-native-async-storage/async-storage";
import { logger } from "../../utils/logger";

// SecureStore no admite "@" en las claves, por eso difiere de la clave legada.
const TOKEN_KEY = "auth_token";
const LEGACY_TOKEN_KEY = "@auth_token";

let secureStorePromise = null;

// Carga perezosa: en un build que aun no incluye el modulo nativo (p. ej. un
// APK de desarrollo anterior) el import lanza error; en ese caso se usa
// AsyncStorage en lugar de romper la app al abrirla.
function loadSecureStore() {
  if (!secureStorePromise) {
    secureStorePromise = import("expo-secure-store")
      .then(async (SecureStore) => ((await SecureStore.isAvailableAsync()) ? SecureStore : null))
      .catch((error) => {
        logger.warn("[tokenStorage] SecureStore no disponible:", error?.message);
        return null;
      });
  }
  return secureStorePromise;
}

export async function getToken() {
  const SecureStore = await loadSecureStore();
  if (!SecureStore) return AsyncStorage.getItem(LEGACY_TOKEN_KEY);

  const secureToken = await SecureStore.getItemAsync(TOKEN_KEY);
  if (secureToken) return secureToken;

  // Migracion: sesiones guardadas antes de usar SecureStore.
  const legacyToken = await AsyncStorage.getItem(LEGACY_TOKEN_KEY);
  if (legacyToken) {
    await SecureStore.setItemAsync(TOKEN_KEY, legacyToken);
    await AsyncStorage.removeItem(LEGACY_TOKEN_KEY);
  }
  return legacyToken;
}

export async function setToken(token) {
  const SecureStore = await loadSecureStore();
  if (!SecureStore) {
    await AsyncStorage.setItem(LEGACY_TOKEN_KEY, token);
    return;
  }
  await SecureStore.setItemAsync(TOKEN_KEY, token);
  await AsyncStorage.removeItem(LEGACY_TOKEN_KEY);
}

export async function removeToken() {
  const SecureStore = await loadSecureStore();
  if (SecureStore) await SecureStore.deleteItemAsync(TOKEN_KEY);
  await AsyncStorage.removeItem(LEGACY_TOKEN_KEY);
}
