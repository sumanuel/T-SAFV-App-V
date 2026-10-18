const asText = (value) => (value ? String(value) : "");

// Valores iniciales del formulario (todo como texto, que es lo que editan los inputs).
export function buildVehicleDraft(vehicle) {
  return {
    placa: vehicle?.placa || "",
    numero_unidad: asText(vehicle?.numero_unidad),
    numero_puestos: asText(vehicle?.numero_puestos),
    marca: vehicle?.marca || "",
    modelo: vehicle?.modelo || "",
    ano: asText(vehicle?.ano),
    color: vehicle?.color || "",
    numero_cilindros: asText(vehicle?.numero_cilindros),
    peso: vehicle?.peso || "",
    serial_carroceria: vehicle?.serial_carroceria || "",
    serial_motor: vehicle?.serial_motor || "",
    capacidad: vehicle?.capacidad || "",
    fecha_emision: vehicle?.fecha_emision
      ? String(vehicle.fecha_emision).slice(0, 10)
      : "",
    numero_poliza_rcv: vehicle?.numero_poliza_rcv || "",
    chofer: vehicle?.chofer || "",
  };
}

// Devuelve { title, message } con el aviso a mostrar, o null si se puede guardar.
export function validateVehicleSubmission({
  draft,
  isOwnerSelfService,
  isEditing,
  propietarioId,
  asociacionId,
}) {
  if (isOwnerSelfService && !isEditing) {
    return {
      title: "Unidades",
      message:
        "Desde este perfil solo puedes editar unidades ya asociadas a tu usuario.",
    };
  }
  if (!draft.placa.trim() || !draft.numero_unidad.trim()) {
    return {
      title: "Datos incompletos",
      message: "Placa y numero de unidad son obligatorios.",
    };
  }
  if (!propietarioId) {
    return {
      title: "Sin propietario",
      message: "Asigna un propietario a la unidad.",
    };
  }
  if (!asociacionId) {
    return {
      title: "Sin asociacion",
      message: "Selecciona una asociacion activa.",
    };
  }
  return null;
}

const numberOrUndefined = (text) => (text ? Number(text) : undefined);

export function buildVehiclePayload(draft, propietarioId) {
  return {
    propietario_id: Number(propietarioId),
    placa: draft.placa.trim().toUpperCase(),
    marca: draft.marca.trim(),
    modelo: draft.modelo.trim(),
    ano: numberOrUndefined(draft.ano),
    color: draft.color.trim(),
    numero_cilindros: numberOrUndefined(draft.numero_cilindros),
    peso: draft.peso.trim(),
    serial_carroceria: draft.serial_carroceria.trim(),
    serial_motor: draft.serial_motor.trim(),
    capacidad: draft.capacidad.trim(),
    fecha_emision: draft.fecha_emision.trim() || undefined,
    numero_poliza_rcv: draft.numero_poliza_rcv.trim(),
    chofer: draft.chofer.trim(),
    numero_unidad: draft.numero_unidad.trim(),
    numero_puestos: numberOrUndefined(draft.numero_puestos),
  };
}
