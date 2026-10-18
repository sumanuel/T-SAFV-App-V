import { Ionicons } from "@expo/vector-icons";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useTheme } from "../../context/ThemeContext";
import { borderRadius, rf, spacing } from "../../utils/responsive";

// Usuario sin asociacion: puede crear una (si su acceso lo permite) o aceptar
// una invitacion pendiente.
export default function NoAssociationCard({
  accessMessage,
  canCreate,
  canStartTrial,
  pendingInvitation,
  onStartCreate,
  onAcceptInvitation,
}) {
  const { colors } = useTheme();

  return (
    <View
      style={[
        styles.noAssocBlock,
        {
          backgroundColor: colors.cardBackground,
          borderColor: colors.border,
        },
      ]}
    >
      <Ionicons
        name="business-outline"
        size={rf(40)}
        color={colors.textTertiary}
      />
      <Text style={[styles.noAssocTitle, { color: colors.text }]}>
        Sin asociacion registrada
      </Text>
      <Text style={[styles.noAssocMsg, { color: colors.textSecondary }]}>
        {accessMessage ||
          "Para comenzar necesitas crear una asociación. Solo se permite una por cuenta y el acceso depende de pago o período de prueba."}
      </Text>
      {canCreate ? (
        <Pressable
          onPress={onStartCreate}
          style={[styles.createAssocBtn, { backgroundColor: colors.primary }]}
        >
          <Ionicons
            name={canStartTrial ? "flask-outline" : "add-circle-outline"}
            size={rf(18)}
            color={colors.white}
          />
          <Text style={[styles.createAssocBtnText, { color: colors.white }]}>
            {canStartTrial
              ? "Crear asociación y activar prueba"
              : "Crear asociación"}
          </Text>
        </Pressable>
      ) : (
        <View
          style={[
            styles.blockedBadge,
            {
              backgroundColor: colors.cardMuted,
              borderColor: colors.border,
            },
          ]}
        >
          <Ionicons
            name="lock-closed-outline"
            size={rf(18)}
            color={colors.warning}
          />
          <Text
            style={[styles.blockedBadgeText, { color: colors.textSecondary }]}
          >
            Creación bloqueada hasta resolver el estado de invitación o
            licencia.
          </Text>
        </View>
      )}

      {pendingInvitation ? (
        <Pressable
          onPress={onAcceptInvitation}
          style={[
            styles.invitationCard,
            {
              backgroundColor: colors.cardMuted,
              borderColor: colors.border,
            },
          ]}
        >
          <Ionicons
            name="mail-open-outline"
            size={rf(18)}
            color={colors.primary}
          />
          <View style={styles.invitationCopy}>
            <Text style={[styles.invitationTitle, { color: colors.text }]}>
              Invitación pendiente
            </Text>
            <Text
              style={[styles.invitationText, { color: colors.textSecondary }]}
            >
              Acepta la invitación de{" "}
              {pendingInvitation.rol_invitado?.toLowerCase?.() || "miembro"}{" "}
              para entrar a la asociación asignada.
            </Text>
          </View>
          <Ionicons
            name="chevron-forward"
            size={rf(18)}
            color={colors.textTertiary}
          />
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  noAssocBlock: {
    borderWidth: 1,
    borderRadius: borderRadius.xl,
    padding: spacing.xxl,
    alignItems: "center",
    gap: spacing.lg,
  },
  noAssocTitle: { fontSize: rf(18), fontWeight: "800", textAlign: "center" },
  noAssocMsg: { fontSize: rf(14), textAlign: "center", lineHeight: rf(20) },
  createAssocBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    borderRadius: borderRadius.xl,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
  },
  createAssocBtnText: { fontSize: rf(15), fontWeight: "800" },
  blockedBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    borderWidth: 1,
    borderRadius: borderRadius.xl,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  blockedBadgeText: { flex: 1, fontSize: rf(13), lineHeight: rf(18) },
  invitationCard: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    borderWidth: 1,
    borderRadius: borderRadius.xl,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
  invitationCopy: { flex: 1, gap: spacing.xs / 2 },
  invitationTitle: { fontSize: rf(14), fontWeight: "800" },
  invitationText: { fontSize: rf(12), lineHeight: rf(17) },
});
