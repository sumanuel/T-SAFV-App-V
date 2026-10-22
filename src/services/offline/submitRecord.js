/**
 * submitRecord.js
 * Envia una fiscalizacion o incidencia (con foto opcional) intentando primero en
 * linea y, si no se puede por red/servidor/sesion, la deja en la bandeja de
 * salida para reenviarla sola. Es la misma logica para ambos tipos.
 *
 * Resultados:
 *   { outcome: "sent", photo }       enviado; photo: "none" | "uploaded" | "rejected"
 *   { outcome: "photo_queued" }      registro enviado; la foto quedo en la bandeja
 *   { outcome: "queued" }            todo quedo en la bandeja (sin conexion)
 *   { outcome: "rejected", message } el servidor lo rechazo (no se reintenta);
 *                                    la foto sigue en el telefono
 */
import sdk from "../api/sdk";
import { deletePhoto, readPhotoBytes } from "../media/photoFiles";
import {
  createRemoteRecord,
  enqueue,
  isMissingRoute,
  isRetryableStatus,
  photoEntityFor,
} from "./outbox";

function rejectionMessage(res, fallback) {
  return (
    res?.data?.message ||
    res?.data?.errors?.[0]?.msg ||
    res?.data?.error ||
    fallback
  );
}

export async function submitRecord({
  kind,
  token,
  userId,
  id,
  payload,
  capturedAt,
  photo,
  fallbackMessage = "No se pudo guardar el registro.",
}) {
  const item = { id, kind, payload, capturedAt };
  const queueAll = async () => {
    await enqueue({
      id,
      kind,
      userId,
      payload,
      capturedAt,
      photos: photo ? [{ path: photo.path }] : [],
    });
  };

  const res = await createRemoteRecord(token, item);

  if (res.status !== 200 && res.status !== 201) {
    if (isRetryableStatus(res.status)) {
      await queueAll();
      return { outcome: "queued" };
    }
    // La foto no se borra: quien llama puede corregir los datos y reintentar.
    return {
      outcome: "rejected",
      message: rejectionMessage(res, fallbackMessage),
    };
  }

  if (!photo) return { outcome: "sent", photo: "none" };

  const remoteId = res.data?.id;
  if (remoteId == null) {
    // Sin id no se puede asociar la foto.
    deletePhoto(photo.path);
    return { outcome: "sent", photo: "rejected" };
  }

  const upload = await sdk.uploadAttachment(
    token,
    photoEntityFor(kind),
    remoteId,
    await readPhotoBytes(photo.path),
  );

  // 409: el servidor ya tiene la foto.
  if (upload.status === 201 || upload.status === 409) {
    deletePhoto(photo.path);
    return { outcome: "sent", photo: "uploaded" };
  }

  if (isRetryableStatus(upload.status) || isMissingRoute(upload)) {
    // El registro ya existe: al reenviar, la API devuelve el original (idempotente)
    // y la bandeja solo sube la foto.
    await queueAll();
    return { outcome: "photo_queued" };
  }

  deletePhoto(photo.path);
  return { outcome: "sent", photo: "rejected" };
}
