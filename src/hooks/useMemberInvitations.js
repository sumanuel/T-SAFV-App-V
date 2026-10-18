import { useCallback, useEffect, useState } from "react";
import { Alert } from "react-native";
import sdk from "../services/api/sdk";
import {
  getMemberDisplayName,
  isAssociationCreatorMember,
} from "../utils/invitations";

// Miembros e invitaciones de la asociacion activa y sus acciones (invitar,
// anular, dar de baja). Los avisos al usuario salen por Alert, como antes.
export function useMemberInvitations({ token, association }) {
  const associationId = association?.id;
  const [members, setMembers] = useState([]);
  const [invitations, setInvitations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [sendingId, setSendingId] = useState(null);
  const [creatingAdminInvite, setCreatingAdminInvite] = useState(false);

  const reload = useCallback(async () => {
    if (!associationId) return;
    setLoading(true);
    try {
      const [membersRes, invitationsRes] = await Promise.all([
        sdk.getAssociationMembers(token, associationId),
        sdk.getAssociationInvitations(token, associationId),
      ]);

      setMembers(membersRes.status === 200 ? membersRes.data || [] : []);
      setInvitations(
        invitationsRes.status === 200 ? invitationsRes.data || [] : [],
      );
    } catch {
      Alert.alert(
        "Invitaciones",
        "No se pudo cargar el estado de invitaciones y miembros.",
      );
    } finally {
      setLoading(false);
    }
  }, [associationId, token]);

  useEffect(() => {
    reload();
    // Solo al cambiar de asociacion; renovar el token no debe recargar la lista.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [associationId]);

  // Crea la invitacion oficial y avisa del resultado. Devuelve true si salio bien.
  const sendInvitation = async (email, role) => {
    try {
      const res = await sdk.createInvitation(token, {
        asociacion_id: Number(associationId),
        email_invitado: email,
        rol_invitado: role,
      });

      if (res.status === 201 || res.status === 200) {
        Alert.alert(
          "Invitación enviada",
          `Se envió la invitación oficial a ${email}.`,
        );
        await reload();
        return true;
      }
      Alert.alert(
        "Error",
        res.data?.message || "No se pudo enviar la invitación.",
      );
    } catch (error) {
      Alert.alert(
        "Error",
        error?.message || "No se pudo enviar la invitación.",
      );
    }
    return false;
  };

  const createAdminInvitation = async (rawEmail) => {
    const email = rawEmail.trim().toLowerCase();
    if (!email) {
      Alert.alert("Invitaciones", "Ingresa un correo válido.");
      return false;
    }

    setCreatingAdminInvite(true);
    try {
      return await sendInvitation(email, "ADMIN");
    } finally {
      setCreatingAdminInvite(false);
    }
  };

  const inviteMember = async (member) => {
    if (!member.email || member.estado_invitacion === "ACEPTADA") return;

    setSendingId(member.membresia_id || member.id);
    try {
      await sendInvitation(member.email, member.rol);
    } finally {
      setSendingId(null);
    }
  };

  const cancelInvitation = (invitation) => {
    Alert.alert(
      "Anular invitación",
      `Se anulará la invitación enviada a ${invitation.email_invitado}.`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Anular",
          style: "destructive",
          onPress: async () => {
            const res = await sdk.cancelAssociationInvitation(
              token,
              associationId,
              invitation.id,
            );
            if (res.status === 200) {
              await reload();
            } else {
              Alert.alert(
                "Error",
                res.data?.message || "No se pudo anular la invitación.",
              );
            }
          },
        },
      ],
    );
  };

  const removeMember = (member) => {
    if (isAssociationCreatorMember(member, association)) {
      Alert.alert(
        "Miembro protegido",
        "El creador de la asociación no se puede dar de baja.",
      );
      return;
    }

    Alert.alert(
      "Dar de baja",
      `Se eliminará a ${getMemberDisplayName(member) || "este miembro"} de la asociación.`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Dar de baja",
          style: "destructive",
          onPress: async () => {
            const res = await sdk.deleteAssociationMember(
              token,
              associationId,
              member.membresia_id,
            );
            if (res.status === 200 || res.status === 204) {
              await reload();
            } else {
              Alert.alert(
                "Error",
                res.data?.message || "No se pudo dar de baja al miembro.",
              );
            }
          },
        },
      ],
    );
  };

  return {
    members,
    invitations,
    loading,
    sendingId,
    creatingAdminInvite,
    reload,
    createAdminInvitation,
    inviteMember,
    cancelInvitation,
    removeMember,
  };
}
