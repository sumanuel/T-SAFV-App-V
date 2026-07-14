/**
 * propietarioService.js
 * Gestión de propietarios (miembros con rol PROPIETARIO) en la asociación activa.
 */
import sdk from "../api/sdk";

function resolveError(res, fallback) {
  return res?.data?.message || res?.data?.error || fallback;
}

export async function listPropietarios(token, asociacionId) {
  if (!asociacionId) return [];
  const res = await sdk.getAssociationMembers(token, asociacionId);
  if (res.status !== 200) return [];
  return (res.data || []).filter((m) => m.rol === "PROPIETARIO");
}

export async function listMyPropietarioUnits(token, asociacionId) {
  const res = await sdk.getMyOwnerUnits(token);
  if (res.status !== 200) return [];
  return (res.data || []).filter(
    (unit) => String(unit.asociacion_id) === String(asociacionId),
  );
}

export async function createPropietario(token, asociacionId, payload) {
  const res = await sdk.createAssociationMember(token, asociacionId, {
    nombre: payload.nombre?.trim() || "",
    apellido: payload.apellido?.trim() || "",
    email: payload.email?.trim() || "",
    telefono: payload.telefono?.trim() || "",
    rif_cedula: payload.rif_cedula?.trim() || "",
    direccion: payload.direccion?.trim() || "",
    estado_invitacion: payload.estado_invitacion || "PENDIENTE_INVITACION",
    rol: "PROPIETARIO",
    role: "PROPIETARIO",
  });
  if (res.status === 201 || res.status === 200) return res.data;
  throw new Error(resolveError(res, "No se pudo crear el propietario."));
}

export async function updatePropietario(
  token,
  asociacionId,
  membresiaId,
  payload,
  options = {},
) {
  const requestPayload = {
    nombre: payload.nombre?.trim() || "",
    apellido: payload.apellido?.trim() || "",
    email: payload.email?.trim() || "",
    telefono: payload.telefono?.trim() || "",
    rif_cedula: payload.rif_cedula?.trim() || "",
    direccion: payload.direccion?.trim() || "",
    estado_invitacion: payload.estado_invitacion || "PENDIENTE_INVITACION",
    rol: "PROPIETARIO",
    role: "PROPIETARIO",
  };
  const res = options.selfService
    ? await sdk.updateOwnAssociationMember(
        token,
        asociacionId,
        membresiaId,
        requestPayload,
      )
    : await sdk.updateAssociationMember(
        token,
        asociacionId,
        membresiaId,
        requestPayload,
      );
  if (res.status === 200) return res.data;
  throw new Error(resolveError(res, "No se pudo actualizar el propietario."));
}

export async function deletePropietario(token, asociacionId, membresiaId) {
  const res = await sdk.deleteAssociationMember(
    token,
    asociacionId,
    membresiaId,
  );
  if (res.status === 200 || res.status === 204) return;
  throw new Error(resolveError(res, "No se pudo eliminar el propietario."));
}
