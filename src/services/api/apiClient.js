/**
 * apiClient.js
 * Axios client apuntando a T-SAFV-API.
 * La URL base vive en ./config.js.
 */
import axios from "axios";
import { notifySessionExpired } from "../auth/sessionExpiry";
import { recoverFromUnauthorized } from "../auth/sessionRefresh";
import { getToken } from "../auth/tokenStorage";
import { API_BASE_URL } from "./config";

export { API_BASE_URL };

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
  },
});

// Interceptor: agrega el token JWT a cada request si existe
apiClient.interceptors.request.use(async (config) => {
  try {
    const token = await getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  } catch (_) {
    // ignore storage errors
  }
  return config;
});

// Interceptor: ante un 401 intenta renovar la sesion con el refresh token y
// repite la peticion una vez; solo si no se puede renovar la sesion se
// considera vencida.
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error?.config;
    const isAuthRoute = String(original?.url || "").startsWith("/api/auth/");

    if (error?.response?.status === 401 && original && !isAuthRoute) {
      if (!original._retried) {
        original._retried = true;
        const staleToken = String(original.headers?.Authorization || "").replace(
          /^Bearer /,
          "",
        );
        const { token, expired } = await recoverFromUnauthorized(staleToken);
        if (token) {
          original.headers.Authorization = `Bearer ${token}`;
          return apiClient(original);
        }
        if (expired) notifySessionExpired();
      } else {
        notifySessionExpired();
      }
    }
    return Promise.reject(error);
  },
);

export default apiClient;
