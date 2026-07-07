/**
 * vehicleService.js — Mock implementation
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

export async function listVehicles() {
  await mockDelay(250);
  return storeGetAll("vehicles").sort(
    (a, b) => (Number(b.sequentialId) || 0) - (Number(a.sequentialId) || 0),
  );
}

export async function listVehiclesByClientId(clientId) {
  await mockDelay(200);
  return storeGetAll("vehicles").filter((v) => v.clientId === clientId);
}

export async function getVehicle(vehicleId) {
  await mockDelay(150);
  return storeGetById("vehicles", vehicleId);
}

export async function createVehicle({
  clientId,
  plate,
  brand,
  model,
  year,
  color,
  mileage,
  vin,
  notes,
}) {
  await mockDelay(300);
  return storeCreate("vehicles", {
    clientId,
    plate: normalizeOptional(plate).toUpperCase(),
    brand: normalizeOptional(brand),
    model: normalizeOptional(model),
    year: Number(year) || null,
    color: normalizeOptional(color),
    mileage: Number(mileage) || 0,
    vin: normalizeOptional(vin).toUpperCase(),
    notes: normalizeOptional(notes),
  });
}

export async function updateVehicle(vehicleId, payload) {
  await mockDelay(300);
  const current = storeGetById("vehicles", vehicleId);
  if (!current) throw new Error("Vehículo no encontrado.");
  return storeUpdate("vehicles", vehicleId, {
    plate: normalizeOptional(payload.plate).toUpperCase(),
    brand: normalizeOptional(payload.brand),
    model: normalizeOptional(payload.model),
    year: Number(payload.year) || null,
    color: normalizeOptional(payload.color),
    mileage: Number(payload.mileage) || 0,
    vin: normalizeOptional(payload.vin).toUpperCase(),
    notes: normalizeOptional(payload.notes),
  });
}

export async function deleteVehicle(vehicleId) {
  await mockDelay(300);
  storeDelete("vehicles", vehicleId);
}
