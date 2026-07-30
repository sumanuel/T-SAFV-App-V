import apiClient from "../api/apiClient";

function resolveApiError(error) {
  const data = error?.response?.data;
  if (data?.error) return data.error;
  if (error?.message === "Network Error")
    return "Sin conexión a internet. Verifica tu conexión.";
  return "Error inesperado. Intenta de nuevo.";
}

/**
 * Restablece contraseña con resetToken
 * @param {string} resetToken - Token JWT temporal
 * @param {string} newPassword - Nueva contraseña
 * @returns {Promise<{success: boolean, message: string}>}
 */
export async function apiResetPassword(resetToken, newPassword) {
  try {
    const response = await apiClient.post("/api/auth/reset-password", {
      resetToken,
      newPassword,
    });
    return response.data;
  } catch (error) {
    throw new Error(resolveApiError(error));
  }
}
