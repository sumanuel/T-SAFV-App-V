/**
 * fiscalService.js
 * Gestión de fiscales (miembros con rol FISCAL) en la asociación activa.
 */
import sdk from "../api/sdk";

function resolveError(res, fallback) {
  return res?.data?.message || res?.data?.error || fallback;
}

export async function listFiscales(token, asociacionId) {
  if (!asociacionId) return [];
  const res = await sdk.getAssociationMembers(token, asociacionId);
  if (res.status !== 200) return [];
  return (res.data || []).filter((m) => m.rol === "FISCAL");
}

export async function createFiscal(token, asociacionId, payload) {
  const res = await sdk.createAssociationMember(token, asociacionId, {
    nombre: payload.nombre?.trim() || "",
    apellido: payload.apellido?.trim() || "",
    email: payload.email?.trim() || "",
    telefono: payload.telefono?.trim() || "",
    rif_cedula: payload.rif_cedula?.trim() || "",
    direccion: payload.direccion?.trim() || "",
    punto_control: payload.punto_control?.trim() || "",
    estado_invitacion: payload.estado_invitacion || "PENDIENTE_INVITACION",
    rol: "FISCAL",
    role: "FISCAL",
  });
  if (res.status === 201 || res.status === 200) return res.data;
  throw new Error(resolveError(res, "No se pudo crear el fiscal."));
}

export async function updateFiscal(token, asociacionId, membresiaId, payload) {
  const res = await sdk.updateAssociationMember(
    token,
    asociacionId,
    membresiaId,
    {
      nombre: payload.nombre?.trim() || "",
      apellido: payload.apellido?.trim() || "",
      email: payload.email?.trim() || "",
      telefono: payload.telefono?.trim() || "",
      rif_cedula: payload.rif_cedula?.trim() || "",
      direccion: payload.direccion?.trim() || "",
      punto_control: payload.punto_control?.trim() || "",
      estado_invitacion: payload.estado_invitacion || "PENDIENTE_INVITACION",
      rol: "FISCAL",
      role: "FISCAL",
    },
  );
  if (res.status === 200) return res.data;
  throw new Error(resolveError(res, "No se pudo actualizar el fiscal."));
}
