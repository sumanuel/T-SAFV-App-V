import { useCallback, useEffect, useRef, useState } from "react";
import {
  listMyVehicles,
  listVehicles,
} from "../services/vehicles/vehicleService";

// Unidades de la asociacion activa: todas para administracion/fiscales, solo las
// propias para el propietario. Recarga al cambiar de asociacion o de rol.
export function useUnits({ token, associationId, isOwner, onError }) {
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(false);

  // El token se lee por referencia: renovarlo no debe volver a descargar la lista.
  const tokenRef = useRef(token);
  const onErrorRef = useRef(onError);
  useEffect(() => {
    tokenRef.current = token;
    onErrorRef.current = onError;
  });

  const refresh = useCallback(async () => {
    if (!associationId) return;
    setLoading(true);
    try {
      const data = isOwner
        ? await listMyVehicles(tokenRef.current, associationId)
        : await listVehicles(tokenRef.current, associationId);
      setVehicles(data);
    } catch (error) {
      onErrorRef.current?.(error);
    } finally {
      setLoading(false);
    }
  }, [associationId, isOwner]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { vehicles, loading, refresh };
}
