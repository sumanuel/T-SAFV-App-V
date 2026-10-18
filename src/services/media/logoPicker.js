import * as ImagePicker from "expo-image-picker";

// Deja elegir una imagen cuadrada de la galeria y la devuelve como data URI
// (base64). Devuelve "" si el usuario cancela; lanza Error con un mensaje
// legible si falta el permiso o la imagen no se pudo preparar.
export async function pickAssociationLogo() {
  const permissionResult =
    await ImagePicker.requestMediaLibraryPermissionsAsync();

  if (!permissionResult.granted) {
    throw new Error(
      "Debes permitir acceso a la galería para seleccionar el logo de la asociación.",
    );
  }

  const result = await ImagePicker.launchImageLibraryAsync({
    allowsEditing: true,
    aspect: [1, 1],
    base64: true,
    mediaTypes: ["images"],
    quality: 0.55,
  });

  if (result.canceled || !result.assets?.length) {
    return "";
  }

  const [asset] = result.assets;
  if (!asset?.base64) {
    throw new Error("No se pudo preparar la imagen seleccionada.");
  }

  return `data:${asset.mimeType || "image/jpeg"};base64,${asset.base64}`;
}
