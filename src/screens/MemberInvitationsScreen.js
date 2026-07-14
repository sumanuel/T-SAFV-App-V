import { Ionicons } from "@expo/vector-icons";
import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import WorkshopScreenHeader from "../components/common/WorkshopScreenHeader";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import sdk from "../services/api/sdk";
import { borderRadius, rf, spacing } from "../utils/responsive";

const ROLE_FILTERS = ["TODOS", "PROPIETARIO", "FISCAL", "ADMIN"];

function getInvitationMeta(status, colors) {
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

export default function MemberInvitationsScreen({
  onBack,
  initialRole = "TODOS",
  initialMemberId = null,
}) {
  const { colors } = useTheme();
  const { token, activeAssociation } = useAuth();
  const [members, setMembers] = useState([]);
  const [invitations, setInvitations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [sendingId, setSendingId] = useState(null);
  const [roleFilter, setRoleFilter] = useState(initialRole);
  const [adminEmail, setAdminEmail] = useState("");
  const [creatingAdminInvite, setCreatingAdminInvite] = useState(false);

  const asociacionId = activeAssociation?.id;

  const loadData = async () => {
    if (!asociacionId) return;
    setLoading(true);
    try {
      const [membersRes, invitationsRes] = await Promise.all([
        sdk.getAssociationMembers(token, asociacionId),
        sdk.getAssociationInvitations(token, asociacionId),
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
  };

  useEffect(() => {
    loadData();
  }, [asociacionId]);

  const rows = useMemo(() => {
    const memberRows = (members || []).map((member) => ({
      kind: "member",
      key: `member-${member.membresia_id || member.id}`,
      role: member.rol,
      status:
        member.estado_invitacion ||
        (member.rol === "ADMIN" ? "ACEPTADA" : "PENDIENTE_INVITACION"),
      displayName:
        [member.nombre, member.apellido].filter(Boolean).join(" ") ||
        member.email ||
        "Sin nombre",
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
      if (!initialMemberId) return true;
      if (row.kind === "member") {
        return (
          String(row.member.id) === String(initialMemberId) ||
          String(row.member.membresia_id) === String(initialMemberId)
        );
      }
      return false;
    });
  }, [initialMemberId, invitations, members, roleFilter]);

  const handleCreateAdminInvitation = async () => {
    const email = adminEmail.trim().toLowerCase();
    if (!email) {
      Alert.alert("Invitaciones", "Ingresa un correo válido.");
      return;
    }

    setCreatingAdminInvite(true);
    try {
      const res = await sdk.createInvitation(token, {
        asociacion_id: Number(asociacionId),
        email_invitado: email,
        rol_invitado: "ADMIN",
      });

      if (res.status === 201 || res.status === 200) {
        setAdminEmail("");
        Alert.alert(
          "Invitación enviada",
          `Se envió la invitación oficial a ${email}.`,
        );
        await loadData();
      } else {
        Alert.alert(
          "Error",
          res.data?.message || "No se pudo enviar la invitación.",
        );
      }
    } catch (error) {
      Alert.alert(
        "Error",
        error?.message || "No se pudo enviar la invitación.",
      );
    } finally {
      setCreatingAdminInvite(false);
    }
  };

  const handleSendInvitation = async (member) => {
    if (!member.email || member.estado_invitacion === "ACEPTADA") {
      return;
    }

    setSendingId(member.membresia_id || member.id);
    try {
      const res = await sdk.createInvitation(token, {
        asociacion_id: Number(asociacionId),
        email_invitado: member.email,
        rol_invitado: member.rol,
      });

      if (res.status === 201 || res.status === 200) {
        Alert.alert(
          "Invitación enviada",
          `Se envió la invitación oficial a ${member.email}.`,
        );
        await loadData();
      } else {
        Alert.alert(
          "Error",
          res.data?.message || "No se pudo enviar la invitación.",
        );
      }
    } catch (error) {
      Alert.alert(
        "Error",
        error?.message || "No se pudo enviar la invitación.",
      );
    } finally {
      setSendingId(null);
    }
  };

  const handleCancelInvitation = (invitation) => {
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
              asociacionId,
              invitation.id,
            );
            if (res.status === 200) {
              await loadData();
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

  const handleRemoveMember = (member) => {
    if (String(member.id) === String(activeAssociation?.creada_por)) {
      Alert.alert(
        "Miembro protegido",
        "El creador de la asociación no se puede dar de baja.",
      );
      return;
    }

    Alert.alert(
      "Dar de baja",
      `Se eliminará a ${
        [member.nombre, member.apellido].filter(Boolean).join(" ") ||
        member.email ||
        "este miembro"
      } de la asociación.`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Dar de baja",
          style: "destructive",
          onPress: async () => {
            const res = await sdk.deleteAssociationMember(
              token,
              asociacionId,
              member.membresia_id,
            );
            if (res.status === 200 || res.status === 204) {
              await loadData();
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

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.container}>
        <WorkshopScreenHeader
          onBack={onBack}
          section="Invitaciones"
          title="Invitaciones oficiales"
          subtitle="Envía la activación oficial a administradores, propietarios y fiscales de la asociación activa."
        />

        <View style={styles.filterRow}>
          {ROLE_FILTERS.map((role) => {
            const active = role === roleFilter;
            return (
              <Pressable
                key={role}
                onPress={() => setRoleFilter(role)}
                style={[
                  styles.filterChip,
                  {
                    backgroundColor: active
                      ? colors.primary
                      : colors.cardBackground,
                    borderColor: active ? colors.primary : colors.border,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.filterChipText,
                    { color: active ? colors.white : colors.text },
                  ]}
                >
                  {role === "TODOS"
                    ? "Todos"
                    : role === "PROPIETARIO"
                      ? "Propietarios"
                      : role === "FISCAL"
                        ? "Fiscales"
                        : "Admin"}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {roleFilter === "ADMIN" && (
          <View
            style={[
              styles.createCard,
              {
                backgroundColor: colors.cardBackground,
                borderColor: colors.border,
              },
            ]}
          >
            <View style={styles.createHeaderRow}>
              <View style={styles.memberCardCopy}>
                <Text style={[styles.memberTitle, { color: colors.text }]}>
                  Nueva invitación
                </Text>
                <Text
                  style={[styles.memberMeta, { color: colors.textSecondary }]}
                >
                  Esta invitación será para un perfil de Administrador dentro de
                  la asociación activa.
                </Text>
              </View>
              <Pressable
                onPress={loadData}
                style={[
                  styles.stateBadge,
                  {
                    backgroundColor: colors.cardMuted,
                    borderColor: colors.border,
                  },
                ]}
              >
                <Text style={[styles.stateBadgeText, { color: colors.text }]}>
                  Actualizar
                </Text>
              </Pressable>
            </View>

            <Text
              style={[styles.memberEyebrow, { color: colors.textSecondary }]}
            >
              Correo
            </Text>
            <TextInput
              value={adminEmail}
              onChangeText={setAdminEmail}
              placeholder="correo@dominio.com"
              placeholderTextColor={colors.textTertiary}
              autoCapitalize="none"
              keyboardType="email-address"
              style={[
                styles.input,
                {
                  backgroundColor: colors.cardMuted,
                  borderColor: colors.border,
                  color: colors.text,
                },
              ]}
            />

            <Text
              style={[styles.memberEyebrow, { color: colors.textSecondary }]}
            >
              Perfil operativo
            </Text>
            <View style={styles.filterRow}>
              <View
                style={[
                  styles.filterChip,
                  {
                    backgroundColor: colors.primary,
                    borderColor: colors.primary,
                  },
                ]}
              >
                <Text style={[styles.filterChipText, { color: colors.white }]}>
                  Administrador
                </Text>
              </View>
            </View>

            <Pressable
              onPress={handleCreateAdminInvitation}
              disabled={creatingAdminInvite}
              style={[styles.inviteButton, { backgroundColor: colors.primary }]}
            >
              {creatingAdminInvite ? (
                <ActivityIndicator color={colors.white} size="small" />
              ) : (
                <>
                  <Ionicons
                    name="mail-outline"
                    size={rf(18)}
                    color={colors.white}
                  />
                  <Text
                    style={[styles.inviteButtonText, { color: colors.white }]}
                  >
                    Enviar invitación
                  </Text>
                </>
              )}
            </Pressable>
          </View>
        )}

        {loading ? (
          <ActivityIndicator
            color={colors.primary}
            style={{ marginTop: spacing.lg }}
          />
        ) : rows.length ? (
          rows.map((row) => {
            const state = getInvitationMeta(row.status, colors);
            const isMember = row.kind === "member";
            const member = row.member;
            const invitation = row.invitation;
            const isSending =
              String(sendingId) ===
              String(isMember ? member.membresia_id || member.id : row.key);
            const isAssociationCreatorMember =
              isMember &&
              String(member.id) === String(activeAssociation?.creada_por);

            return (
              <View
                key={row.key}
                style={[
                  styles.memberCard,
                  {
                    backgroundColor: colors.cardBackground,
                    borderColor: colors.border,
                  },
                ]}
              >
                <View style={styles.memberCardHeader}>
                  <View style={styles.memberCardCopy}>
                    <Text
                      style={[styles.memberEyebrow, { color: colors.primary }]}
                    >
                      {row.role === "PROPIETARIO"
                        ? "Propietario"
                        : row.role === "FISCAL"
                          ? "Fiscal"
                          : "Administrador"}
                    </Text>
                    <Text style={[styles.memberTitle, { color: colors.text }]}>
                      {row.displayName || "Sin nombre"}
                    </Text>
                  </View>
                  <View
                    style={[
                      styles.stateBadge,
                      {
                        backgroundColor: colors.cardMuted,
                        borderColor: colors.border,
                      },
                    ]}
                  >
                    <Text
                      style={[styles.stateBadgeText, { color: state.color }]}
                    >
                      {state.label}
                    </Text>
                  </View>
                </View>

                <Text style={[styles.memberMeta, { color: colors.text }]}>
                  <Text style={styles.memberMetaStrong}>Correo:</Text>{" "}
                  {isMember
                    ? member.email || "Sin correo"
                    : invitation.email_invitado}
                </Text>

                {isMember ? (
                  <>
                    <Text style={[styles.memberMeta, { color: colors.text }]}>
                      <Text style={styles.memberMetaStrong}>Teléfono:</Text>{" "}
                      {member.telefono || "Sin teléfono"}
                    </Text>
                    {member.rol === "FISCAL" ? (
                      <Text style={[styles.memberMeta, { color: colors.text }]}>
                        <Text style={styles.memberMetaStrong}>
                          Punto de control:
                        </Text>{" "}
                        {member.punto_control || "Sin punto de control"}
                      </Text>
                    ) : null}
                  </>
                ) : null}

                {isMember ? (
                  <View style={styles.actionColumn}>
                    {member.estado_invitacion !== "ACEPTADA" &&
                    member.email &&
                    !isAssociationCreatorMember ? (
                      <Pressable
                        onPress={() => handleSendInvitation(member)}
                        disabled={isSending}
                        style={[
                          styles.inviteButton,
                          { backgroundColor: colors.accent },
                        ]}
                      >
                        {isSending ? (
                          <ActivityIndicator
                            color={colors.white}
                            size="small"
                          />
                        ) : (
                          <>
                            <Ionicons
                              name="mail-outline"
                              size={rf(18)}
                              color={colors.white}
                            />
                            <Text
                              style={[
                                styles.inviteButtonText,
                                { color: colors.white },
                              ]}
                            >
                              Enviar invitación
                            </Text>
                          </>
                        )}
                      </Pressable>
                    ) : null}

                    {!isAssociationCreatorMember ? (
                      <Pressable
                        onPress={() => handleRemoveMember(member)}
                        style={[
                          styles.secondaryButton,
                          {
                            borderColor: colors.border,
                            backgroundColor: colors.cardMuted,
                          },
                        ]}
                      >
                        <Ionicons
                          name="trash-outline"
                          size={rf(18)}
                          color={colors.textSecondary}
                        />
                        <Text
                          style={[
                            styles.secondaryButtonText,
                            { color: colors.textSecondary },
                          ]}
                        >
                          Dar de baja
                        </Text>
                      </Pressable>
                    ) : null}
                  </View>
                ) : (
                  <Pressable
                    onPress={() => handleCancelInvitation(invitation)}
                    style={[
                      styles.secondaryButton,
                      {
                        borderColor: colors.border,
                        backgroundColor: colors.cardMuted,
                      },
                    ]}
                  >
                    <Ionicons
                      name="close-circle-outline"
                      size={rf(18)}
                      color={colors.textSecondary}
                    />
                    <Text
                      style={[
                        styles.secondaryButtonText,
                        { color: colors.textSecondary },
                      ]}
                    >
                      Anular invitación
                    </Text>
                  </Pressable>
                )}
              </View>
            );
          })
        ) : (
          <View
            style={[
              styles.emptyBlock,
              {
                backgroundColor: colors.cardBackground,
                borderColor: colors.border,
              },
            ]}
          >
            <Ionicons
              name="mail-open-outline"
              size={rf(32)}
              color={colors.textTertiary}
            />
            <Text style={[styles.emptyTitle, { color: colors.text }]}>
              Sin miembros para gestionar
            </Text>
            <Text style={[styles.emptyMsg, { color: colors.textSecondary }]}>
              No hay miembros o invitaciones para el filtro seleccionado.
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  container: {
    padding: spacing.md,
    gap: spacing.md,
    paddingBottom: spacing.xxl * 2,
  },
  filterRow: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
  filterChip: {
    borderWidth: 1,
    borderRadius: borderRadius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  filterChipText: { fontSize: rf(12), fontWeight: "800" },
  createCard: {
    borderWidth: 1,
    borderRadius: borderRadius.xl,
    padding: spacing.md,
    gap: spacing.md,
  },
  createHeaderRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: spacing.md,
  },
  input: {
    borderWidth: 1,
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    fontSize: rf(14),
    minHeight: rf(44),
  },
  memberCard: {
    borderWidth: 1,
    borderRadius: borderRadius.xl,
    padding: spacing.md,
    gap: spacing.sm,
  },
  memberCardHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: spacing.md,
  },
  memberCardCopy: { flex: 1, gap: spacing.xs / 2 },
  memberEyebrow: {
    fontSize: rf(11),
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 0.7,
  },
  memberTitle: { fontSize: rf(16), fontWeight: "800" },
  stateBadge: {
    borderWidth: 1,
    borderRadius: borderRadius.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs / 2,
  },
  stateBadgeText: { fontSize: rf(10), fontWeight: "800" },
  memberMeta: { fontSize: rf(13), lineHeight: rf(18) },
  memberMetaStrong: { fontWeight: "800" },
  actionColumn: { gap: spacing.sm },
  inviteButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    borderRadius: borderRadius.xl,
    minHeight: rf(48),
    paddingHorizontal: spacing.lg,
  },
  inviteButtonText: { fontSize: rf(14), fontWeight: "800" },
  secondaryButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    borderWidth: 1,
    borderRadius: borderRadius.xl,
    minHeight: rf(46),
    paddingHorizontal: spacing.lg,
  },
  secondaryButtonText: { fontSize: rf(13), fontWeight: "800" },
  emptyBlock: {
    borderWidth: 1,
    borderRadius: borderRadius.xl,
    padding: spacing.xl,
    alignItems: "center",
    gap: spacing.md,
  },
  emptyTitle: { fontSize: rf(16), fontWeight: "800" },
  emptyMsg: { fontSize: rf(13), textAlign: "center", lineHeight: rf(19) },
});
