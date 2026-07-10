export const USER_ROLES = {
  OWNER: "owner",
  ADMINISTRATOR: "administrator",
  RECEPTION: "reception",
  MECHANIC: "mechanic",
};

export const USER_STATUSES = {
  INVITED: "invited",
  PENDING_APPROVAL: "pendingApproval",
  ACTIVE: "active",
  SUSPENDED: "suspended",
  DISABLED: "disabled",
};

export const INVITATION_STATUSES = {
  PENDING: "pending",
  ACCEPTED: "accepted",
  EXPIRED: "expired",
  CANCELLED: "cancelled",
};

export const REGISTRATION_POLICY = {
  mode: "open",
  allowPublicSignUp: true,
  requiresInvitation: false,
  requiresInternalApproval: false,
  defaultPublicRole: USER_ROLES.ADMINISTRATOR,
  authProvider: "jwt-api",
};

export const ROLE_PERMISSIONS = {
  [USER_ROLES.OWNER]: [
    "users.manage",
    "invitations.manage",
    "inventory.manage",
    "clients.manage",
    "vehicles.manage",
    "diagnostics.manage",
    "workOrders.manage",
    "progress.manage",
    "spareParts.manage",
    "payments.manage",
    "dashboard.view",
    "settings.manage",
    "workshop.manage",
  ],
  [USER_ROLES.ADMINISTRATOR]: [
    "users.manage",
    "invitations.manage",
    "inventory.manage",
    "clients.manage",
    "vehicles.manage",
    "diagnostics.manage",
    "workOrders.manage",
    "progress.manage",
    "spareParts.manage",
    "payments.manage",
    "dashboard.view",
    "settings.manage",
    "workshop.manage",
  ],
  [USER_ROLES.RECEPTION]: [
    "inventory.manage",
    "clients.manage",
    "vehicles.manage",
    "diagnostics.manage",
    "workOrders.manage",
    "progress.view",
    "spareParts.view",
    "dashboard.view",
  ],
  [USER_ROLES.MECHANIC]: [
    "workOrders.assigned.view",
    "diagnostics.assigned.view",
    "progress.assigned.manage",
    "spareParts.assigned.view",
  ],
};

export function hasPermission(role, permission) {
  const permissions = ROLE_PERMISSIONS[role] || [];
  return permissions.includes(permission);
}

export function canManageClients(role) {
  return hasPermission(role, "clients.manage");
}

export function canManageVehicles(role) {
  return hasPermission(role, "vehicles.manage");
}

export function canManageDiagnostics(role) {
  return hasPermission(role, "diagnostics.manage");
}

export function canManageWorkOrders(role) {
  return hasPermission(role, "workOrders.manage");
}

export function canManageInventory(role) {
  return hasPermission(role, "inventory.manage");
}

export function canManageUsers(role) {
  return hasPermission(role, "users.manage");
}

export function canManageInvitations(role) {
  return hasPermission(role, "invitations.manage");
}

export function isMechanicRole(role) {
  return role === USER_ROLES.MECHANIC;
}

export function isOwnerRole(role) {
  return role === USER_ROLES.OWNER;
}

export function isDiagnosticAssignedToUser(diagnostic, uid) {
  return diagnostic?.assignedMechanicUid === uid;
}

export function isWorkOrderAssignedToUser(workOrder, uid) {
  const assignedUids = workOrder?.assignedMechanicUids;

  if (!Array.isArray(assignedUids)) {
    return false;
  }

  return assignedUids.includes(uid);
}
