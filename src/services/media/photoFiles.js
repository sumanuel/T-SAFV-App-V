import { Directory, File, Paths } from "expo-file-system";

// Las fotos pendientes de envio viven en el almacenamiento del documento (el
// sistema no las borra) y la cola solo guarda su ruta: no caben en AsyncStorage.
const PENDING_DIR = "pending-photos";

// Copia la foto al directorio de pendientes y devuelve su ruta definitiva.
export async function persistPhoto(sourceUri, id) {
  const directory = new Directory(Paths.document, PENDING_DIR);
  if (!directory.exists) directory.create();

  const destination = new File(directory, `${id}.jpg`);
  await new File(sourceUri).copy(destination);
  return destination.uri;
}

export function photoExists(path) {
  try {
    return new File(path).exists;
  } catch {
    return false;
  }
}

export function readPhotoBytes(path) {
  return new File(path).bytes();
}

// Borra el archivo; nunca lanza (si ya no existe, no hay nada que limpiar).
export function deletePhoto(path) {
  try {
    const file = new File(path);
    if (file.exists) file.delete();
  } catch {
    // best-effort
  }
}
