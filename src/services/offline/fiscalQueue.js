/**
 * fiscalQueue.js
 * Cola local de fiscalizaciones que no se pudieron enviar (sin conexion o
 * error del servidor). Cada registro lleva un `client_request_id` (UUID) que
 * la API usa para ignorar reintentos duplicados, y la hora real de captura.
 */
import AsyncStorage from "@react-native-async-storage/async-storage";
import sdk from "../api/sdk";
import { logger } from "../../utils/logger";
import { uuidv4 } from "../../utils/uuid";

export const QUEUE_KEY = "@fiscal_queue_v1";

// 401 se considera reintentable: sdk ya intento renovar la sesion y, si no
// pudo, avisa al contexto; el registro se conserva para cuando vuelva a
// iniciar sesion.
const RETRYABLE_STATUS = new Set([0, 401, 408, 429]);

export function isRetryableStatus(status) {
  return RETRYABLE_STATUS.has(status) || status >= 500;
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
    logger.error("[fiscalQueue] cola ilegible, se ignora:", error);
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

export function enqueueFiscalRecord({ id, userId, payload, capturedAt }) {
  return withLock(async () => {
    const items = await load();
    const item = {
      id: id || newRequestId(),
      userId: String(userId),
      payload,
      capturedAt: capturedAt || new Date().toISOString(),
      attempts: 0,
      status: "pending",
      lastError: null,
    };
    await save([...items, item]);
    return item;
  });
}

export function discardFiscalRecord(id) {
  return withLock(async () => {
    const items = await load();
    await save(items.filter((item) => item.id !== id));
  });
}

function update(id, changes) {
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

async function doFlush({ token, userId }) {
  const all = await getQueue();
  const mine = all.filter(
    (item) => item.userId === String(userId) && item.status === "pending",
  );

  const summary = {
    sent: 0,
    failed: 0,
    remaining: mine.length,
    stopped: false,
  };

  for (const item of mine) {
    const res = await sdk.createFiscalRecord(token, {
      ...item.payload,
      client_request_id: item.id,
      fecha_hora_registro: item.capturedAt,
    });

    if (res.status === 200 || res.status === 201) {
      await discardFiscalRecord(item.id);
      summary.sent += 1;
      summary.remaining -= 1;
      continue;
    }

    if (isRetryableStatus(res.status)) {
      await update(item.id, { attempts: item.attempts + 1 });
      summary.stopped = true;
      break;
    }

    // Rechazo definitivo (validacion, permisos, unidad inexistente): reintentar
    // no lo arregla; se deja visible para que el fiscal lo descarte.
    await update(item.id, {
      status: "failed",
      attempts: item.attempts + 1,
      lastError: resolveMessage(res),
    });
    summary.failed += 1;
    summary.remaining -= 1;
  }

  return summary;
}

// Envia, en orden, los registros pendientes del usuario. Una sola ejecucion a
// la vez; se detiene ante el primer error reintentable (sin red, 5xx, sesion).
export function flushFiscalQueue({ token, userId }) {
  if (!token || userId === undefined || userId === null) {
    return Promise.resolve({
      sent: 0,
      failed: 0,
      remaining: 0,
      stopped: false,
    });
  }
  if (!flushing) {
    flushing = doFlush({ token, userId }).finally(() => {
      flushing = null;
    });
  }
  return flushing;
}
