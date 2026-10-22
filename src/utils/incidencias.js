// Catalogo igual al de la API (T-SAFV-API/src/constants/incidencias.js).
export const INCIDENCIA_TIPOS = [
  { value: "INFRACCION", label: "Infracción", icon: "alert-circle-outline" },
  { value: "ACCIDENTE", label: "Accidente", icon: "car-outline" },
  {
    value: "FALLA_MECANICA",
    label: "Falla mecánica",
    icon: "construct-outline",
  },
  {
    value: "CONDUCTA_CHOFER",
    label: "Conducta del chofer",
    icon: "person-outline",
  },
  { value: "OTRO", label: "Otro evento", icon: "flag-outline" },
];

export const INCIDENCIA_ESTADOS = [
  { value: "ABIERTA", label: "Abierta", tone: "warning" },
  { value: "EN_REVISION", label: "En revisión", tone: "primary" },
  { value: "CERRADA", label: "Cerrada", tone: "success" },
];

export const MAX_INCIDENCIA_PHOTOS = 3;
export const DESCRIPCION_MIN = 3;
export const DESCRIPCION_MAX = 4000;
export const LUGAR_MAX = 255;

export function getTipoLabel(tipo) {
  return INCIDENCIA_TIPOS.find((item) => item.value === tipo)?.label || "Otro";
}

export function getTipoIcon(tipo) {
  return (
    INCIDENCIA_TIPOS.find((item) => item.value === tipo)?.icon || "flag-outline"
  );
}

export function getEstado(estado) {
  return (
    INCIDENCIA_ESTADOS.find((item) => item.value === estado) ||
    INCIDENCIA_ESTADOS[0]
  );
}

// Mensaje de error del formulario, o null si esta listo para enviarse.
export function validateIncidenciaDraft({ tipo, descripcion, lugar }) {
  if (!INCIDENCIA_TIPOS.some((item) => item.value === tipo)) {
    return "Selecciona el tipo de incidencia.";
  }
  const text = (descripcion || "").trim();
  if (text.length < DESCRIPCION_MIN) {
    return "Describe lo ocurrido (mínimo 3 caracteres).";
  }
  if (text.length > DESCRIPCION_MAX) {
    return `La descripción no puede superar ${DESCRIPCION_MAX} caracteres.`;
  }
  if ((lugar || "").trim().length > LUGAR_MAX) {
    return `El lugar no puede superar ${LUGAR_MAX} caracteres.`;
  }
  return null;
}

// Cuerpo para POST /api/incidencias (sin client_request_id ni la hora, que
// los fija la bandeja de salida). La unidad es opcional: hay eventos que no
// ocurren en una unidad concreta.
export function buildIncidenciaPayload({
  asociacionId,
  unidadId,
  tipo,
  descripcion,
  lugar,
}) {
  const payload = {
    asociacion_id: Number(asociacionId),
    tipo,
    descripcion: descripcion.trim(),
  };
  if (unidadId) payload.unidad_id = Number(unidadId);
  const place = (lugar || "").trim();
  if (place) payload.lugar = place;
  return payload;
}

// Filtra por estado ("TODAS" no filtra) y texto libre (descripcion, lugar,
// unidad, placa, tipo y quien la reporto).
export function filterIncidencias(
  items,
  { estado = "TODAS", query = "" } = {},
) {
  const text = query.trim().toLowerCase();
  return (items || []).filter((item) => {
    if (estado !== "TODAS" && item.estado !== estado) return false;
    if (!text) return true;
    return [
      item.descripcion,
      item.lugar,
      item.numero_unidad,
      item.placa,
      getTipoLabel(item.tipo),
      item.reportada_por_nombre,
      item.reportada_por_apellido,
    ]
      .filter(Boolean)
      .some((value) => String(value).toLowerCase().includes(text));
  });
}

export function countByEstado(items) {
  const counts = { TODAS: 0, ABIERTA: 0, EN_REVISION: 0, CERRADA: 0 };
  for (const item of items || []) {
    counts.TODAS += 1;
    if (counts[item.estado] !== undefined) counts[item.estado] += 1;
  }
  return counts;
}

// Etiqueta corta de la unidad de una incidencia ("U-12 · ABC123").
export function getUnitLabel(item) {
  const parts = [
    item?.numero_unidad ? `U-${item.numero_unidad}` : null,
    item?.placa,
  ].filter(Boolean);
  return parts.length ? parts.join(" · ") : "Sin unidad";
}

export function getReporterName(item) {
  return (
    [item?.reportada_por_nombre, item?.reportada_por_apellido]
      .filter(Boolean)
      .join(" ") || "Sin dato"
  );
}
