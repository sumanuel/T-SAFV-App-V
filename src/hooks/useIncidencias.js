import { useCallback, useEffect, useRef, useState } from "react";
import sdk from "../services/api/sdk";

// Incidencias de la asociacion activa (el propietario solo recibe las de sus
// unidades: lo resuelve la API). `error` es un mensaje para mostrar en pantalla.
export function useIncidencias({ token, associationId }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const tokenRef = useRef(token);
  useEffect(() => {
    tokenRef.current = token;
  });

  const refresh = useCallback(async () => {
    if (!associationId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await sdk.getAssociationIncidencias(
        tokenRef.current,
        associationId,
        { limit: 200 },
      );
      if (res.status === 200 && Array.isArray(res.data)) {
        setItems(res.data);
      } else if (res.status === 404 && !res.data) {
        setError(
          "El módulo de incidencias aún no está disponible en el servidor.",
        );
      } else {
        setError(res.data?.message || "No se pudieron cargar las incidencias.");
      }
    } catch {
      setError("No se pudieron cargar las incidencias.");
    } finally {
      setLoading(false);
    }
  }, [associationId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { items, loading, error, refresh };
}
