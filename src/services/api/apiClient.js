/**
 * apiClient.js
 * Cliente para los servicios de autenticacion (login, registro, recuperacion
 * de contrasena, invitaciones). Usa el mismo `request` que el SDK, asi que el
 * token, el timeout y la renovacion de sesion se manejan en un solo lugar.
 *
 * Mantiene la forma que ya esperaban los servicios: `await client.post(...)`
 * devuelve `{ data }` y un fallo lanza un error con `response.data` (o
 * `message === "Network Error"` si no hubo respuesta).
 */
import { getToken } from "../auth/tokenStorage";
import { API_BASE_URL } from "./config";
import { request } from "./sdk";

export { API_BASE_URL };

// Rutas sin sesion: un 401 aqui no significa que la sesion haya vencido.
const PUBLIC_AUTH_ROUTE =
  /^\/api\/auth\/(login|register|refresh|logout|forgot-password|verify-reset-code|reset-password)/;

async function call(method, path, body) {
  const isPublic = PUBLIC_AUTH_ROUTE.test(path);
  const token = isPublic ? null : await getToken().catch(() => null);

  const res = await request(method, path, body, token, {
    authRecovery: !isPublic,
  });

  if (res.status >= 200 && res.status < 300) {
    return { status: res.status, data: res.data };
  }

  const error = new Error(
    res.status === 0
      ? "Network Error"
      : `Request failed with status code ${res.status}`,
  );
  if (res.status !== 0) error.response = { status: res.status, data: res.data };
  throw error;
}

const apiClient = {
  get: (path) => call("GET", path),
  post: (path, body) => call("POST", path, body),
  patch: (path, body) => call("PATCH", path, body),
};

export default apiClient;
