import { ImageManipulator, SaveFormat } from "expo-image-manipulator";
import { PHOTO_JPEG_QUALITY, computeResize } from "../../utils/photoSizing";
import { persistPhoto } from "./photoFiles";

// Reduce la foto (lado mayor 1280 px, JPEG 0,6) y la deja guardada de forma
// permanente. Devuelve { path, width, height } listo para la cola de envio.
export async function preparePhoto(asset, id) {
  const context = ImageManipulator.manipulate(asset.uri);
  const resize = computeResize(asset.width, asset.height);
  if (resize) context.resize(resize);

  const rendered = await context.renderAsync();
  const result = await rendered.saveAsync({
    compress: PHOTO_JPEG_QUALITY,
    format: SaveFormat.JPEG,
  });

  const path = await persistPhoto(result.uri, id);
  return { path, width: result.width, height: result.height };
}
