// Lado mayor al que se reducen las fotos antes de subirlas, y calidad JPEG.
// Una foto de camara pesa 1-3 MB; asi queda en ~150-250 KB (PLAN-002 §2.3).
export const PHOTO_MAX_SIDE = 1280;
export const PHOTO_JPEG_QUALITY = 0.6;

// Devuelve el argumento de `resize` (solo el lado mayor, la proporcion se
// conserva) o null si la imagen ya es lo bastante chica.
export function computeResize(width, height, maxSide = PHOTO_MAX_SIDE) {
  if (!width || !height) return null;
  if (Math.max(width, height) <= maxSide) return null;
  return width >= height ? { width: maxSide } : { height: maxSide };
}
