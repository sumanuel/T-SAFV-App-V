/**
 * outbox.js
 * Bandeja de salida local: fiscalizaciones e incidencias (con su foto opcional)
 * que no se pudieron enviar por falta de conexion o error del servidor.
 *
 * Cada elemento lleva un `client_request_id` (UUID) que la API usa para ignorar
 * reintentos duplicados, y la hora real de captura. El envio tiene dos pasos:
 *   1. crear el registro/incidencia (idempotente);
 *   2. subir la foto, ya con el id que devolvio la API.
 * Una foto que falla nunca hace perder el registro, que ya quedo guardado.
 */
import AsyncStorage from "@react-native-async-storage/async-storage";
import sdk from "../api/sdk";
import { logger } from "../../utils/logger";
import { uuidv4 } from "../../utils/uuid";
import { deletePhoto, photoExists, readPhotoBytes } from "../media/photoFiles";

// Se conserva la clave original para que lo pendiente de versiones anteriores
// (solo fiscalizaciones, sin `kind` ni fotos) siga enviandose tras actualizar.
export const QUEUE_KEY = "@fiscal_queue_v1";

export const KINDS = {
  FISCALIZACION: "fiscalizacion",
  INCIDENCIA: "incidencia",
};

export const KIND_LABELS = {
  [KINDS.FISCALIZACION]: "fiscalización",
  [KINDS.INCIDENCIA]: "incidencia",
};

const KIND_CONFIG = {
  [KINDS.FISCALIZACION]: {
    entity: "REGISTRO",
    create: (token, item) =>
      sdk.createFiscalRecord(token, {
        ...item.payload,
        client_request_id: item.id,
        fecha_hora_registro: item.capturedAt,
      }),
  },
  [KINDS.INCIDENCIA]: {
    entity: "INCIDENCIA",
    create: (token, item) =>
      sdk.createIncidencia(token, {
        ...item.payload,
        client_request_id: item.id,
        fecha_hora_evento: item.capturedAt,
      }),
  },
};

// 401 se considera reintentable: sdk ya intento renovar la sesion y, si no
// pudo, avisa al contexto; el elemento se conserva para cuando vuelva a
// iniciar sesion.
const RETRYABLE_STATUS = new Set([0, 401, 408, 429]);

export function isRetryableStatus(status) {
  return RETRYABLE_STATUS.has(status) || status >= 500;
}

// Un 404 sin cuerpo JSON es la ruta inexistente (API aun sin actualizar), no un
// "registro no encontrado": se reintenta en vez de descartar la foto.
export function isMissingRoute(res) {
  return res.status === 404 && !res.data;
}

// Crea el registro/incidencia en el servidor (idempotente por client_request_id).
export function createRemoteRecord(token, item) {
  return KIND_CONFIG[item.kind].create(token, item);
}

// Tipo de entidad al que se adjuntan las fotos de cada clase de elemento.
export function photoEntityFor(kind) {
  return KIND_CONFIG[kind].entity;
}

export function newRequestId() {
  return uuidv4();
}

const listeners = new Set();
let lock = Promise.resolve();
let flushing = null;

// Serializa lecturas/escrituras para que enqueue y flush no se pisen.
function withLock(task) {
  const run = lock.then(task, task);
  lock = run.catch(() => {});
  return run;
}

async function load() {
  try {
    const raw = await AsyncStorage.getItem(QUEUE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    logger.error("[outbox] cola ilegible, se ignora:", error);
    return [];
  }
}

async function save(items) {
  await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(items));
  listeners.forEach((listener) => listener(items));
}

