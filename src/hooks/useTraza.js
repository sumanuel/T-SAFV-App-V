import { useCallback, useEffect, useRef, useState } from "react";
import { Alert } from "react-native";
import {
  listMyTraza,
  listMyUnitTraza,
  listTraza,
} from "../services/traza/trazaService";

// Registros de trazabilidad del rango de fechas. El propietario ve solo los de
// sus unidades; el resto, los de toda la asociacion. Se recarga al cambiar de
// asociacion, rol, unidad o fechas.
export function useTraza({
  token,
  associationId,
  isOwner,
  unitId,
  startDate,
  endDate,
}) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const tokenRef = useRef(token);
  useEffect(() => {
    tokenRef.current = token;
  });

  const refresh = useCallback(async () => {
    if (!associationId) return;
    setLoading(true);
    try {
      const filters = {
        fecha_inicio: startDate || undefined,
        fecha_fin: endDate || undefined,
      };
      const currentToken = tokenRef.current;
      const data = isOwner
        ? unitId
          ? await listMyUnitTraza(currentToken, unitId, filters)
          : await listMyTraza(currentToken, associationId, filters)
        : await listTraza(currentToken, associationId, filters);
      setItems(data);
    } catch {
      Alert.alert("Traza", "No se pudo cargar el registro de trazabilidad.");
    } finally {
      setLoading(false);
    }
  }, [associationId, endDate, isOwner, startDate, unitId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { items, loading, refresh };
}
