import { Ionicons } from "@expo/vector-icons";
import { Pressable, StyleSheet, Switch, Text, View } from "react-native";
import { useTheme } from "../../context/ThemeContext";
import { borderRadius, rf, spacing } from "../../utils/responsive";

// Preferencias de este dispositivo: onboarding, tema, huella y cerrar sesion.
export default function AppSettingsList({
  themeLabel,
  biometric,
  onOpenOnboarding,
  onToggleTheme,
  onSignOut,
}) {
  const { colors } = useTheme();
  const rowStyle = [
    styles.actionRow,
    {
      borderBottomColor: colors.border,
      backgroundColor: colors.cardMuted,
    },
  ];

  return (
    <View style={styles.actionList}>
      <Pressable onPress={onOpenOnboarding} style={rowStyle}>
        <View style={styles.actionCopy}>
          <Text style={[styles.actionLabel, { color: colors.text }]}>
            Ver onboarding
          </Text>
          <Text style={[styles.actionMeta, { color: colors.textSecondary }]}>
            Recorre otra vez la introduccion operativa de la app.
          </Text>
        </View>
        <Ionicons
          color={colors.textTertiary}
          name="play-circle-outline"
          size={rf(18)}
        />
      </Pressable>

      <Pressable onPress={onToggleTheme} style={rowStyle}>
        <View style={styles.actionCopy}>
          <Text style={[styles.actionLabel, { color: colors.text }]}>
            Apariencia
          </Text>
          <Text style={[styles.actionMeta, { color: colors.textSecondary }]}>
            {themeLabel}
          </Text>
        </View>
        <Ionicons
          color={colors.textTertiary}
          name="contrast-outline"
          size={rf(18)}
        />
      </Pressable>

      {biometric.available ? (
        <View style={rowStyle}>
          <View style={styles.actionCopy}>
            <Text style={[styles.actionLabel, { color: colors.text }]}>
              Desbloquear con huella
            </Text>
            <Text style={[styles.actionMeta, { color: colors.textSecondary }]}>
              Pide huella o Face ID cada vez que abres la app.
            </Text>
          </View>
          <Switch
            disabled={biometric.busy}
            onValueChange={biometric.toggle}
            value={biometric.enabled}
            trackColor={{ true: colors.primary }}
          />
        </View>
      ) : null}

      <Pressable
        onPress={onSignOut}
        style={[styles.actionRow, { backgroundColor: colors.cardMuted }]}
      >
        <View style={styles.actionCopy}>
          <Text style={[styles.actionLabel, { color: colors.danger }]}>
            Cerrar sesion
          </Text>
          <Text style={[styles.actionMeta, { color: colors.textSecondary }]}>
            Finaliza la sesion del usuario actual en este equipo.
          </Text>
        </View>
        <Ionicons color={colors.danger} name="log-out-outline" size={rf(18)} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  actionList: {
    gap: spacing.sm,
  },
  actionRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.lg,
    borderBottomWidth: 1,
    gap: spacing.md,
  },
  actionCopy: {
    flex: 1,
    gap: 2,
  },
  actionLabel: { fontSize: rf(14), fontWeight: "700" },
  actionMeta: {
    fontSize: rf(12),
    lineHeight: rf(17),
  },
});
