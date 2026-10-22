/**
 * submitRecord.js
 * Envia una fiscalizacion o incidencia (con fotos opcionales) intentando primero
 * en linea y, si no se puede por red/servidor/sesion, la deja en la bandeja de
 * salida para reenviarla sola. Es la misma logica para ambos tipos.
 *
 * Resultados:
 *   { outcome: "sent", photosUploaded, photosRejected }
 *       enviado; las fotos que el servidor no acepto (formato/tamano) se descartan
 *   { outcome: "photo_queued", photosUploaded, photosRejected, photosQueued }
 *       el registro llego, pero a partir de una foto hubo un fallo temporal: esas
 *       fotos quedaron en la bandeja (las ya subidas no se repiten)
 *   { outcome: "queued" }
 *       todo quedo en la bandeja (sin conexion)
 *   { outcome: "rejected", message }
 *       el servidor lo rechazo (no se reintenta); las fotos siguen en el telefono
 */
import sdk from "../api/sdk";
import { deletePhoto, photoExists, readPhotoBytes } from "../media/photoFiles";
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
  photos = [],
  fallbackMessage = "No se pudo guardar el registro.",
}) {
  const queue = (queuedPhotos) =>
    enqueue({
      id,
      kind,
      userId,
      payload,
      capturedAt,
      photos: queuedPhotos.map((photo) => ({ path: photo.path })),
    });

  const res = await createRemoteRecord(token, {
    id,
    kind,
    payload,
    capturedAt,
  });

  if (res.status !== 200 && res.status !== 201) {
    if (isRetryableStatus(res.status)) {
      await queue(photos);
      return { outcome: "queued" };
    }
    // Las fotos no se borran: quien llama puede corregir los datos y reintentar.
    return {
      outcome: "rejected",
      message: rejectionMessage(res, fallbackMessage),
    };
  }

  const summary = { outcome: "sent", photosUploaded: 0, photosRejected: 0 };
  if (!photos.length) return summary;

  const remoteId = res.data?.id;
  if (remoteId == null) {
    // Sin id no se puede asociar ninguna foto.
    photos.forEach((photo) => deletePhoto(photo.path));
    return { ...summary, photosRejected: photos.length };
  }

  const entity = photoEntityFor(kind);
  for (let index = 0; index < photos.length; index += 1) {
    const photo = photos[index];

    if (!photoExists(photo.path)) {
      summary.photosRejected += 1;
      continue;
    }

    const upload = await sdk.uploadAttachment(
      token,
      entity,
      remoteId,
      await readPhotoBytes(photo.path),
    );

    // 409: el servidor ya tiene la foto (o se alcanzo el limite).
    if (upload.status === 201 || upload.status === 409) {
      deletePhoto(photo.path);
      summary.photosUploaded += 1;
    } else if (isRetryableStatus(upload.status) || isMissingRoute(upload)) {
      // El registro ya existe: al reenviar, la API devuelve el original
      // (idempotente) y la bandeja solo sube las fotos que faltan.
      const remaining = photos.slice(index);
      await queue(remaining);
      return {
        ...summary,
        outcome: "photo_queued",
        photosQueued: remaining.length,
      };
    } else {
      deletePhoto(photo.path);
      summary.photosRejected += 1;
    }
  }

  return summary;
}
