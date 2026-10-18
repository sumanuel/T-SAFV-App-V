import { useCallback, useEffect, useRef, useState } from "react";
import { AppState } from "react-native";
import {
  discardFiscalRecord,
  flushFiscalQueue,
  getQueue,
  subscribe,
} from "../services/offline/fiscalQueue";

const RETRY_INTERVAL_MS = 45 * 1000;

// Estado de la cola del usuario + envio automatico: al abrir la app, al
// volver a primer plano y cada 45 s mientras haya pendientes.
export function useFiscalQueue({ token, userId, enabled }) {
  const [items, setItems] = useState([]);
  const [syncing, setSyncing] = useState(false);
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  useEffect(() => {
    if (!enabled) {
      setItems([]);
      return undefined;
    }
    let cancelled = false;
    getQueue().then((all) => {
      if (!cancelled) setItems(all);
    });
    const unsubscribe = subscribe((all) => setItems(all));
    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, [enabled]);

  const mine = items.filter((item) => item.userId === String(userId));
  const pending = mine.filter((item) => item.status === "pending");
  const failed = mine.filter((item) => item.status === "failed");

  const flush = useCallback(async () => {
    if (!enabled || !token) return null;
    setSyncing(true);
    try {
      return await flushFiscalQueue({ token, userId });
    } finally {
      if (mounted.current) setSyncing(false);
    }
  }, [enabled, token, userId]);

  const pendingCount = pending.length;

  useEffect(() => {
    if (!enabled || !token) return undefined;
    if (pendingCount > 0) flush();

    const subscription = AppState.addEventListener("change", (state) => {
      if (state === "active") flush();
    });
    const timer = setInterval(() => {
      if (pendingCount > 0) flush();
    }, RETRY_INTERVAL_MS);

    return () => {
      subscription.remove();
      clearInterval(timer);
    };
  }, [enabled, token, pendingCount, flush]);

  return {
    pending,
    failed,
    syncing,
    flush,
    discard: discardFiscalRecord,
  };
}
