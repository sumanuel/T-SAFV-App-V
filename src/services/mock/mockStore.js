/**
 * mockStore.js
 * In-memory data store that simulates a database for the mock layer.
 * All mutations are held in module-level state so they persist across
 * service calls within a single app session.
 */

let _nextId = 100;

function nextId(prefix = "doc") {
  _nextId += 1;
  return `${prefix}-${_nextId}`;
}

function now() {
  return new Date();
}

// ─── Seed data ─────────────────────────────────────────────────────────────────

const WORKSHOP = {
  id: "workshop-1",
  name: "Asociación Demo T-SAFV",
  phone: "0414-1234567",
  email: "contacto@tsafv.com",
  address: "Caracas, Venezuela",
  rif: "J-12345678-9",
  logoUrl: null,
  commercialNotes: "Asociación de demostración operativa.",
  status: "active",
  createdAt: new Date("2024-01-01"),
  updatedAt: new Date("2024-01-01"),
};

const STAFF_PROFILES = [
  {
    uid: "user-2",
    fullName: "Juan Mecánico",
    email: "juan@taller.com",
    role: "mechanic",
    status: "active",
    phone: "0414-2222222",
    workshopId: "workshop-1",
    createdAt: new Date("2024-02-01"),
  },
  {
    uid: "user-3",
    fullName: "María Recepción",
    email: "maria@taller.com",
    role: "reception",
    status: "active",
    phone: "0416-3333333",
    workshopId: "workshop-1",
    createdAt: new Date("2024-02-02"),
  },
];

const CLIENTS = [
  {
    id: "client-1",
    refId: "client-1",
    sequentialId: 1,
    workshopId: "workshop-1",
    fullName: "Pedro Rodríguez",
    identification: "V-12345678",
    phone: "0412-1234567",
    email: "pedro@gmail.com",
    address: "Caracas, Miranda",
    notes: "Cliente frecuente",
    createdAt: new Date("2024-03-01"),
    updatedAt: new Date("2024-03-01"),
  },
  {
    id: "client-2",
    refId: "client-2",
    sequentialId: 2,
    workshopId: "workshop-1",
    fullName: "Ana Gómez",
    identification: "V-23456789",
    phone: "0416-2345678",
    email: "ana@gmail.com",
    address: "Maracay, Aragua",
    notes: "",
    createdAt: new Date("2024-03-10"),
    updatedAt: new Date("2024-03-10"),
  },
  {
    id: "client-3",
    refId: "client-3",
    sequentialId: 3,
    workshopId: "workshop-1",
    fullName: "Carlos López",
    identification: "J-34567890-1",
    phone: "0424-3456789",
    email: "carlos@empresa.com",
    address: "Valencia, Carabobo",
    notes: "Empresa de transporte",
    createdAt: new Date("2024-04-05"),
    updatedAt: new Date("2024-04-05"),
  },
];

const VEHICLES = [
  {
    id: "vehicle-1",
    refId: "vehicle-1",
    sequentialId: 1,
    workshopId: "workshop-1",
    clientId: "client-1",
    plate: "ABC-123",
    brand: "Toyota",
    model: "Corolla",
    year: 2018,
    color: "Blanco",
    mileage: 85000,
    vin: "1HGCM82633A004352",
    notes: "",
    createdAt: new Date("2024-03-02"),
    updatedAt: new Date("2024-03-02"),
  },
  {
    id: "vehicle-2",
    refId: "vehicle-2",
    sequentialId: 2,
    workshopId: "workshop-1",
    clientId: "client-1",
    plate: "XYZ-456",
    brand: "Ford",
    model: "F-150",
    year: 2020,
    color: "Negro",
    mileage: 45000,
    vin: "",
    notes: "Camioneta de trabajo",
    createdAt: new Date("2024-03-15"),
    updatedAt: new Date("2024-03-15"),
  },
  {
    id: "vehicle-3",
    refId: "vehicle-3",
    sequentialId: 3,
    workshopId: "workshop-1",
    clientId: "client-2",
    plate: "LMN-789",
    brand: "Chevrolet",
    model: "Spark",
    year: 2019,
    color: "Rojo",
    mileage: 62000,
    vin: "",
    notes: "",
    createdAt: new Date("2024-03-12"),
    updatedAt: new Date("2024-03-12"),
  },
  {
    id: "vehicle-4",
    refId: "vehicle-4",
    sequentialId: 4,
    workshopId: "workshop-1",
    clientId: "client-3",
    plate: "DEF-321",
    brand: "Honda",
    model: "Civic",
    year: 2021,
    color: "Gris",
    mileage: 30000,
    vin: "2HGFC2F59MH536438",
    notes: "Vehículo corporativo",
    createdAt: new Date("2024-04-06"),
    updatedAt: new Date("2024-04-06"),
  },
];

