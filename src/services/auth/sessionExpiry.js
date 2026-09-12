/**
 * sessionExpiry.js
 * Notifica de forma global cuando el token JWT expira o es rechazado (401),
 * para que AuthContext pueda cerrar la sesión y evitar que la app muestre
 * estados incorrectos (ej: "activar periodo de prueba") por una sesión vencida.
 */
let handler = null;

export function setSessionExpiredHandler(fn) {
  handler = fn;
}

export function notifySessionExpired() {
  if (handler) handler();
}
