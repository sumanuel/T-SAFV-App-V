export const USER_ROLES = {
  OWNER: "owner",
  ADMINISTRATOR: "administrator",
  FISCAL: "fiscal",
};

export const USER_STATUSES = {
  INVITED: "invited",
  PENDING_APPROVAL: "pendingApproval",
  ACTIVE: "active",
  SUSPENDED: "suspended",
  DISABLED: "disabled",
};

export const ROLE_PERMISSIONS = {
  [USER_ROLES.OWNER]: [
    "profile.self.manage",
    "vehicles.self.manage",
    "fiscales.view",
    "dashboard.view",
    "traza.view",
  ],
  [USER_ROLES.ADMINISTRATOR]: [
    "users.manage",
    "invitations.manage",
    "vehicles.manage",
    "payments.manage",
    "dashboard.view",
    "settings.manage",
    "owners.manage",
    "fiscales.manage",
    "traza.view",
  ],
  [USER_ROLES.FISCAL]: [
    "fiscalRecords.manage",
    "vehicles.view",
    "fiscales.view",
    "dashboard.view",
    "traza.view",
  ],
};

export function hasPermission(role, permission) {
  const permissions = ROLE_PERMISSIONS[role] || [];
  return permissions.includes(permission);
}

export function isOwnerRole(role) {
  return role === USER_ROLES.OWNER;
}

export function isAdministratorRole(role) {
  return role === USER_ROLES.ADMINISTRATOR;
}

export function isFiscalRole(role) {
  return role === USER_ROLES.FISCAL;
}
