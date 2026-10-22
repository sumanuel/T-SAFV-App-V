/**
 * sdk.js
 * Funciones de acceso a T-SAFV-API.
 * Adaptado desde T-SAFV-App/src/lib/tsafv-sdk.js manteniendo la misma
 * estructura de respuesta { status, data } para compatibilidad directa.
 */
import { API_BASE_URL } from "./config";
import { notifySessionExpired } from "../auth/sessionExpiry";
import { recoverFromUnauthorized } from "../auth/sessionRefresh";

const METHODS_WITH_BODY = new Set(["POST", "PUT", "PATCH"]);

// Cubre tambien la subida de imagenes en base64 (hasta 12 MB) en redes lentas.
const REQUEST_TIMEOUT_MS = 30000;
// Una foto (~200 KB) en una red movil mala puede tardar mas que un JSON.
const UPLOAD_TIMEOUT_MS = 60000;

// `binary` = { bytes, contentType } envia el cuerpo tal cual (fotos) en vez de JSON.
async function attempt(method, path, body, token, binary) {
  const headers = {};
  if (binary) headers["Content-Type"] = binary.contentType;
  else if (METHODS_WITH_BODY.has(method))
    headers["Content-Type"] = "application/json";
  if (token) headers.Authorization = `Bearer ${token}`;

  const options = { method, headers };
  if (binary) options.body = binary.bytes;
  else if (METHODS_WITH_BODY.has(method)) options.body = JSON.stringify(body);

  const controller = new AbortController();
  const timer = setTimeout(
    () => controller.abort(),
    binary ? UPLOAD_TIMEOUT_MS : REQUEST_TIMEOUT_MS,
  );
  try {
    const res = await fetch(`${API_BASE_URL}${path}`, {
      ...options,
      signal: controller.signal,
    });
    const data = await res.json().catch(() => null);
    return { status: res.status, data };
  } finally {
    clearTimeout(timer);
  }
}

// Ante un 401 intenta renovar la sesion con el refresh token y repite la
// peticion una vez. Solo se considera vencida si la renovacion falla de forma
// definitiva (no por falta de red). Con { authRecovery: false } (rutas
// publicas como login) un 401 no toca la sesion.
export async function request(
  method,
  path,
  body,
  token,
  { authRecovery = true, binary } = {},
) {
  try {
    let result = await attempt(method, path, body, token, binary);

    if (result.status === 401 && authRecovery) {
      const { token: freshToken, expired } = token
        ? await recoverFromUnauthorized(token)
        : { token: null, expired: true };

      if (freshToken)
        result = await attempt(method, path, body, freshToken, binary);

      if (result.status === 401 && (freshToken || expired)) {
        notifySessionExpired();
      }
    }
    return result;
  } catch (error) {
    return { status: 0, data: null, error };
  }
}

const apiGet = (path, token) => request("GET", path, undefined, token);
const apiPost = (path, body, token) => request("POST", path, body, token);
const apiPut = (path, body, token) => request("PUT", path, body, token);
const apiPatch = (path, body, token) => request("PATCH", path, body, token);
const apiDelete = (path, token) => request("DELETE", path, undefined, token);

function buildQueryString(params) {
  const entries = Object.entries(params || {}).filter(
    ([, value]) => value !== undefined && value !== null && value !== "",
  );
  if (!entries.length) return "";
  const searchParams = new URLSearchParams();
  entries.forEach(([key, value]) => searchParams.append(key, String(value)));
  return `?${searchParams.toString()}`;
}

// ─── Auth ─────────────────────────────────────────────────────────────────────

export function register(data) {
  return apiPost("/api/auth/register", data);
}

export function login(email, password) {
  return apiPost("/api/auth/login", { email, password });
}

export function getAssociationCreationAccess(token) {
  return apiGet("/api/auth/association-access", token);
}

export function getMyInvitations(token) {
  return apiGet("/api/invitaciones/mine", token);
}

export function acceptInvitation(token, inviteToken) {
  return apiPost("/api/invitaciones/respond", { token: inviteToken }, token);
}

