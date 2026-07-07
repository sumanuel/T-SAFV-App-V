/**
 * stockItemService.js — Mock implementation
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

function normalizeItemType(value) {
  return value === "tool" ? "tool" : "part";
}

function normalizeMovementType(value) {
  return value === "out" ? "out" : "in";
}

export const stockItemTypeOptions = [
  { key: "part", label: "Repuesto" },
  { key: "tool", label: "Herramienta" },
];

export const stockMovementTypeOptions = [
  { key: "in", label: "Entrada" },
  { key: "out", label: "Salida" },
];

export function createEmptyStockItemForm(initialValues = {}) {
  return {
    itemType: initialValues.itemType || "part",
    name: initialValues.name || "",
    quantity:
      initialValues.quantity === null || initialValues.quantity === undefined
        ? ""
        : String(initialValues.quantity),
    minimumQuantity:
      initialValues.minimumQuantity === null ||
      initialValues.minimumQuantity === undefined
        ? ""
        : String(initialValues.minimumQuantity),
    unitCost:
      initialValues.unitCost === null || initialValues.unitCost === undefined
        ? ""
        : String(initialValues.unitCost),
    supplier: initialValues.supplier || "",
    location: initialValues.location || "",
    notes: initialValues.notes || "",
  };
}

export function createEmptyStockMovementForm(initialValues = {}) {
  return {
    movementType: normalizeMovementType(initialValues.movementType),
    quantity:
      initialValues.quantity === null || initialValues.quantity === undefined
        ? ""
        : String(initialValues.quantity),
    unitCost:
      initialValues.unitCost === null || initialValues.unitCost === undefined
        ? ""
        : String(initialValues.unitCost),
    notes: initialValues.notes || "",
  };
}

export async function listStockItems() {
  await mockDelay(250);
  return storeGetAll("stockItems").sort(
    (a, b) => (Number(b.sequentialId) || 0) - (Number(a.sequentialId) || 0),
  );
}

export async function getStockItem(stockItemId) {
  await mockDelay(150);
  return storeGetById("stockItems", stockItemId);
}

export async function createStockItem({
  itemType,
  name,
  quantity,
  minimumQuantity,
  unitCost,
  supplier,
  location,
  notes,
  createdByUid,
}) {
  await mockDelay(300);
  return storeCreate("stockItems", {
    itemType: normalizeItemType(itemType),
    name: normalizeOptional(name),
    quantity: normalizeNumber(quantity) ?? 0,
    minimumQuantity: normalizeNumber(minimumQuantity),
    unitCost: normalizeNumber(unitCost),
    supplier: normalizeOptional(supplier),
    location: normalizeOptional(location),
    notes: normalizeOptional(notes),
    lastMovementType: "",
    lastMovementQuantity: null,
    lastMovementAt: null,
    lastMovementNotes: "",
    lastMovementByUid: "",
    createdByUid: normalizeOptional(createdByUid),
  });
}

export async function updateStockItem(stockItemId, payload) {
  await mockDelay(300);
  const current = storeGetById("stockItems", stockItemId);
  if (!current) throw new Error("Item de stock no encontrado.");
  return storeUpdate("stockItems", stockItemId, {
    itemType: normalizeItemType(payload.itemType),
    name: normalizeOptional(payload.name),
    minimumQuantity: normalizeNumber(payload.minimumQuantity),
    unitCost: normalizeNumber(payload.unitCost),
    supplier: normalizeOptional(payload.supplier),
    location: normalizeOptional(payload.location),
    notes: normalizeOptional(payload.notes),
  });
}

export async function deleteStockItem(stockItemId) {
  await mockDelay(300);
  storeDelete("stockItems", stockItemId);
}

export async function createStockMovement({
  stockItemId,
  movementType,
  quantity,
  unitCost,
  notes,
  performedByUid,
}) {
  await mockDelay(300);
  const current = storeGetById("stockItems", stockItemId);
  if (!current) throw new Error("No se encontro el item seleccionado.");

  const normalizedType = normalizeMovementType(movementType);
  const normalizedQty = normalizeNumber(quantity);

  if (!normalizedQty || normalizedQty <= 0) {
    throw new Error("Ingresa una cantidad valida para el movimiento.");
  }

  const previousQuantity = Number(current.quantity || 0);
  const resultingQuantity =
    normalizedType === "in"
      ? previousQuantity + normalizedQty
      : previousQuantity - normalizedQty;

  if (resultingQuantity < 0) {
    throw new Error("La salida supera la cantidad disponible en inventario.");
  }

  storeCreate("stockMovements", {
    stockItemId,
    stockItemName: current.name || "",
    movementType: normalizedType,
    quantity: normalizedQty,
    unitCost: normalizeNumber(unitCost),
    notes: normalizeOptional(notes),
    previousQuantity,
    resultingQuantity,
    performedByUid: normalizeOptional(performedByUid),
  });

  return storeUpdate("stockItems", stockItemId, {
    quantity: resultingQuantity,
    lastMovementType: normalizedType,
    lastMovementQuantity: normalizedQty,
    lastMovementAt: new Date(),
    lastMovementNotes: normalizeOptional(notes),
    lastMovementByUid: normalizeOptional(performedByUid),
  });
}

export async function listStockMovements(stockItemId) {
  await mockDelay(200);
  return storeGetAll("stockMovements")
    .filter((m) => m.stockItemId === stockItemId)
    .sort(
      (a, b) => (Number(b.sequentialId) || 0) - (Number(a.sequentialId) || 0),
    );
}
