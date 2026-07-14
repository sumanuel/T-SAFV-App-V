/**
 * trazaService.js
 * Trazabilidad de unidades en la asociación activa.
 */
import sdk from "../api/sdk";

export async function listTraza(token, asociacionId, filters) {
  if (!asociacionId) return [];
  const res = await sdk.getAssociationTraceability(
    token,
    asociacionId,
    filters,
  );
  if (res.status !== 200) return [];
  return res.data || [];
}

export async function listMyTraza(token, asociacionId, filters) {
  const res = await sdk.getMyOwnerTraceability(token, filters);
  if (res.status !== 200) return [];
  return (res.data || []).filter(
    (item) => String(item.asociacion_id) === String(asociacionId),
  );
}

export async function listMyUnitTraza(token, unidadId, filters) {
  if (!unidadId) return [];
  const res = await sdk.getOwnerUnitTraceability(token, unidadId, filters);
  if (res.status !== 200) return [];
  return res.data || [];
}
