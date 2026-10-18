import {
  ROLE_FILTERS,
  buildInvitationRows,
  getInvitationMeta,
  getMemberDisplayName,
  getMemberRoleLabel,
  getRoleFilterLabel,
  isAssociationCreatorMember,
} from "../../src/utils/invitations";

const colors = {
  success: "verde",
  warning: "ambar",
  danger: "rojo",
  textSecondary: "gris",
};

describe("etiquetas", () => {
  it("filtros de rol", () => {
    expect(ROLE_FILTERS).toEqual(["TODOS", "PROPIETARIO", "FISCAL", "ADMIN"]);
    expect(getRoleFilterLabel("TODOS")).toBe("Todos");
    expect(getRoleFilterLabel("PROPIETARIO")).toBe("Propietarios");
    expect(getRoleFilterLabel("FISCAL")).toBe("Fiscales");
    expect(getRoleFilterLabel("ADMIN")).toBe("Admin");
  });

  it("un rol que no es propietario ni fiscal se muestra como administrador", () => {
    expect(getMemberRoleLabel("PROPIETARIO")).toBe("Propietario");
    expect(getMemberRoleLabel("FISCAL")).toBe("Fiscal");
    expect(getMemberRoleLabel("ADMIN")).toBe("Administrador");
    expect(getMemberRoleLabel(undefined)).toBe("Administrador");
  });
});

describe("getInvitationMeta", () => {
  it.each([
    ["ACEPTADA", "Aceptada", "verde"],
    ["PENDIENTE", "Pendiente", "ambar"],
    ["INVITACION_ENVIADA", "Pendiente", "ambar"],
    ["CANCELADA", "Cancelada", "rojo"],
    ["PENDIENTE_INVITACION", "Pendiente", "gris"],
    [undefined, "Pendiente", "gris"],
  ])("%s -> %s", (status, label, color) => {
    expect(getInvitationMeta(status, colors)).toEqual({ label, color });
  });
});

describe("getMemberDisplayName", () => {
  it("usa nombre y apellido, luego el correo", () => {
    expect(getMemberDisplayName({ nombre: "Ana", apellido: "Pérez" })).toBe(
      "Ana Pérez",
    );
    expect(getMemberDisplayName({ email: "a@b.c" })).toBe("a@b.c");
    expect(getMemberDisplayName({})).toBe("");
    expect(getMemberDisplayName(undefined)).toBe("");
  });
});

describe("isAssociationCreatorMember", () => {
  it("compara el id del miembro con el creador de la asociacion", () => {
    expect(isAssociationCreatorMember({ id: 7 }, { creada_por: "7" })).toBe(
      true,
    );
    expect(isAssociationCreatorMember({ id: 8 }, { creada_por: 7 })).toBe(
      false,
    );
  });

  it("sin datos no coincide (no compara 'undefined')", () => {
    expect(isAssociationCreatorMember({ id: 7 }, {})).toBe(false);
    expect(isAssociationCreatorMember({}, { creada_por: 7 })).toBe(false);
    expect(isAssociationCreatorMember(undefined, null)).toBe(false);
  });
});

describe("buildInvitationRows", () => {
  const members = [
    { id: 1, membresia_id: 11, rol: "ADMIN", nombre: "Root", email: "r@x.c" },
    { id: 2, membresia_id: 22, rol: "FISCAL", email: "f@x.c" },
    {
      id: 3,
      membresia_id: 33,
      rol: "PROPIETARIO",
      nombre: "Luis",
      estado_invitacion: "ACEPTADA",
    },
  ];
  const invitations = [
    {
      id: 5,
      rol_invitado: "FISCAL",
      estado: "PENDIENTE",
      email_invitado: "n@x.c",
    },
  ];

  it("une miembros e invitaciones con su estado", () => {
    const rows = buildInvitationRows(members, invitations);

    expect(rows.map((r) => r.key)).toEqual([
      "member-11",
      "member-22",
      "member-33",
      "invitation-5",
    ]);
    expect(rows[0].status).toBe("ACEPTADA");
    expect(rows[1].status).toBe("PENDIENTE_INVITACION");
    expect(rows[2].status).toBe("ACEPTADA");
    expect(rows[3]).toMatchObject({
      status: "PENDIENTE",
      displayName: "n@x.c",
    });
  });

  it("nombre visible: nombre, correo o 'Sin nombre'", () => {
    const rows = buildInvitationRows(
      [{ id: 1, rol: "FISCAL" }, ...members],
      [],
    );
    expect(rows[0].displayName).toBe("Sin nombre");
    expect(rows[2].displayName).toBe("f@x.c");
  });

  it("filtra por rol", () => {
    const rows = buildInvitationRows(members, invitations, {
      roleFilter: "FISCAL",
    });
    expect(rows.map((r) => r.key)).toEqual(["member-22", "invitation-5"]);
  });

  it("desde la ficha de un miembro solo muestra a esa persona (por id o membresia)", () => {
    expect(
      buildInvitationRows(members, invitations, { memberId: 3 }).map(
        (r) => r.key,
      ),
    ).toEqual(["member-33"]);
    expect(
      buildInvitationRows(members, invitations, { memberId: 22 }).map(
        (r) => r.key,
      ),
    ).toEqual(["member-22"]);
  });

  it("tolera listas ausentes", () => {
    expect(buildInvitationRows(undefined, undefined)).toEqual([]);
  });
});