export function createInvitation(token, payload) {
  return apiPost("/api/invitaciones", payload, token);
}

export function getAssociationInvitations(token, asociacionId) {
  return apiGet(`/api/invitaciones/asociaciones/${asociacionId}`, token);
}

export function cancelAssociationInvitation(token, asociacionId, invitacionId) {
  return apiDelete(
    `/api/invitaciones/asociaciones/${asociacionId}/${invitacionId}`,
    token,
  );
}

// ─── Asociaciones ─────────────────────────────────────────────────────────────

export function getMyAssociations(token) {
  return apiGet("/api/asociaciones/mine", token);
}

export function createAsociacion(token, payload) {
  return apiPost("/api/asociaciones", payload, token);
}

export function updateAsociacion(token, asociacionId, payload) {
  return apiPut(`/api/asociaciones/${asociacionId}`, payload, token);
}

// ─── Miembros ─────────────────────────────────────────────────────────────────

export function getAssociationMembers(token, asociacionId) {
  return apiGet(`/api/asociaciones/${asociacionId}/miembros`, token);
}

export function createAssociationMember(token, asociacionId, payload) {
  return apiPost(`/api/asociaciones/${asociacionId}/miembros`, payload, token);
}

export function updateAssociationMember(
  token,
  asociacionId,
  membresiaId,
  payload,
) {
  return apiPut(
    `/api/asociaciones/${asociacionId}/miembros/${membresiaId}`,
    payload,
    token,
  );
}

export function updateOwnAssociationMember(
  token,
  asociacionId,
  membresiaId,
  payload,
) {
  return apiPut(
    `/api/asociaciones/${asociacionId}/miembros/${membresiaId}/self`,
    payload,
    token,
  );
}

export function deleteAssociationMember(token, asociacionId, membresiaId) {
  return apiDelete(
    `/api/asociaciones/${asociacionId}/miembros/${membresiaId}`,
    token,
  );
}

export function changeMembershipState(
  token,
  asociacionId,
  membresiaId,
  payload,
) {
  return apiPost(
    `/api/asociaciones/${asociacionId}/membresias/${membresiaId}/state`,
    payload,
    token,
  );
}

// ─── Unidades ─────────────────────────────────────────────────────────────────

export function getAssociationUnits(token, asociacionId) {
  return apiGet(`/api/asociaciones/${asociacionId}/unidades`, token);
}

export function createAssociationUnit(token, asociacionId, payload) {
  return apiPost(
    `/api/unidades/asociaciones/${asociacionId}/unidades`,
    payload,
    token,
  );
}

export function updateAssociationUnit(token, asociacionId, unidadId, payload) {
  return apiPut(
    `/api/unidades/asociaciones/${asociacionId}/unidades/${unidadId}`,
    payload,
    token,
  );
}

export function deleteAssociationUnit(token, asociacionId, unidadId) {
  return apiDelete(
    `/api/unidades/asociaciones/${asociacionId}/unidades/${unidadId}`,
    token,
  );
}

export function updateMyAssociationUnit(
  token,
  asociacionId,
  unidadId,
  payload,
) {
  return apiPut(
    `/api/unidades/asociaciones/${asociacionId}/mis-unidades/${unidadId}`,
    payload,
    token,
  );
}

export function getMyOwnerUnits(token) {
  return apiGet("/api/propietario/mis-unidades", token);
}

export function getMyOwnerTraceability(token, filters) {
  const query = buildQueryString(filters || {});
  return apiGet(`/api/propietario/mi-trazabilidad${query}`, token);
}

export function getOwnerUnitTraceability(token, unidadId, filters) {
  const query = buildQueryString(filters || {});
  return apiGet(
    `/api/propietario/unidades/${unidadId}/trazabilidad${query}`,
    token,
  );
}

// ─── Trazabilidad ─────────────────────────────────────────────────────────────

export function getAssociationTraceability(token, asociacionId, filters) {
  const query = buildQueryString(filters || {});
  return apiGet(
    `/api/asociaciones/${asociacionId}/trazabilidad${query}`,
    token,
  );
}

