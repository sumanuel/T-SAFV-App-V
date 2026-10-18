import { Ionicons } from "@expo/vector-icons";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useTheme } from "../../context/ThemeContext";
import { getInvitationMeta, getMemberRoleLabel } from "../../utils/invitations";
import { borderRadius, rf, spacing } from "../../utils/responsive";

// Tarjeta de un miembro (con sus acciones) o de una invitacion pendiente.
export default function InvitationRow({
  row,
  isCreator,
  isSending,
  onInvite,
  onRemove,
  onCancel,
}) {
  const { colors } = useTheme();
  const state = getInvitationMeta(row.status, colors);
  const isMember = row.kind === "member";
  const member = row.member;

  const secondaryButton = (label, icon, onPress) => (
    <Pressable
      onPress={onPress}
      style={[
        styles.secondaryButton,
        {
          borderColor: colors.border,
          backgroundColor: colors.cardMuted,
        },
      ]}
    >
      <Ionicons name={icon} size={rf(18)} color={colors.textSecondary} />
      <Text
        style={[styles.secondaryButtonText, { color: colors.textSecondary }]}
      >
        {label}
      </Text>
    </Pressable>
  );

  return (
    <View
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
          <Text style={[styles.memberEyebrow, { color: colors.primary }]}>
            {getMemberRoleLabel(row.role)}
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
          <Text style={[styles.stateBadgeText, { color: state.color }]}>
            {state.label}
          </Text>
        </View>
      </View>

      <Text style={[styles.memberMeta, { color: colors.text }]}>
        <Text style={styles.memberMetaStrong}>Correo:</Text>{" "}
        {isMember
          ? member.email || "Sin correo"
          : row.invitation.email_invitado}
      </Text>

      {isMember ? (
        <>
          <Text style={[styles.memberMeta, { color: colors.text }]}>
            <Text style={styles.memberMetaStrong}>Teléfono:</Text>{" "}
            {member.telefono || "Sin teléfono"}
          </Text>
          {member.rol === "FISCAL" ? (
            <Text style={[styles.memberMeta, { color: colors.text }]}>
              <Text style={styles.memberMetaStrong}>Punto de control:</Text>{" "}
              {member.punto_control || "Sin punto de control"}
            </Text>
          ) : null}
        </>
      ) : null}

      {isMember ? (
        <View style={styles.actionColumn}>
          {member.estado_invitacion !== "ACEPTADA" &&
          member.email &&
          !isCreator ? (
            <Pressable
              onPress={onInvite}
              disabled={isSending}
              style={[styles.inviteButton, { backgroundColor: colors.accent }]}
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
                    style={[styles.inviteButtonText, { color: colors.white }]}
                  >
                    Enviar invitación
                  </Text>
                </>
              )}
            </Pressable>
          ) : null}

          {!isCreator
            ? secondaryButton("Dar de baja", "trash-outline", onRemove)
            : null}
        </View>
      ) : (
        secondaryButton("Anular invitación", "close-circle-outline", onCancel)
      )}
    </View>
  );
}

const styles = StyleSheet.create({
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
});