const DIAGNOSTICS = [
  {
    id: "diag-1",
    refId: "diag-1",
    sequentialId: 1,
    workshopId: "workshop-1",
    vehicleId: "vehicle-1",
    clientId: "client-1",
    status: "in-review",
    problemDescription:
      "Motor presenta ruido anormal al arrancar. Posible falla en el sistema de arranque o en el alternador.",
    symptoms: "Ruido, vibración excesiva",
    estimatedCost: 250,
    assignedMechanicUid: "user-2",
    createdAt: new Date("2024-06-01"),
    updatedAt: new Date("2024-06-01"),
  },
  {
    id: "diag-2",
    refId: "diag-2",
    sequentialId: 2,
    workshopId: "workshop-1",
    vehicleId: "vehicle-3",
    clientId: "client-2",
    status: "quoted",
    problemDescription:
      "Frenos requieren revisión completa. Pastillas desgastadas y disco trasero con marcas.",
    symptoms: "Chirrido al frenar, frenado largo",
    estimatedCost: 180,
    assignedMechanicUid: null,
    createdAt: new Date("2024-06-05"),
    updatedAt: new Date("2024-06-06"),
  },
  {
    id: "diag-3",
    refId: "diag-3",
    sequentialId: 3,
    workshopId: "workshop-1",
    vehicleId: "vehicle-4",
    clientId: "client-3",
    status: "approved",
    problemDescription:
      "Mantenimiento preventivo: cambio de aceite, filtros de aceite y aire, revisión de niveles.",
    symptoms: "Servicio programado",
    estimatedCost: 120,
    assignedMechanicUid: "user-2",
    createdAt: new Date("2024-06-10"),
    updatedAt: new Date("2024-06-11"),
  },
];

const WORK_ORDERS = [
  {
    id: "wo-1",
    refId: "wo-1",
    sequentialId: 1,
    workshopId: "workshop-1",
    vehicleId: "vehicle-1",
    clientId: "client-1",
    diagnosticId: "diag-1",
    status: "in-progress",
    description:
      "Diagnóstico y reparación de sistema de arranque. Se incluye revisión del alternador.",
    progressPercent: 60,
    assignedMechanicUids: ["user-2"],
    laborCost: 150,
    notes: "",
    createdAt: new Date("2024-06-02"),
    updatedAt: new Date("2024-06-12"),
  },
  {
    id: "wo-2",
    refId: "wo-2",
    sequentialId: 2,
    workshopId: "workshop-1",
    vehicleId: "vehicle-4",
    clientId: "client-3",
    diagnosticId: "diag-3",
    status: "ready",
    description:
      "Servicio de mantenimiento preventivo: aceite, filtros y revisión general.",
    progressPercent: 100,
    assignedMechanicUids: ["user-2"],
    laborCost: 80,
    notes: "Listo para entrega",
    createdAt: new Date("2024-06-11"),
    updatedAt: new Date("2024-06-13"),
  },
];

const SPARE_PARTS = [
  {
    id: "spare-1",
    refId: "spare-1",
    sequentialId: 1,
    workshopId: "workshop-1",
    workOrderId: "wo-1",
    name: "Filtro de aceite",
    partNumber: "FO-1254",
    quantity: 1,
    unitPrice: 45,
    status: "installed",
    notes: "",
    createdAt: new Date("2024-06-03"),
    updatedAt: new Date("2024-06-12"),
  },
  {
    id: "spare-2",
    refId: "spare-2",
    sequentialId: 2,
    workshopId: "workshop-1",
    workOrderId: "wo-1",
    name: "Aceite 5W30 4L",
    partNumber: "AC-5W30-4L",
    quantity: 2,
    unitPrice: 38,
    status: "installed",
    notes: "Marca Mobil",
    createdAt: new Date("2024-06-03"),
    updatedAt: new Date("2024-06-12"),
  },
  {
    id: "spare-3",
    refId: "spare-3",
    sequentialId: 3,
    workshopId: "workshop-1",
    workOrderId: "wo-2",
    name: "Filtro de aire",
    partNumber: "FA-9988",
    quantity: 1,
    unitPrice: 28,
    status: "installed",
    notes: "",
    createdAt: new Date("2024-06-11"),
    updatedAt: new Date("2024-06-13"),
  },
];

