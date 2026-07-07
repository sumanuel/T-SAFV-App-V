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
