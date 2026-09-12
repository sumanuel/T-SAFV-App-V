/**
 * associationService.js
 * Gestión de la asociación del usuario (una sola por cuenta en este contexto).
 */
import sdk from "../api/sdk";

function resolveError(res, fallback) {
  return res?.data?.message || res?.data?.error || fallback;
}

export async function getMyAssociations(token) {
  const res = await sdk.getMyAssociations(token);
  if (res.status !== 200) {
    throw new Error(resolveError(res, "No se pudieron cargar las asociaciones."));
  }
  return res.data || [];
}

export async function createAssociation(token, payload) {
  const res = await sdk.createAsociacion(token, {
    nombre: payload.nombre?.trim() || "",
    rif: payload.rif?.trim() || "",
    direccion_fiscal: payload.direccion_fiscal?.trim() || "",
    email: payload.email?.trim() || "",
    telefonos: payload.telefonos?.trim() || "",
    logo_url: payload.logo_url?.trim() || "",
    logo_data: payload.logo_data?.trim() || "",
    redes_sociales: payload.redes_sociales || undefined,
  });
  if (res.status === 201 || res.status === 200) return res.data;
  throw new Error(resolveError(res, "No se pudo crear la asociación."));
}

export async function updateAssociation(token, asociacionId, payload) {
  const res = await sdk.updateAsociacion(token, asociacionId, {
    nombre: payload.nombre?.trim() || "",
    rif: payload.rif?.trim() || "",
    direccion_fiscal: payload.direccion_fiscal?.trim() || "",
    email: payload.email?.trim() || "",
    telefonos: payload.telefonos?.trim() || "",
    logo_url: payload.logo_url?.trim() || "",
    logo_data: payload.logo_data?.trim() || "",
    redes_sociales: payload.redes_sociales || undefined,
  });
  if (res.status === 200) return res.data;
  throw new Error(resolveError(res, "No se pudo actualizar la asociación."));
}