const STOCK_ITEMS = [
  {
    id: "stock-1",
    refId: "stock-1",
    sequentialId: 1,
    workshopId: "workshop-1",
    itemType: "part",
    name: "Aceite Mobil 5W30 4L",
    quantity: 18,
    minimumQuantity: 5,
    unitCost: 38,
    supplier: "Distribuidora Lubricantes S.A.",
    location: "Estante A-1",
    notes: "Reponer cuando baje de 5 unidades",
    lastMovementType: "",
    lastMovementQuantity: null,
    lastMovementAt: null,
    lastMovementNotes: "",
    lastMovementByUid: "",
    createdAt: new Date("2024-01-15"),
    updatedAt: new Date("2024-06-13"),
  },
  {
    id: "stock-2",
    refId: "stock-2",
    sequentialId: 2,
    workshopId: "workshop-1",
    itemType: "part",
    name: "Filtro de aceite universal",
    quantity: 12,
    minimumQuantity: 3,
    unitCost: 45,
    supplier: "Auto Partes del Centro",
    location: "Estante A-2",
    notes: "",
    lastMovementType: "",
    lastMovementQuantity: null,
    lastMovementAt: null,
    lastMovementNotes: "",
    lastMovementByUid: "",
    createdAt: new Date("2024-01-15"),
    updatedAt: new Date("2024-06-10"),
  },
  {
    id: "stock-3",
    refId: "stock-3",
    sequentialId: 3,
    workshopId: "workshop-1",
    itemType: "part",
    name: "Pastillas de freno delanteras (par)",
    quantity: 6,
    minimumQuantity: 2,
    unitCost: 120,
    supplier: "Frenos y Más",
    location: "Estante B-1",
    notes: "",
    lastMovementType: "",
    lastMovementQuantity: null,
    lastMovementAt: null,
    lastMovementNotes: "",
    lastMovementByUid: "",
    createdAt: new Date("2024-02-01"),
    updatedAt: new Date("2024-05-20"),
  },
  {
    id: "stock-4",
    refId: "stock-4",
    sequentialId: 4,
    workshopId: "workshop-1",
    itemType: "part",
    name: "Filtro de aire genérico",
    quantity: 2,
    minimumQuantity: 3,
    unitCost: 28,
    supplier: "Auto Partes del Centro",
    location: "Estante A-2",
    notes: "Stock bajo, pedir urgente",
    lastMovementType: "",
    lastMovementQuantity: null,
    lastMovementAt: null,
    lastMovementNotes: "",
    lastMovementByUid: "",
    createdAt: new Date("2024-02-10"),
    updatedAt: new Date("2024-06-05"),
  },
  {
    id: "stock-5",
    refId: "stock-5",
    sequentialId: 5,
    workshopId: "workshop-1",
    itemType: "tool",
    name: "Llave torque digital",
    quantity: 1,
    minimumQuantity: 1,
    unitCost: 380,
    supplier: "",
    location: "Panel de herramientas",
    notes: "Herramienta compartida",
    lastMovementType: "",
    lastMovementQuantity: null,
    lastMovementAt: null,
    lastMovementNotes: "",
    lastMovementByUid: "",
    createdAt: new Date("2024-01-20"),
    updatedAt: new Date("2024-01-20"),
  },
];

const PROGRESS_ENTRIES = [
  {
    id: "prog-1",
    refId: "prog-1",
    workshopId: "workshop-1",
    workOrderId: "wo-1",
    type: "note",
    message:
      "Se recibió el vehículo. Revisión inicial completada, se detectó falla en motor de arranque.",
    operationalStatus: "in-progress",
    statusChangedTo: "in-progress",
    progressPercent: 20,
    authorUid: "user-2",
    authorName: "Juan Mecánico",
    createdAt: new Date("2024-06-02T09:00:00"),
  },
  {
    id: "prog-2",
    refId: "prog-2",
    workshopId: "workshop-1",
    workOrderId: "wo-1",
    type: "note",
    message:
      "Motor de arranque desmontado y revisado. Se solicitan repuestos necesarios.",
    operationalStatus: "in-progress",
    statusChangedTo: null,
    progressPercent: 40,
    authorUid: "user-2",
    authorName: "Juan Mecánico",
    createdAt: new Date("2024-06-10T14:30:00"),
  },
  {
    id: "prog-3",
    refId: "prog-3",
    workshopId: "workshop-1",
    workOrderId: "wo-1",
    type: "note",
    message: "Repuestos recibidos. Instalación en progreso.",
    operationalStatus: "in-progress",
    statusChangedTo: null,
    progressPercent: 60,
    authorUid: "user-2",
    authorName: "Juan Mecánico",
    createdAt: new Date("2024-06-12T11:00:00"),
  },
  {
    id: "prog-4",
    refId: "prog-4",
    workshopId: "workshop-1",
    workOrderId: "wo-2",
    type: "note",
    message:
      "Servicio de mantenimiento completado. Aceite, filtros cambiados. Niveles revisados.",
    operationalStatus: "ready",
    statusChangedTo: "ready",
    progressPercent: 100,
    authorUid: "user-2",
    authorName: "Juan Mecánico",
    createdAt: new Date("2024-06-13T16:00:00"),
  },
];

