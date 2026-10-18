/**
 * sessionRefresh.js
 * Renueva el access token con el refresh token cuando la API responde 401.
 *
 * La API rota el refresh token en cada uso y, si recibe uno ya usado, cierra
 * todas las sesiones. Por eso solo puede haber UNA renovacion en vuelo y, si
 * un token viejo ya fue reemplazado, se reutiliza el nuevo sin volver a
 * llamar a la API.
 */
import { API_BASE_URL } from "../api/config";
import {
  getRefreshToken,
  removeRefreshToken,
  setRefreshToken,
  setToken,
} from "./tokenStorage";

const MAX_REMEMBERED_REPLACEMENTS = 8;
const REFRESH_TIMEOUT_MS = 15000;

let inFlight = null;
let onRefreshed = null;
const replacedTokens = new Map();

export function setSessionRefreshedHandler(fn) {
  onRefreshed = fn;
}

export function resetSessionRefresh() {
  inFlight = null;
  replacedTokens.clear();
}

async function requestRefresh() {
  const refreshToken = await getRefreshToken();
  if (!refreshToken) return { status: "expired" };

  let response;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REFRESH_TIMEOUT_MS);
  try {
    response = await fetch(`${API_BASE_URL}/api/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refresh_token: refreshToken }),
      signal: controller.signal,
    });
  } catch {
    return { status: "offline" };
  } finally {
    clearTimeout(timer);
  }

  if (response.status === 400 || response.status === 401) {
    await removeRefreshToken();
    return { status: "expired" };
  }
  if (!response.ok) return { status: "offline" };

  const data = await response.json().catch(() => null);
  if (!data?.token || !data?.refresh_token) return { status: "offline" };

  await Promise.all([
    setToken(data.token),
    setRefreshToken(data.refresh_token),
  ]);
  onRefreshed?.({ token: data.token, user: data.user });
  return { status: "ok", token: data.token };
}

function remember(staleToken, freshToken) {
  if (!staleToken) return;
  replacedTokens.set(staleToken, freshToken);
  if (replacedTokens.size > MAX_REMEMBERED_REPLACEMENTS) {
    replacedTokens.delete(replacedTokens.keys().next().value);
  }
}

// Resultado: { status: "ok", token } | { status: "expired" } | { status: "offline" }
export function refreshAccessToken(staleToken) {
  if (staleToken && replacedTokens.has(staleToken)) {
    return Promise.resolve({
      status: "ok",
      token: replacedTokens.get(staleToken),
    });
  }

  if (!inFlight) {
    inFlight = requestRefresh().finally(() => {
      inFlight = null;
    });
  }

  return inFlight.then((result) => {
    if (result.status === "ok") remember(staleToken, result.token);
    return result;
  });
}

// `expired` = la sesion no se puede recuperar (hay que volver al login).
// Si solo no hay red, `token` y `expired` son falsos y no se cierra la sesion.
export async function recoverFromUnauthorized(staleToken) {
  const result = await refreshAccessToken(staleToken);
  return {
    token: result.status === "ok" ? result.token : null,
    expired: result.status === "expired",
  };
}