// ─── Fiscalización ────────────────────────────────────────────────────────────

export function createFiscalRecord(token, payload) {
  return apiPost("/api/fiscal/registros", payload, token);
}

// ─── Incidencias ──────────────────────────────────────────────────────────────

export function createIncidencia(token, payload) {
  return apiPost("/api/incidencias", payload, token);
}

export function getAssociationIncidencias(token, asociacionId, filters) {
  const query = buildQueryString(filters || {});
  return apiGet(`/api/incidencias/asociaciones/${asociacionId}${query}`, token);
}

export function getIncidencia(token, incidenciaId) {
  return apiGet(`/api/incidencias/${incidenciaId}`, token);
}

export function updateIncidenciaEstado(token, incidenciaId, estado) {
  return apiPatch(`/api/incidencias/${incidenciaId}/estado`, { estado }, token);
}

// ─── Fotos adjuntas ───────────────────────────────────────────────────────────

// entidadTipo: "REGISTRO" (fiscalizacion) o "INCIDENCIA". `bytes` es el JPEG
// ya comprimido; viaja como cuerpo binario.
export function uploadAttachment(
  token,
  entidadTipo,
  entidadId,
  bytes,
  contentType = "image/jpeg",
) {
  return request(
    "POST",
    `/api/adjuntos/${entidadTipo}/${entidadId}`,
    undefined,
    token,
    { binary: { bytes, contentType } },
  );
}

// { entidad_id, adjunto_id } de las fiscalizaciones que tienen foto.
export function getAttachmentSummary(token, registroIds) {
  const query = buildQueryString({ ids: (registroIds || []).join(",") });
  return apiGet(`/api/adjuntos/resumen/registros${query}`, token);
}

// Origen para <Image source={...}>: la foto requiere autenticacion.
export function getAttachmentSource(token, adjuntoId) {
  return {
    uri: `${API_BASE_URL}/api/adjuntos/${adjuntoId}`,
    headers: { Authorization: `Bearer ${token}` },
  };
}

// ─── Notificaciones ───────────────────────────────────────────────────────────

export function updatePushToken(token, pushToken) {
  return apiPatch("/api/auth/push-token", { push_token: pushToken }, token);
}

export function getMyNotifications(token, limit) {
  const query = buildQueryString({ limit });
  return apiGet(`/api/notificaciones/mine${query}`, token);
}

export function markNotificationRead(token, notificacionId) {
  return apiPatch(`/api/notificaciones/${notificacionId}/leida`, {}, token);
}

export function markAllNotificationsRead(token) {
  return apiPatch("/api/notificaciones/leidas", {}, token);
}

export function deleteNotification(token, notificacionId) {
  return apiDelete(`/api/notificaciones/${notificacionId}`, token);
}

export function deleteAllNotifications(token) {
  return apiDelete("/api/notificaciones/all", token);
}

export default {
  register,
  login,
  getAssociationCreationAccess,
  getMyInvitations,
  acceptInvitation,
  createInvitation,
  getAssociationInvitations,
  cancelAssociationInvitation,
  getMyAssociations,
  createAsociacion,
  updateAsociacion,
  getAssociationMembers,
  createAssociationMember,
  updateAssociationMember,
  updateOwnAssociationMember,
  deleteAssociationMember,
  changeMembershipState,
  getAssociationUnits,
  createAssociationUnit,
  updateAssociationUnit,
  deleteAssociationUnit,
  updateMyAssociationUnit,
  getMyOwnerUnits,
  getMyOwnerTraceability,
  getOwnerUnitTraceability,
  getAssociationTraceability,
  createFiscalRecord,
  createIncidencia,
  getAssociationIncidencias,
  getIncidencia,
  updateIncidenciaEstado,
  uploadAttachment,
  getAttachmentSummary,
  getAttachmentSource,
  updatePushToken,
  getMyNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  deleteNotification,
  deleteAllNotifications,
};