const STOCK_MOVEMENTS = [];

// ─── Store state ────────────────────────────────────────────────────────────────

const store = {
  workshop: { ...WORKSHOP },
  staffProfiles: [...STAFF_PROFILES],
  clients: CLIENTS.map((c) => ({ ...c })),
  vehicles: VEHICLES.map((v) => ({ ...v })),
  diagnostics: DIAGNOSTICS.map((d) => ({ ...d })),
  workOrders: WORK_ORDERS.map((wo) => ({ ...wo })),
  spareParts: SPARE_PARTS.map((sp) => ({ ...sp })),
  stockItems: STOCK_ITEMS.map((si) => ({ ...si })),
  progressEntries: PROGRESS_ENTRIES.map((pe) => ({ ...pe })),
  stockMovements: [...STOCK_MOVEMENTS],
  pendingInvitations: [],
  pendingApprovals: [],
};

// ─── Counters ───────────────────────────────────────────────────────────────────

const counters = {
  clients: CLIENTS.length,
  vehicles: VEHICLES.length,
  diagnostics: DIAGNOSTICS.length,
  workOrders: WORK_ORDERS.length,
  spareParts: SPARE_PARTS.length,
  stockItems: 5,
  progressEntries: PROGRESS_ENTRIES.length,
  stockMovements: 0,
  staffInvitations: 0,
};

function nextSequentialId(collection) {
  counters[collection] = (counters[collection] || 0) + 1;
  return counters[collection];
}

// ─── Generic CRUD helpers ────────────────────────────────────────────────────────

export function storeGetAll(collection) {
  return [...(store[collection] || [])];
}

export function storeGetById(collection, id) {
  return (
    (store[collection] || []).find((item) => (item.refId || item.id) === id) ||
    null
  );
}

export function storeCreate(collection, data) {
  const id = nextId(collection.replace(/s$/, ""));
  const seqId = nextSequentialId(collection);
  const item = {
    id,
    refId: id,
    sequentialId: seqId,
    workshopId: "workshop-1",
    ...data,
    createdAt: now(),
    updatedAt: now(),
  };
  store[collection] = [...(store[collection] || []), item];
  return { ...item };
}

export function storeUpdate(collection, id, data) {
  const index = (store[collection] || []).findIndex(
    (item) => (item.refId || item.id) === id,
  );

  if (index === -1) {
    throw new Error(`Item ${id} not found in ${collection}`);
  }

  const updated = {
    ...store[collection][index],
    ...data,
    updatedAt: now(),
  };

  store[collection] = [
    ...store[collection].slice(0, index),
    updated,
    ...store[collection].slice(index + 1),
  ];

  return { ...updated };
}

export function storeDelete(collection, id) {
  store[collection] = (store[collection] || []).filter(
    (item) => (item.refId || item.id) !== id,
  );
}

// ─── Workshop helpers ────────────────────────────────────────────────────────────

export function getWorkshop() {
  return { ...store.workshop };
}

export function updateWorkshop(data) {
  store.workshop = { ...store.workshop, ...data, updatedAt: now() };
  return { ...store.workshop };
}

export function resetWorkshopData() {
  store.clients = [];
  store.vehicles = [];
  store.diagnostics = [];
  store.workOrders = [];
  store.spareParts = [];
  store.stockItems = [];
  store.progressEntries = [];
  store.stockMovements = [];
  Object.keys(counters).forEach((key) => {
    counters[key] = 0;
  });
}

// ─── Staff helpers ────────────────────────────────────────────────────────────────

export function getStaffProfiles() {
  return store.staffProfiles.map((p) => ({ ...p }));
}

export function addStaffProfile(profile) {
  store.staffProfiles = [
    ...store.staffProfiles,
    { ...profile, createdAt: now() },
  ];
}

export function updateStaffProfile(uid, data) {
  const index = store.staffProfiles.findIndex((p) => p.uid === uid);
  if (index === -1) return;
  store.staffProfiles[index] = {
    ...store.staffProfiles[index],
    ...data,
    updatedAt: now(),
  };
}
