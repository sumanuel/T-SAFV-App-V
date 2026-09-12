/**
 * biometricAuthService.js
 * Bloqueo de la app con huella/Face ID (expo-local-authentication).
 * No guarda contraseñas: solo confirma la identidad para desbloquear la
 * sesión que ya quedó guardada en el dispositivo.
 */
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as LocalAuthentication from "expo-local-authentication";

const BIOMETRIC_LOCK_KEY = "@biometric_lock_enabled";

export async function isBiometricHardwareAvailable() {
  try {
    const hasHardware = await LocalAuthentication.hasHardwareAsync();
    if (!hasHardware) return false;
    return await LocalAuthentication.isEnrolledAsync();
  } catch {
    return false;
  }
}

export async function getBiometricLockEnabled() {
  try {
    const value = await AsyncStorage.getItem(BIOMETRIC_LOCK_KEY);
    return value === "1";
  } catch {
    return false;
  }
}

export async function setBiometricLockEnabled(enabled) {
  await AsyncStorage.setItem(BIOMETRIC_LOCK_KEY, enabled ? "1" : "0");
}

export async function authenticateWithBiometrics(promptMessage) {
  try {
    const result = await LocalAuthentication.authenticateAsync({
      promptMessage: promptMessage || "Desbloquea T-SAFV",
      cancelLabel: "Cancelar",
      disableDeviceFallback: false,
    });
    return result.success;
  } catch {
    return false;
  }
}
