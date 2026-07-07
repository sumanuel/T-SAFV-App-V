/**
 * sparePartService.js — Mock implementation
 */
import { mockDelay } from "../mock/mockDelay";
import {
  storeCreate,
  storeDelete,
  storeGetAll,
  storeGetById,
  storeUpdate,
} from "../mock/mockStore";

function normalizeOptional(value) {
  return value?.trim() || "";
}

function normalizeNumber(value) {
  if (value === null || value === undefined || value === "") return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

export const sparePartStatusOptions = [
  { key: "requested", label: "Solicitado" },
  { key: "received", label: "Recibido" },
  { key: "installed", label: "Instalado" },
];

export async function listSpareParts(workOrderId) {
  await mockDelay(200);
  const all = storeGetAll("spareParts");
  if (workOrderId) {
    return all
      .filter((sp) => sp.workOrderId === workOrderId)
      .sort(
        (a, b) => (Number(b.sequentialId) || 0) - (Number(a.sequentialId) || 0),
      );
  }
  return all.sort(
    (a, b) => (Number(b.sequentialId) || 0) - (Number(a.sequentialId) || 0),
  );
}

export async function getSparePart(sparePartId) {
  await mockDelay(150);
  return storeGetById("spareParts", sparePartId);
}

export async function createSparePart({
  workOrderId,
  name,
  partNumber,
  quantity,
  unitPrice,
  status,
  notes,
}) {
  await mockDelay(300);
  return storeCreate("spareParts", {
    workOrderId: workOrderId || null,
    name: normalizeOptional(name),
    partNumber: normalizeOptional(partNumber),
    quantity: normalizeNumber(quantity) ?? 1,
    unitPrice: normalizeNumber(unitPrice),
    status: normalizeOptional(status) || "requested",
    notes: normalizeOptional(notes),
  });
}

export async function updateSparePart(sparePartId, payload) {
  await mockDelay(300);
  const current = storeGetById("spareParts", sparePartId);
  if (!current) throw new Error("Repuesto no encontrado.");
  return storeUpdate("spareParts", sparePartId, {
    name: normalizeOptional(payload.name),
    partNumber: normalizeOptional(payload.partNumber),
    quantity: normalizeNumber(payload.quantity) ?? current.quantity,
    unitPrice: normalizeNumber(payload.unitPrice),
    status: normalizeOptional(payload.status) || current.status,
    notes: normalizeOptional(payload.notes),
  });
}

export async function deleteSparePart(sparePartId) {
  await mockDelay(300);
  storeDelete("spareParts", sparePartId);
}
