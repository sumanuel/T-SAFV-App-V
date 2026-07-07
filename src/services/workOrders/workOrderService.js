/**
 * workOrderService.js — Mock implementation
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

function normalizeUidList(value) {
  if (Array.isArray(value)) {
    return value.map((item) => String(item || "").trim()).filter(Boolean);
  }
  return String(value || "")
    .split(/\n|,/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function normalizeWorkOrderStatus(value) {
  const s = normalizeOptional(value);
  if (!s || s === "approved") return "open";
  return s;
}

export const workOrderStatusOptions = [
  { key: "open", label: "Abierta" },
  { key: "in-progress", label: "En proceso" },
  { key: "paused", label: "En pausa" },
  { key: "ready", label: "Lista" },
  { key: "delivered", label: "Entregada" },
];

export async function listWorkOrders() {
  await mockDelay(250);
  return storeGetAll("workOrders")
    .map((wo) => ({ ...wo, status: normalizeWorkOrderStatus(wo.status) }))
    .sort(
      (a, b) => (Number(b.sequentialId) || 0) - (Number(a.sequentialId) || 0),
    );
}

export async function getWorkOrder(workOrderId) {
  await mockDelay(150);
  const wo = storeGetById("workOrders", workOrderId);
  if (!wo) return null;
  return { ...wo, status: normalizeWorkOrderStatus(wo.status) };
}

export async function createWorkOrder({
  vehicleId,
  clientId,
  diagnosticId,
  status,
  description,
  progressPercent,
  assignedMechanicUids,
  laborCost,
  notes,
  createdByUid,
}) {
  await mockDelay(300);

  const uids = normalizeUidList(assignedMechanicUids);
  const normalizedStatus = normalizeWorkOrderStatus(status);

  if (normalizedStatus === "in-progress" && !uids.length) {
    throw new Error(
      "Asigna al menos un responsable antes de iniciar la orden.",
    );
  }

  return storeCreate("workOrders", {
    vehicleId: vehicleId || null,
    clientId: clientId || null,
    diagnosticId: diagnosticId || null,
    status: normalizedStatus || "open",
    description: normalizeOptional(description),
    progressPercent: normalizeNumber(progressPercent) ?? 0,
    assignedMechanicUids: uids,
    laborCost: normalizeNumber(laborCost),
    notes: normalizeOptional(notes),
    createdByUid: createdByUid || "",
  });
}

export async function updateWorkOrder(workOrderId, payload) {
  await mockDelay(300);
  const current = storeGetById("workOrders", workOrderId);
  if (!current) throw new Error("Orden no encontrada.");

  const uids = normalizeUidList(payload.assignedMechanicUids);
  const normalizedStatus = normalizeWorkOrderStatus(payload.status);

  if (normalizedStatus === "in-progress" && !uids.length) {
    throw new Error(
      "Asigna al menos un responsable antes de iniciar la orden.",
    );
  }

  return storeUpdate("workOrders", workOrderId, {
    status: normalizedStatus,
    description: normalizeOptional(payload.description),
    progressPercent:
      normalizeNumber(payload.progressPercent) ?? current.progressPercent,
    assignedMechanicUids: uids,
    laborCost: normalizeNumber(payload.laborCost),
    notes: normalizeOptional(payload.notes),
  });
}

export async function updateWorkOrderOperationalState(
  workOrderId,
  { status, progressPercent },
) {
  await mockDelay(200);
  const current = storeGetById("workOrders", workOrderId);
  if (!current) throw new Error("Orden no encontrada.");
  return storeUpdate("workOrders", workOrderId, {
    status: normalizeWorkOrderStatus(status) || current.status,
    progressPercent:
      normalizeNumber(progressPercent) ?? current.progressPercent,
  });
}

export async function deleteWorkOrder(workOrderId) {
  await mockDelay(300);
  storeDelete("workOrders", workOrderId);
}
