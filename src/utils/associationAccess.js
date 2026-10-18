import { hasPermission } from "../constants/accessControl";

const ROLE_LABELS = {
  owner: "Propietario",
  fiscal: "Fiscal",
  administrator: "Administrador",
};

export function getRoleLabel(role) {
  return ROLE_LABELS[role] || "Sin rol";
}

// Solo quien creo la asociacion (y es administrador) puede editar sus datos.
export function isAssociationCreator(profile, association) {
  if (profile?.role !== "administrator") return false;
  if (profile?.uid == null || association?.creada_por == null) return false;
  return String(association.creada_por) === String(profile.uid);
}

export function canManageInvitations(profile) {
  return hasPermission(profile?.role, "invitations.manage");
}

// Etiqueta y colores de cada accion administrativa de "Mas opciones".
export function getAdminActionState(itemKey, profile, association) {
  if (itemKey === "workshop-settings") {
    return isAssociationCreator(profile, association)
      ? {
          iconColor: "primary",
          stateLabel: "Editable",
          stateTone: "primary",
        }
      : {
          iconColor: "textSecondary",
          stateLabel: "Solo lectura",
          stateTone: "textSecondary",
        };
  }

  return canManageInvitations(profile)
    ? {
        iconColor: "accent",
        stateLabel: "Gestion activa",
        stateTone: "accent",
      }
    : {
        iconColor: "warning",
        stateLabel: "Vista limitada",
        stateTone: "warning",
      };
}

// Acciones administrativas que se muestran segun el perfil.
export function getVisibleAdminItems(items, profile, association) {
  return items.filter((item) => {
    if (item.key === "workshop-settings") {
      return isAssociationCreator(profile, association);
    }
    if (item.key === "team") return canManageInvitations(profile);
    return false;
  });
}
