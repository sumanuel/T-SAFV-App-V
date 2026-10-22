import { useEffect, useRef, useState } from "react";
import sdk from "../services/api/sdk";
import { buildPhotoMap, chunkRecordIds } from "../utils/trazaPhotos";

// Que fiscalizaciones de la lista tienen foto: { [idRegistro]: idAdjunto }.
// Es un complemento: si falla (sin red o API sin actualizar) la lista sigue
// funcionando, solo que sin miniaturas.
export function useTrazaPhotos({ token, items }) {
  const [photoMap, setPhotoMap] = useState({});
  const tokenRef = useRef(token);
  useEffect(() => {
    tokenRef.current = token;
  });

  useEffect(() => {
    const chunks = chunkRecordIds(items);
    if (!chunks.length) {
      setPhotoMap({});
      return undefined;
    }

    let cancelled = false;
    (async () => {
      try {
        const responses = await Promise.all(
          chunks.map((ids) => sdk.getAttachmentSummary(tokenRef.current, ids)),
        );
        if (cancelled) return;
        const rows = responses.flatMap((res) =>
          res.status === 200 && Array.isArray(res.data) ? res.data : [],
        );
        setPhotoMap(buildPhotoMap(rows));
      } catch {
        if (!cancelled) setPhotoMap({});
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [items]);

  return photoMap;
}