export function subscribe(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getQueue() {
  return withLock(load);
}

const photosOf = (item) => (Array.isArray(item.photos) ? item.photos : []);

export function enqueue({
  id,
  kind = KINDS.FISCALIZACION,
  userId,
  payload,
  capturedAt,
  photos = [],
}) {
  return withLock(async () => {
    const items = await load();
    const item = {
      id: id || newRequestId(),
      kind,
      userId: String(userId),
      payload,
      capturedAt: capturedAt || new Date().toISOString(),
      photos: photos.map((photo) => ({ path: photo.path })),
      remoteId: null,
      attempts: 0,
      status: "pending",
      lastError: null,
    };
    await save([...items, item]);
    return item;
  });
}

// Quita el elemento y borra los archivos de las fotos que aun no se subieron.
export function discardItem(id) {
  return withLock(async () => {
    const items = await load();
    const target = items.find((item) => item.id === id);
    if (target) {
      photosOf(target)
        .filter((photo) => !photo.uploaded)
        .forEach((photo) => deletePhoto(photo.path));
    }
    await save(items.filter((item) => item.id !== id));
  });
}

function patch(id, changes) {
  return withLock(async () => {
    const items = await load();
    await save(
      items.map((item) => (item.id === id ? { ...item, ...changes } : item)),
    );
  });
}

function resolveMessage(res) {
  return (
    res?.data?.message ||
    res?.data?.errors?.[0]?.msg ||
    res?.data?.error ||
    `Error ${res?.status}`
  );
}

const newSummary = (remaining = 0) => ({
  sent: 0,
  failed: 0,
  remaining,
  stopped: false,
  photosDropped: 0,
});

// Sube las fotos pendientes de un elemento ya creado en el servidor.
// Devuelve "done" (todas resueltas) o "stop" (reintentar mas tarde).
async function uploadPhotos(item, token, summary) {
  const entity = KIND_CONFIG[item.kind].entity;
  const photos = photosOf(item).map((photo) => ({ ...photo }));

  for (const photo of photos) {
    if (photo.uploaded) continue;

    if (!photoExists(photo.path)) {
      // El archivo ya no esta (borrado por el sistema): no hay nada que subir.
      photo.uploaded = true;
      summary.photosDropped += 1;
      await patch(item.id, { photos });
      continue;
    }

    const res = await sdk.uploadAttachment(
      token,
      entity,
      item.remoteId,
      await readPhotoBytes(photo.path),
    );

    if (res.status === 201 || res.status === 409) {
      // 409: el servidor ya tiene la foto (el envio anterior llego pero no la
      // respuesta, o se alcanzo el limite).
      photo.uploaded = true;
      deletePhoto(photo.path);
      await patch(item.id, { photos });
      continue;
    }

    if (isMissingRoute(res) || isRetryableStatus(res.status)) {
      await patch(item.id, { attempts: item.attempts + 1 });
      return "stop";
    }

    // Rechazo definitivo de la foto (tamano, formato, permisos): se descarta la
    // foto; el registro ya esta guardado.
    logger.warn("[outbox] foto rechazada:", resolveMessage(res));
    photo.uploaded = true;
    summary.photosDropped += 1;
    deletePhoto(photo.path);
    await patch(item.id, { photos });
  }

  return "done";
}

// Procesa un elemento. Devuelve "sent" | "failed" | "stop".
async function processItem(item, token, summary) {
  const config = KIND_CONFIG[item.kind || KINDS.FISCALIZACION];
  const current = { ...item, kind: item.kind || KINDS.FISCALIZACION };

  if (current.remoteId == null) {
    const res = await config.create(token, current);

    if (res.status === 200 || res.status === 201) {
      current.remoteId = res.data?.id ?? null;
      await patch(current.id, { remoteId: current.remoteId });
    } else if (isRetryableStatus(res.status)) {
      await patch(current.id, { attempts: current.attempts + 1 });
      return "stop";
    } else {
      // Rechazo definitivo (validacion, permisos, unidad inexistente): reintentar
      // no lo arregla; se deja visible para que el usuario lo descarte.
      await patch(current.id, {
        status: "failed",
        attempts: current.attempts + 1,
        lastError: resolveMessage(res),
      });
      return "failed";
    }
  }

  const pendingPhotos = photosOf(current).filter((photo) => !photo.uploaded);
  if (pendingPhotos.length && current.remoteId == null) {
    // El servidor no devolvio el id: no se puede asociar la foto.
    pendingPhotos.forEach((photo) => deletePhoto(photo.path));
    summary.photosDropped += pendingPhotos.length;
  } else if (pendingPhotos.length) {
    if ((await uploadPhotos(current, token, summary)) === "stop") return "stop";
  }

  await discardItem(current.id);
  return "sent";
}

async function doFlush({ token, userId }) {
  const all = await getQueue();
  const mine = all.filter(
    (item) => item.userId === String(userId) && item.status === "pending",
  );
  const summary = newSummary(mine.length);

  for (const item of mine) {
    const outcome = await processItem(item, token, summary);

    if (outcome === "stop") {
      summary.stopped = true;
      break;
    }
    if (outcome === "sent") summary.sent += 1;
    else summary.failed += 1;
    summary.remaining -= 1;
  }

  return summary;
}

// Envia, en orden, los elementos pendientes del usuario. Una sola ejecucion a
// la vez; se detiene ante el primer error reintentable (sin red, 5xx, sesion).
export function flushOutbox({ token, userId }) {
  if (!token || userId === undefined || userId === null) {
    return Promise.resolve(newSummary());
  }
  if (!flushing) {
    flushing = doFlush({ token, userId }).finally(() => {
      flushing = null;
    });
  }
  return flushing;
}
