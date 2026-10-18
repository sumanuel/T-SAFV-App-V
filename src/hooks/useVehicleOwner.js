import { useEffect, useState } from "react";
import { listPropietarios } from "../services/propietarios/propietarioService";

// Propietario de la unidad. El propietario en autoservicio solo se ve a si
// mismo; los demas perfiles cargan el listado de la asociacion y, si no llega
// uno preseleccionado, usan el primero.
export function useVehicleOwner({
  isOwnerSelfService,
  initialPropietario,
  initialVehicle,
  token,
  associationId,
}) {
  const [propietarios, setPropietarios] = useState([]);
  const [selectedId, setSelectedId] = useState(
    initialVehicle?.propietario_id ||
      initialPropietario?.id ||
      initialPropietario?.membresia_id ||
      null,
  );
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isOwnerSelfService) {
      const owner = initialPropietario || null;
      setPropietarios(owner ? [owner] : []);
      setSelectedId(owner?.id || owner?.membresia_id || null);
      setLoading(false);
      return;
    }

    if (!associationId) {
      setLoading(false);
      return;
    }

    const load = async () => {
      setLoading(true);
      try {
        const data = await listPropietarios(token, associationId);
        setPropietarios(data);
        setSelectedId((current) => {
          if (current) return current;
          if (initialPropietario?.id) return initialPropietario.id;
          if (initialPropietario?.membresia_id)
            return initialPropietario.membresia_id;
          return data[0]?.id || data[0]?.membresia_id || null;
        });
      } catch {
        // sin listado: la tarjeta muestra "No hay propietarios"
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [associationId, initialPropietario, isOwnerSelfService, token]);

  return { propietarios, selectedId, loading };
}
