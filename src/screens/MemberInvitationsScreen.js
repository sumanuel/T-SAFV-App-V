import { Ionicons } from "@expo/vector-icons";
import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import WorkshopScreenHeader from "../components/common/WorkshopScreenHeader";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import sdk from "../services/api/sdk";
import { borderRadius, rf, spacing } from "../utils/responsive";

const ROLE_FILTERS = ["TODOS", "PROPIETARIO", "FISCAL"];

function getInvitationMeta(status, colors) {
  switch (status) {
    case "ACEPTADA":
      return { label: "Aceptada", color: colors.success };
    case "INVITACION_ENVIADA":
      return { label: "Enviada", color: colors.warning };
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
  const [loading, setLoading] = useState(false);
  const [sendingId, setSendingId] = useState(null);
  const [roleFilter, setRoleFilter] = useState(initialRole);

  const asociacionId = activeAssociation?.id;

  const loadMembers = async () => {
    if (!asociacionId) return;
    setLoading(true);
    try {
      const res = await sdk.getAssociationMembers(token, asociacionId);
      if (res.status === 200) {
        setMembers(
          (res.data || []).filter((member) =>
            ["PROPIETARIO", "FISCAL"].includes(member.rol),
          ),
        );
      } else {
        setMembers([]);
      }
    } catch {
      Alert.alert(
        "Invitaciones",
        "No se pudo cargar el estado de invitaciones de los miembros.",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMembers();
  }, [asociacionId]);

  const filteredMembers = useMemo(() => {
    return members.filter((member) => {
      if (roleFilter !== "TODOS" && member.rol !== roleFilter) return false;
      if (
        initialMemberId &&
        String(member.id) !== String(initialMemberId) &&
        String(member.membresia_id) !== String(initialMemberId)
      ) {
        return false;
      }
      return true;
    });
  }, [initialMemberId, members, roleFilter]);

  const handleSendInvitation = async (member) => {
    if (!member.email) {
      Alert.alert(
        "Correo requerido",
        "Este miembro no tiene correo electrónico registrado.",
      );
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
        await loadMembers();
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

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.container}>
        <WorkshopScreenHeader
          onBack={onBack}
          section="Invitaciones"
          title="Invitaciones oficiales"
          subtitle="Envía la activación oficial a propietarios y fiscales creados en la asociación activa."
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
                      : "Fiscales"}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {loading ? (
          <ActivityIndicator
            color={colors.primary}
            style={{ marginTop: spacing.lg }}
          />
        ) : filteredMembers.length ? (
          filteredMembers.map((member) => {
            const state = getInvitationMeta(member.estado_invitacion, colors);
            const fullName = [member.nombre, member.apellido]
              .filter(Boolean)
              .join(" ");
            const isSending =
              String(sendingId) === String(member.membresia_id || member.id);
            return (
              <View
                key={member.membresia_id || member.id}
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
                      {member.rol === "PROPIETARIO" ? "Propietario" : "Fiscal"}
                    </Text>
                    <Text style={[styles.memberTitle, { color: colors.text }]}>
                      {fullName || "Sin nombre"}
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
                  {member.email || "Sin correo"}
                </Text>
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

                <Pressable
                  onPress={() => handleSendInvitation(member)}
                  disabled={isSending || !member.email}
                  style={[
                    styles.inviteButton,
                    {
                      backgroundColor: !member.email
                        ? colors.border
                        : colors.accent,
                    },
                  ]}
                >
                  {isSending ? (
                    <ActivityIndicator color={colors.white} size="small" />
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
                        Reenviar invitación oficial
                      </Text>
                    </>
                  )}
                </Pressable>
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
              Sin miembros para invitar
            </Text>
            <Text style={[styles.emptyMsg, { color: colors.textSecondary }]}>
              Crea propietarios o fiscales con correo electrónico para poder
              enviar la invitación oficial.
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
