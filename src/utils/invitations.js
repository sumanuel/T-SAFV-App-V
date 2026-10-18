export const ROLE_FILTERS = ["TODOS", "PROPIETARIO", "FISCAL", "ADMIN"];

const FILTER_LABELS = {
  TODOS: "Todos",
  PROPIETARIO: "Propietarios",
  FISCAL: "Fiscales",
  ADMIN: "Admin",
};

const ROLE_LABELS = {
  PROPIETARIO: "Propietario",
  FISCAL: "Fiscal",
};

export function getRoleFilterLabel(role) {
  return FILTER_LABELS[role] || "Admin";
}

// Todo rol distinto de propietario/fiscal se muestra como administrador.
export function getMemberRoleLabel(role) {
  return ROLE_LABELS[role] || "Administrador";
}

export function getInvitationMeta(status, colors) {
  switch (status) {
    case "ACEPTADA":
      return { label: "Aceptada", color: colors.success };
    case "INVITACION_ENVIADA":
    case "PENDIENTE":
      return { label: "Pendiente", color: colors.warning };
    case "CANCELADA":
      return { label: "Cancelada", color: colors.danger };
    default:
      return { label: "Pendiente", color: colors.textSecondary };
  }
}

export function getMemberDisplayName(member) {
  return (
    [member?.nombre, member?.apellido].filter(Boolean).join(" ") ||
    member?.email ||
    ""
  );
}

// El creador de la asociacion no se puede dar de baja ni reinvitar.
export function isAssociationCreatorMember(member, association) {
  if (member?.id == null || association?.creada_por == null) return false;
  return String(member.id) === String(association.creada_por);
}

// Une miembros e invitaciones pendientes en filas para la lista, filtradas por
// rol y, si se viene desde la ficha de un miembro, solo esa persona.
export function buildInvitationRows(
  members,
  invitations,
  { roleFilter = "TODOS", memberId = null } = {},
) {
  const memberRows = (members || []).map((member) => ({
    kind: "member",
    key: `member-${member.membresia_id || member.id}`,
    role: member.rol,
    status:
      member.estado_invitacion ||
      (member.rol === "ADMIN" ? "ACEPTADA" : "PENDIENTE_INVITACION"),
    displayName: getMemberDisplayName(member) || "Sin nombre",
    member,
  }));

  const invitationRows = (invitations || []).map((invitation) => ({
    kind: "invitation",
    key: `invitation-${invitation.id}`,
    role: invitation.rol_invitado,
    status: invitation.estado,
    displayName: invitation.email_invitado,
    invitation,
  }));

  return [...memberRows, ...invitationRows].filter((row) => {
    if (roleFilter !== "TODOS" && row.role !== roleFilter) return false;
    if (!memberId) return true;
    if (row.kind !== "member") return false;
    return (
      String(row.member.id) === String(memberId) ||
      String(row.member.membresia_id) === String(memberId)
    );
  });
}
