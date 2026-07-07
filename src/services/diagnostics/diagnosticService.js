/**
 * diagnosticService.js — Mock implementation
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

export const diagnosticStatusOptions = [
  { key: "received", label: "Recibido" },
  { key: "in-review", label: "En revisión" },
  { key: "quoted", label: "Cotizado" },
  { key: "approved", label: "Aprobado" },
  { key: "closed", label: "Cerrado" },
];

export function isDiagnosticClosed(status) {
  return normalizeOptional(status) === "closed";
}

export async function listDiagnostics() {
  await mockDelay(250);
  return storeGetAll("diagnostics").sort(
    (a, b) => (Number(b.sequentialId) || 0) - (Number(a.sequentialId) || 0),
  );
}

export async function getDiagnostic(diagnosticId) {
  await mockDelay(150);
  return storeGetById("diagnostics", diagnosticId);
}

export async function findActiveDiagnosticByVehicleId(vehicleId) {
  await mockDelay(200);
  return (
    storeGetAll("diagnostics").find(
      (d) => d.vehicleId === vehicleId && !isDiagnosticClosed(d.status),
    ) || null
  );
}

export async function createDiagnostic({
  vehicleId,
  clientId,
  status,
  problemDescription,
  symptoms,
  estimatedCost,
  assignedMechanicUid,
  notes,
  createdByUid,
}) {
  await mockDelay(300);
  return storeCreate("diagnostics", {
    vehicleId: vehicleId || null,
    clientId: clientId || null,
    status: normalizeOptional(status) || "received",
    problemDescription: normalizeOptional(problemDescription),
    symptoms: normalizeOptional(symptoms),
    estimatedCost: normalizeNumber(estimatedCost),
    assignedMechanicUid: assignedMechanicUid || null,
    notes: normalizeOptional(notes),
    createdByUid: createdByUid || "",
  });
}

export async function updateDiagnostic(diagnosticId, payload) {
  await mockDelay(300);
  const current = storeGetById("diagnostics", diagnosticId);
  if (!current) throw new Error("Diagnóstico no encontrado.");
  return storeUpdate("diagnostics", diagnosticId, {
    status: normalizeOptional(payload.status) || current.status,
    problemDescription: normalizeOptional(payload.problemDescription),
    symptoms: normalizeOptional(payload.symptoms),
    estimatedCost: normalizeNumber(payload.estimatedCost),
    assignedMechanicUid: payload.assignedMechanicUid || null,
    notes: normalizeOptional(payload.notes),
  });
}

export async function closeDiagnostic(diagnosticId) {
  await mockDelay(200);
  return storeUpdate("diagnostics", diagnosticId, { status: "closed" });
}

export async function deleteDiagnostic(diagnosticId) {
  await mockDelay(300);
  storeDelete("diagnostics", diagnosticId);
}
