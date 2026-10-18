import { Ionicons } from "@expo/vector-icons";
import { useMemo, useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import WorkshopScreenHeader from "../components/common/WorkshopScreenHeader";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { useMemberInvitations } from "../hooks/useMemberInvitations";
import {
  buildInvitationRows,
  isAssociationCreatorMember,
} from "../utils/invitations";
import { borderRadius, rf, spacing } from "../utils/responsive";
import AdminInviteCard from "./invitations/AdminInviteCard";
import InvitationRow from "./invitations/InvitationRow";
import RoleFilterChips from "./invitations/RoleFilterChips";

export default function MemberInvitationsScreen({
  onBack,
  initialRole = "TODOS",
  initialMemberId = null,
}) {
  const { colors } = useTheme();
  const { token, activeAssociation } = useAuth();
  const [roleFilter, setRoleFilter] = useState(initialRole);
  const [adminEmail, setAdminEmail] = useState("");
  const {
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
  } = useMemberInvitations({ token, association: activeAssociation });

  const rows = useMemo(
    () =>
      buildInvitationRows(members, invitations, {
        roleFilter,
        memberId: initialMemberId,
      }),
    [initialMemberId, invitations, members, roleFilter],
  );

  const handleCreateAdminInvitation = async () => {
    if (await createAdminInvitation(adminEmail)) setAdminEmail("");
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={styles.container}
          keyboardShouldPersistTaps="handled"
        >
          <WorkshopScreenHeader
            onBack={onBack}
            section="Invitaciones"
            title="Invitaciones oficiales"
            subtitle="Envía la activación oficial a administradores, propietarios y fiscales de la asociación activa."
          />

          <RoleFilterChips value={roleFilter} onChange={setRoleFilter} />

          {roleFilter === "ADMIN" && (
            <AdminInviteCard
              email={adminEmail}
              onChangeEmail={setAdminEmail}
              sending={creatingAdminInvite}
              onSend={handleCreateAdminInvitation}
              onRefresh={reload}
            />
          )}

          {loading ? (
            <ActivityIndicator
              color={colors.primary}
              style={{ marginTop: spacing.lg }}
            />
          ) : rows.length ? (
            rows.map((row) => {
              const isMember = row.kind === "member";
              return (
                <InvitationRow
                  key={row.key}
                  row={row}
                  isCreator={
                    isMember &&
                    isAssociationCreatorMember(row.member, activeAssociation)
                  }
                  isSending={
                    isMember &&
                    String(sendingId) ===
                      String(row.member.membresia_id || row.member.id)
                  }
                  onInvite={() => inviteMember(row.member)}
                  onRemove={() => removeMember(row.member)}
                  onCancel={() => cancelInvitation(row.invitation)}
                />
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
      </KeyboardAvoidingView>
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
