// Busqueda de unidades por placa, numero, marca, modelo, chofer o propietario.
export function filterUnits(units, query) {
  const q = String(query || "")
    .trim()
    .toLowerCase();
  if (!q) return units;

  return units.filter((unit) =>
    [
      unit.placa,
      unit.numero_unidad,
      unit.marca,
      unit.modelo,
      unit.chofer,
      unit.propietario_nombre,
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase()
      .includes(q),
  );
}
