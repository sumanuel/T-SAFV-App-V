import { useCallback, useEffect, useState } from "react";
import { Alert } from "react-native";
import {
  authenticateWithBiometrics,
  getBiometricLockEnabled,
  isBiometricHardwareAvailable,
  setBiometricLockEnabled,
} from "../services/security/biometricAuthService";

// Estado del desbloqueo con huella/Face ID y su interruptor. Para activarlo se
// exige confirmar la identidad una vez.
export function useBiometricLock() {
  const [available, setAvailable] = useState(false);
  const [enabled, setEnabled] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    (async () => {
      const [hasHardware, isEnabled] = await Promise.all([
        isBiometricHardwareAvailable(),
        getBiometricLockEnabled(),
      ]);
      setAvailable(hasHardware);
      setEnabled(hasHardware && isEnabled);
    })();
  }, []);

  const toggle = useCallback(
    async (value) => {
      if (busy) return;
      setBusy(true);
      try {
        if (value) {
          const confirmed = await authenticateWithBiometrics(
            "Confirma tu huella o Face ID para activar el desbloqueo",
          );
          if (!confirmed) {
            Alert.alert(
              "Desbloqueo con huella",
              "No se pudo verificar tu identidad. Intenta de nuevo.",
            );
            return;
          }
        }
        await setBiometricLockEnabled(value);
        setEnabled(value);
      } finally {
        setBusy(false);
      }
    },
    [busy],
  );

  return { available, enabled, busy, toggle };
}
