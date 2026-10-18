import {
  USER_ROLES,
  hasPermission,
  isAdministratorRole,
  isFiscalRole,
  isOwnerRole,
} from "../../src/constants/accessControl";

describe("permisos por rol (flujo activo)", () => {
  it("el administrador gestiona fiscales, propietarios, invitaciones y ajustes", () => {
    for (const permission of [
      "fiscales.manage",
      "owners.manage",
      "invitations.manage",
      "settings.manage",
      "traza.view",
    ]) {
      expect(hasPermission(USER_ROLES.ADMINISTRATOR, permission)).toBe(true);
    }
  });

  it("el fiscal registra fiscalizaciones pero no administra la asociacion", () => {
    expect(hasPermission(USER_ROLES.FISCAL, "fiscalRecords.manage")).toBe(true);
    expect(hasPermission(USER_ROLES.FISCAL, "traza.view")).toBe(true);
    for (const permission of [
      "owners.manage",
      "fiscales.manage",
      "invitations.manage",
      "settings.manage",
    ]) {
      expect(hasPermission(USER_ROLES.FISCAL, permission)).toBe(false);
    }
  });

  it("el propietario solo gestiona lo suyo y ve traza", () => {
    expect(hasPermission(USER_ROLES.OWNER, "vehicles.self.manage")).toBe(true);
    expect(hasPermission(USER_ROLES.OWNER, "traza.view")).toBe(true);
    for (const permission of [
      "fiscalRecords.manage",
      "owners.manage",
      "fiscales.manage",
      "settings.manage",
    ]) {
      expect(hasPermission(USER_ROLES.OWNER, permission)).toBe(false);
    }
  });

  it("un rol desconocido no tiene ningun permiso", () => {
    expect(hasPermission("hacker", "traza.view")).toBe(false);
    expect(hasPermission(undefined, "traza.view")).toBe(false);
  });
});

describe("helpers de rol", () => {
  it("distinguen cada rol", () => {
    expect(isOwnerRole("owner")).toBe(true);
    expect(isOwnerRole("fiscal")).toBe(false);
    expect(isFiscalRole("fiscal")).toBe(true);
    expect(isAdministratorRole("administrator")).toBe(true);
    expect(isAdministratorRole("owner")).toBe(false);
  });
});
