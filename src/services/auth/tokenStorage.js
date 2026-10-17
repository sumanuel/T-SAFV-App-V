import AsyncStorage from "@react-native-async-storage/async-storage";
import * as SecureStore from "expo-secure-store";

// SecureStore no admite "@" en las claves, por eso difiere de la clave legada.
const TOKEN_KEY = "auth_token";
const LEGACY_TOKEN_KEY = "@auth_token";

let secureAvailable = null;

async function isSecureAvailable() {
  if (secureAvailable === null) {
    try {
      secureAvailable = await SecureStore.isAvailableAsync();
    } catch {
      secureAvailable = false;
    }
  }
  return secureAvailable;
}

export async function getToken() {
  if (!(await isSecureAvailable())) {
    return AsyncStorage.getItem(LEGACY_TOKEN_KEY);
  }

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
  if (!(await isSecureAvailable())) {
    await AsyncStorage.setItem(LEGACY_TOKEN_KEY, token);
    return;
  }
  await SecureStore.setItemAsync(TOKEN_KEY, token);
  await AsyncStorage.removeItem(LEGACY_TOKEN_KEY);
}

export async function removeToken() {
  if (await isSecureAvailable()) {
    await SecureStore.deleteItemAsync(TOKEN_KEY);
  }
  await AsyncStorage.removeItem(LEGACY_TOKEN_KEY);
}
