/**
 * authService.js
 * Maneja login y registro contra T-SAFV-API.
 * Devuelve { token, user } normalizado para AuthContext.
 */
import apiClient from "../api/apiClient";

function resolveApiError(error) {
  const data = error?.response?.data;
  if (data?.message) return data.message;
  if (data?.errors?.[0]?.msg) return data.errors[0].msg;
  if (error?.message === "Network Error")
    return "No se pudo conectar con el servidor.";
  return "Error inesperado. Intenta de nuevo.";
}

export async function apiLogin({ email, password }) {
  try {
    const response = await apiClient.post("/api/auth/login", {
      email,
      password,
    });
    return response.data; // { token, user }
  } catch (error) {
    throw new Error(resolveApiError(error));
  }
}

export async function apiRegister({
  nombre,
  apellido,
  email,
  password,
  telefono,
  rif_cedula,
  direccion,
}) {
  try {
    const response = await apiClient.post("/api/auth/register", {
      nombre,
      apellido: apellido || "",
      email,
      password,
      telefono: telefono || "",
      rif_cedula: rif_cedula || "",
      direccion: direccion || "",
    });
    return response.data; // { message, user }
  } catch (error) {
    throw new Error(resolveApiError(error));
  }
}

export async function apiGetAssociationCreationAccess() {
  try {
    const response = await apiClient.get("/api/auth/association-access");
    return response.data;
  } catch (error) {
    throw new Error(resolveApiError(error));
  }
}

export async function apiGetMyInvitations() {
  try {
    const response = await apiClient.get("/api/invitaciones/mine");
    return response.data || [];
  } catch (error) {
    throw new Error(resolveApiError(error));
  }
}

export async function apiAcceptInvitation(token) {
  try {
    const response = await apiClient.post("/api/invitaciones/respond", {
      token,
    });
    return response.data;
  } catch (error) {
    throw new Error(resolveApiError(error));
  }
}
