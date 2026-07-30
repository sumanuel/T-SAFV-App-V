import apiClient from "../api/apiClient";

function resolveApiError(error) {
  const data = error?.response?.data;
  if (data?.error) return data.error;
  if (error?.message === "Network Error")
    return "Sin conexión a internet. Verifica tu conexión.";
  return "Error inesperado. Intenta de nuevo.";
}

/**
 * Solicita código de recuperación por email
 * @param {string} email - Email del usuario
 * @returns {Promise<{success: boolean, message: string}>}
 */
export async function apiForgotPassword(email) {
  try {
    const response = await apiClient.post("/api/auth/forgot-password", {
      email,
    });
    return response.data;
  } catch (error) {
    throw new Error(resolveApiError(error));
  }
}
