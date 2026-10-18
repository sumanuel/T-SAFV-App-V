import {
  canManageInvitations,
  getAdminActionState,
  getRoleLabel,
  getVisibleAdminItems,
  isAssociationCreator,
} from "../../src/utils/associationAccess";

const admin = { role: "administrator", uid: "7" };
const fiscal = { role: "fiscal", uid: "8" };
const owner = { role: "owner", uid: "9" };
const association = { id: 1, creada_por: 7 };

const ITEMS = [{ key: "workshop-settings" }, { key: "team" }, { key: "otro" }];

describe("getRoleLabel", () => {
  it("traduce los roles del flujo actual", () => {
    expect(getRoleLabel("owner")).toBe("Propietario");
    expect(getRoleLabel("fiscal")).toBe("Fiscal");
    expect(getRoleLabel("administrator")).toBe("Administrador");
  });

  it("un rol desconocido o ausente es 'Sin rol'", () => {
    expect(getRoleLabel("mechanic")).toBe("Sin rol");
    expect(getRoleLabel(undefined)).toBe("Sin rol");
  });
});

describe("isAssociationCreator", () => {
  it("es el administrador que creo la asociacion (ids como texto o numero)", () => {
    expect(isAssociationCreator(admin, association)).toBe(true);
  });

  it("otro administrador, fiscal o propietario no lo es", () => {
    expect(isAssociationCreator({ ...admin, uid: "99" }, association)).toBe(
      false,
    );
    expect(isAssociationCreator(fiscal, association)).toBe(false);
    expect(isAssociationCreator(owner, association)).toBe(false);
  });

  it("sin datos de creador o de usuario nunca coincide (no compara 'undefined')", () => {
    expect(isAssociationCreator(admin, { id: 1 })).toBe(false);
    expect(isAssociationCreator(admin, null)).toBe(false);
    expect(
      isAssociationCreator(
        { role: "administrator" },
        { creada_por: undefined },
      ),
    ).toBe(false);
  });
});

describe("canManageInvitations", () => {
  it("solo el administrador", () => {
    expect(canManageInvitations(admin)).toBe(true);
    expect(canManageInvitations(fiscal)).toBe(false);
    expect(canManageInvitations(owner)).toBe(false);
    expect(canManageInvitations(undefined)).toBe(false);
  });
});

describe("getAdminActionState", () => {
  it("datos de la asociacion: editable solo para quien la creo", () => {
    expect(
      getAdminActionState("workshop-settings", admin, association).stateLabel,
    ).toBe("Editable");
    expect(
      getAdminActionState("workshop-settings", fiscal, association).stateLabel,
    ).toBe("Solo lectura");
  });

  it("miembros e invitaciones: gestion activa o vista limitada", () => {
    expect(getAdminActionState("team", admin, association).stateLabel).toBe(
      "Gestion activa",
    );
    expect(getAdminActionState("team", owner, association).stateLabel).toBe(
      "Vista limitada",
    );
  });
});

describe("getVisibleAdminItems", () => {
  it("el creador ve ambas acciones", () => {
    expect(
      getVisibleAdminItems(ITEMS, admin, association).map((i) => i.key),
    ).toEqual(["workshop-settings", "team"]);
  });

  it("un administrador que no creo la asociacion solo ve miembros", () => {
    expect(
      getVisibleAdminItems(ITEMS, { ...admin, uid: "99" }, association).map(
        (i) => i.key,
      ),
    ).toEqual(["team"]);
  });

  it("fiscales y propietarios no ven acciones administrativas", () => {
    expect(getVisibleAdminItems(ITEMS, fiscal, association)).toEqual([]);
    expect(getVisibleAdminItems(ITEMS, owner, association)).toEqual([]);
  });
});
