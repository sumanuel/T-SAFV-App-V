import { SafeAreaView } from "react-native-safe-area-context";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import WorkshopScreenHeader from "../components/common/WorkshopScreenHeader";
import { useTheme } from "../context/ThemeContext";
import { borderRadius, rf, spacing } from "../utils/responsive";

export default function TeamAccessScreen({ onBack }) {
  const { colors } = useTheme();

  return (
    <SafeAreaView
      style={[styles.safeArea, { backgroundColor: colors.background }]}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <WorkshopScreenHeader
          onBack={onBack}
          section="Administración"
          title="Miembros e invitaciones"
          subtitle="Esta pantalla fue reemplazada por el centro de invitaciones oficiales y la gestión específica de la asociación."
        />

        <View
          style={[
            styles.noticeCard,
            {
              backgroundColor: colors.cardBackground,
              borderColor: colors.border,
            },
          ]}
        >
          <Text style={[styles.noticeTitle, { color: colors.text }]}>
            Pantalla simplificada
          </Text>
          <Text style={[styles.noticeText, { color: colors.textSecondary }]}>
            Usa “Invitaciones oficiales” para gestionar administradores,
            propietarios y fiscales, y “Datos de la asociación” para editar la
            identidad de la asociación activa.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  scrollContent: {
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
    gap: spacing.xl,
  },
  noticeCard: {
    borderWidth: 1,
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    gap: spacing.sm,
  },
  noticeTitle: { fontSize: rf(17), fontWeight: "800" },
  noticeText: { fontSize: rf(13), lineHeight: rf(19) },
});
