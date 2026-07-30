import apiClient from "../api/apiClient";

function resolveApiError(error) {
  const data = error?.response?.data;
  if (data?.error) return data.error;
  if (error?.message === "Network Error")
    return "Sin conexión a internet. Verifica tu conexión.";
  return "Error inesperado. Intenta de nuevo.";
}

/**
 * Verifica código de 6 dígitos
 * @param {string} email - Email del usuario
 * @param {string} code - Código de 6 dígitos
 * @returns {Promise<{success: boolean, resetToken: string}>}
 */
export async function apiVerifyResetCode(email, code) {
  try {
    const response = await apiClient.post("/api/auth/verify-reset-code", {
      email,
      code,
    });
    return response.data;
  } catch (error) {
    throw new Error(resolveApiError(error));
  }
}
