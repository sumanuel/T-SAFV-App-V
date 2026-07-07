/**
 * clientService.js — Mock implementation
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

export async function listClients() {
  await mockDelay(250);
  return storeGetAll("clients").sort(
    (a, b) => (Number(b.sequentialId) || 0) - (Number(a.sequentialId) || 0),
  );
}

export async function getClient(clientId) {
  await mockDelay(150);
  return storeGetById("clients", clientId);
}

export async function createClient({
  identification,
  fullName,
  address,
  phone,
  email,
  notes,
  createdByUid,
}) {
  await mockDelay(300);
  return storeCreate("clients", {
    identification: normalizeOptional(identification),
    fullName: fullName.trim(),
    address: normalizeOptional(address),
    phone: normalizeOptional(phone),
    email: normalizeOptional(email).toLowerCase(),
    notes: normalizeOptional(notes),
    createdByUid: createdByUid || "",
  });
}

export async function updateClient(clientId, payload) {
  await mockDelay(300);
  const current = storeGetById("clients", clientId);
  if (!current) throw new Error("Cliente no encontrado.");
  return storeUpdate("clients", clientId, {
    identification: normalizeOptional(payload.identification),
    fullName: payload.fullName.trim(),
    address: normalizeOptional(payload.address),
    phone: normalizeOptional(payload.phone),
    email: normalizeOptional(payload.email).toLowerCase(),
    notes: normalizeOptional(payload.notes),
  });
}

export async function deleteClient(clientId) {
  await mockDelay(300);
  storeDelete("clients", clientId);
}
