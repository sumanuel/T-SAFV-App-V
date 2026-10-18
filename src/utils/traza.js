export function formatInputDate(value = new Date()) {
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, "0");
  const day = String(value.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function formatDateTime(value) {
  if (!value) return "Sin fecha";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Sin fecha";
  return date.toLocaleString("es-VE");
}

// Filtros locales de la traza: fiscal, unidad y texto libre (placa, numero,
// chofer, destino u origen).
export function filterTraza(
  items,
  { fiscalId = "ALL", unitId = null, query = "" } = {},
) {
  const q = String(query).trim().toLowerCase();

  return items.filter((item) => {
    if (fiscalId !== "ALL" && String(item.fiscal_id) !== String(fiscalId)) {
      return false;
    }
    if (unitId && String(item.unidad_id) !== String(unitId)) return false;
    if (q) {
      const text = [
        item.placa,
        item.numero_unidad,
        item.chofer,
        item.destino,
        item.origen,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      if (!text.includes(q)) return false;
    }
    return true;
  });
}

export function sumPassengers(items) {
  return items.reduce((sum, item) => sum + (Number(item.pasajeros) || 0), 0);
}

// Fiscales distintos presentes en los registros, para los chips de filtro.
export function extractFiscalOptions(items) {
  const byId = {};
  items.forEach((item) => {
    if (item.fiscal_id && item.fiscal_nombre) {
      byId[item.fiscal_id] = item.fiscal_nombre;
    }
  });
  return Object.entries(byId).map(([id, nombre]) => ({ id, nombre }));
}

const CSV_HEADER = [
  "Fecha",
  "Unidad",
  "Placa",
  "Fiscal",
  "Punto de control",
  "Chofer",
  "Origen",
  "Destino",
  "Pasajeros",
];

// CSV con todos los valores entre comillas (las comillas internas se duplican).
export function buildTrazaCsv(items) {
  const rows = items.map((item) => [
    formatDateTime(item.fecha_hora_registro),
    item.numero_unidad || item.unidad_id || "",
    item.placa || "",
    [item.fiscal_nombre, item.fiscal_apellido].filter(Boolean).join(" ") ||
      item.fiscal_id ||
      "",
    item.punto_control || "",
    item.chofer || "",
    item.origen || "",
    item.destino || "",
    item.pasajeros ?? "",
  ]);

  return [CSV_HEADER, ...rows]
    .map((line) =>
      line.map((value) => `"${String(value).replace(/"/g, '""')}"`).join(","),
    )
    .join("\n");
}
