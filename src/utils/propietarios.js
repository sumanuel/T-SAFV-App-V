export function getMembershipId(entity) {
  return entity?.membresia_id || "";
}

export function getUserId(entity) {
  return entity?.id || "";
}

export function getFullName(person) {
  return [person?.nombre, person?.apellido].filter(Boolean).join(" ");
}

export function describeUnit(unit) {
  return (
    [unit?.marca, unit?.modelo, unit?.ano].filter(Boolean).join(" ") ||
    "Unidad sin descripción"
  );
}

const unitKey = (unit) => String(unit.id || unit.numero_unidad || unit.placa);

// Une las unidades que ya trae el propietario con las de la asociacion cuyo
// propietario_id coincide (las de la lista completa completan/pisan campos) y
// las ordena por numero de unidad.
export function mergeLinkedUnits(propietario, allVehicles) {
  const linkedUnits = Array.isArray(propietario?.linked_units)
    ? propietario.linked_units
    : [];
  const ownerVehicles = (allVehicles || []).filter(
    (vehicle) =>
      String(vehicle.propietario_id) === String(getUserId(propietario)),
  );
  const merged = new Map();

  linkedUnits.forEach((vehicle) => {
    merged.set(unitKey(vehicle), vehicle);
  });

  ownerVehicles.forEach((vehicle) => {
    const key = unitKey(vehicle);
    merged.set(key, { ...merged.get(key), ...vehicle });
  });

  return Array.from(merged.values()).sort((left, right) =>
    String(left.numero_unidad || left.id).localeCompare(
      String(right.numero_unidad || right.id),
      "es",
      { numeric: true },
    ),
  );
}

// Busqueda por cedula/RIF, nombre, correo, telefono o placa/numero de sus unidades.
export function filterPropietarios(propietarios, query) {
  const q = String(query || "")
    .trim()
    .toLowerCase();
  if (!q) return propietarios;

  return propietarios.filter((propietario) =>
    [
      propietario.rif_cedula,
      propietario.nombre,
      propietario.apellido,
      propietario.email,
      propietario.telefono,
      ...(propietario.linked_units || []).flatMap((vehicle) => [
        vehicle.placa,
        vehicle.numero_unidad,
      ]),
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase()
      .includes(q),
  );
}
