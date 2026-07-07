/**
 * progressEntryService.js — Mock implementation
 */
import { mockDelay } from "../mock/mockDelay";
import { storeCreate, storeGetAll } from "../mock/mockStore";

function normalizeOptional(value) {
  return value?.trim() || "";
}

export const progressEntryTypeOptions = [
  { key: "note", label: "Nota de avance" },
  { key: "photo", label: "Evidencia fotográfica" },
  { key: "status", label: "Cambio de estado" },
];

export async function listProgressEntriesByWorkOrderId(workOrderId) {
  await mockDelay(200);
  return storeGetAll("progressEntries")
    .filter((pe) => pe.workOrderId === workOrderId)
    .sort((a, b) => {
      const aMs = a.createdAt instanceof Date ? a.createdAt.getTime() : 0;
      const bMs = b.createdAt instanceof Date ? b.createdAt.getTime() : 0;
      return bMs - aMs;
    });
}

export async function createProgressEntry({
  workOrderId,
  type,
  message,
  operationalStatus,
  statusChangedTo,
  progressPercent,
  authorUid,
  authorName,
}) {
  await mockDelay(300);
  return storeCreate("progressEntries", {
    workOrderId,
    type: normalizeOptional(type) || "note",
    message: normalizeOptional(message),
    operationalStatus: normalizeOptional(operationalStatus),
    statusChangedTo: statusChangedTo || null,
    progressPercent: Number(progressPercent) || 0,
    authorUid: authorUid || "",
    authorName: authorName || "",
  });
}
