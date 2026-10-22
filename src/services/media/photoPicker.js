import * as ImagePicker from "expo-image-picker";

const PICKER_OPTIONS = {
  mediaTypes: ["images"],
  quality: 1,
  allowsMultipleSelection: false,
  exif: false,
};

// Devuelve { uri, width, height } o null si el usuario cancela. Lanza un Error
// con un mensaje legible si falta el permiso.
function toAsset(result) {
  if (result.canceled || !result.assets?.length) return null;
  const [asset] = result.assets;
  return { uri: asset.uri, width: asset.width, height: asset.height };
}

export async function capturePhoto() {
  const permission = await ImagePicker.requestCameraPermissionsAsync();
  if (!permission.granted) {
    throw new Error("Debes permitir el acceso a la cámara para tomar la foto.");
  }
  return toAsset(await ImagePicker.launchCameraAsync(PICKER_OPTIONS));
}

export async function choosePhoto() {
  const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!permission.granted) {
    throw new Error(
      "Debes permitir el acceso a la galería para elegir la foto.",
    );
  }
  return toAsset(await ImagePicker.launchImageLibraryAsync(PICKER_OPTIONS));
}
