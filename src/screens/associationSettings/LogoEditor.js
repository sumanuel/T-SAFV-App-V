import { Image, Pressable, StyleSheet, Text, View } from "react-native";
import { useTheme } from "../../context/ThemeContext";
import { borderRadius, rf, spacing } from "../../utils/responsive";

export default function LogoEditor({ logoPreview, onPick, onClear }) {
  const { colors } = useTheme();

  return (
    <View style={styles.formGroup}>
      <Text style={[styles.fieldLabel, { color: colors.text }]}>
        Logo de la asociación
      </Text>
      <View style={styles.logoActionsRow}>
        <Pressable
          onPress={onPick}
          style={[
            styles.secondaryFilledAction,
            styles.logoActionButton,
            {
              backgroundColor: colors.cardMuted,
              borderColor: colors.border,
            },
          ]}
        >
          <Text
            style={[styles.secondaryFilledActionText, { color: colors.text }]}
          >
            Seleccionar logo
          </Text>
        </Pressable>
        <Pressable
          disabled={!logoPreview}
          onPress={onClear}
          style={[
            styles.secondaryAction,
            styles.logoActionButton,
            {
              borderColor: colors.borderStrong,
              backgroundColor: colors.cardBackground,
            },
            !logoPreview ? styles.disabledAction : null,
          ]}
        >
          <Text style={[styles.secondaryActionText, { color: colors.text }]}>
            Quitar logo
          </Text>
        </Pressable>
      </View>

      {logoPreview ? (
        <View
          style={[
            styles.logoPreviewCard,
            {
              backgroundColor: colors.cardMuted,
              borderColor: colors.border,
            },
          ]}
        >
          <Image
            source={{ uri: logoPreview }}
            style={styles.logoPreviewImage}
          />
          <Text
            style={[styles.logoPreviewText, { color: colors.textSecondary }]}
          >
            Vista previa del logo de la asociación.
          </Text>
        </View>
      ) : (
        <View
          style={[
            styles.logoPlaceholderCard,
            {
              backgroundColor: colors.cardMuted,
              borderColor: colors.border,
            },
          ]}
        >
          <View
            style={[
              styles.logoPlaceholderBadge,
              {
                backgroundColor: colors.cardBackground,
                borderColor: colors.border,
              },
            ]}
          >
            <Text
              style={[
                styles.logoPlaceholderInitials,
                { color: colors.textSecondary },
              ]}
            >
              LOGO
            </Text>
          </View>
          <Text style={[styles.logoPreviewText, { color: colors.text }]}>
            Aún no hay logo cargado
          </Text>
          <Text style={[styles.rowMeta, { color: colors.textSecondary }]}>
            Selecciona una imagen o usa una URL para mostrar el logo de la
            asociación.
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  formGroup: { gap: spacing.xs },
  fieldLabel: {
    fontSize: rf(12),
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.6,
  },
  logoActionsRow: { flexDirection: "row", gap: spacing.sm },
  logoActionButton: { flex: 1 },
  logoPreviewCard: {
    borderWidth: 1,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    gap: spacing.sm,
    alignItems: "center",
  },
  logoPreviewImage: {
    width: rf(120),
    height: rf(120),
    borderRadius: borderRadius.lg,
  },
  logoPreviewText: {
    fontSize: rf(12),
    lineHeight: rf(18),
    textAlign: "center",
  },
  logoPlaceholderCard: {
    borderWidth: 1,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    gap: spacing.sm,
    alignItems: "center",
  },
  logoPlaceholderBadge: {
    width: rf(64),
    height: rf(64),
    borderWidth: 1,
    borderRadius: borderRadius.lg,
    alignItems: "center",
    justifyContent: "center",
  },
  logoPlaceholderInitials: { fontSize: rf(11), fontWeight: "800" },
  rowMeta: { fontSize: rf(12), lineHeight: rf(18), textAlign: "center" },
  secondaryFilledAction: {
    minHeight: rf(44),
    borderWidth: 1,
    borderRadius: borderRadius.lg,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing.md,
  },
  secondaryFilledActionText: { fontSize: rf(13), fontWeight: "700" },
  secondaryAction: {
    minHeight: rf(44),
    borderWidth: 1,
    borderRadius: borderRadius.lg,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing.md,
  },
  secondaryActionText: { fontSize: rf(13), fontWeight: "700" },
  disabledAction: { opacity: 0.45 },
});
