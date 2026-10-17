// Los logs de depuracion solo salen en desarrollo; los errores siempre se
// reportan (punto unico para conectar un servicio de monitoreo mas adelante).
export const logger = {
  debug: (...args) => {
    if (__DEV__) console.log(...args);
  },
  warn: (...args) => {
    if (__DEV__) console.warn(...args);
  },
  error: (...args) => {
    console.error(...args);
  },
};
