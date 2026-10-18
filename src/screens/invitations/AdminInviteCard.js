import { Ionicons } from "@expo/vector-icons";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useTheme } from "../../context/ThemeContext";
import { borderRadius, rf, spacing } from "../../utils/responsive";

// Formulario para invitar a un nuevo administrador.
export default function AdminInviteCard({
  email,
  onChangeEmail,
  sending,
  onSend,
  onRefresh,
}) {
  const { colors } = useTheme();

  return (
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
          <Text style={[styles.memberMeta, { color: colors.textSecondary }]}>
            Esta invitación será para un perfil de Administrador dentro de la
            asociación activa.
          </Text>
        </View>
        <Pressable
          onPress={onRefresh}
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

      <Text style={[styles.memberEyebrow, { color: colors.textSecondary }]}>
        Correo
      </Text>
      <TextInput
        value={email}
        onChangeText={onChangeEmail}
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

      <Text style={[styles.memberEyebrow, { color: colors.textSecondary }]}>
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
        onPress={onSend}
        disabled={sending}
        style={[styles.inviteButton, { backgroundColor: colors.primary }]}
      >
        {sending ? (
          <ActivityIndicator color={colors.white} size="small" />
        ) : (
          <>
            <Ionicons name="mail-outline" size={rf(18)} color={colors.white} />
            <Text style={[styles.inviteButtonText, { color: colors.white }]}>
              Enviar invitación
            </Text>
          </>
        )}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
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
});
