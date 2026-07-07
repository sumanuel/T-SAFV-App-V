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

export async function createPropietario(token, asociacionId, payload) {
  const res = await sdk.createAssociationMember(token, asociacionId, {
    nombre: payload.nombre?.trim() || "",
    apellido: payload.apellido?.trim() || "",
    email: payload.email?.trim() || "",
    telefono: payload.telefono?.trim() || "",
    rif_cedula: payload.rif_cedula?.trim() || "",
    direccion: payload.direccion?.trim() || "",
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
) {
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
      rol: "PROPIETARIO",
      role: "PROPIETARIO",
    },
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
