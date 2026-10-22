import { Ionicons } from "@expo/vector-icons";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useTheme } from "../../context/ThemeContext";
import {
  getTipoIcon,
  getTipoLabel,
  getUnitLabel,
} from "../../utils/incidencias";
import { borderRadius, rf, spacing } from "../../utils/responsive";
import { formatDateTime } from "../../utils/traza";
import EstadoBadge from "./EstadoBadge";

export default function IncidenciaCard({ item, onPress }) {
  const { colors } = useTheme();
  const photoCount = item.adjuntos?.length || 0;

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      style={[
        styles.card,
        { backgroundColor: colors.cardBackground, borderColor: colors.border },
      ]}
    >
      <View style={styles.top}>
        <View style={styles.typeRow}>
          <Ionicons
            name={getTipoIcon(item.tipo)}
            size={rf(18)}
            color={colors.primary}
          />
          <Text style={[styles.type, { color: colors.text }]}>
            {getTipoLabel(item.tipo)}
          </Text>
        </View>
        <EstadoBadge estado={item.estado} />
      </View>

      <Text
        numberOfLines={2}
        style={[styles.description, { color: colors.text }]}
      >
        {item.descripcion}
      </Text>

      <View style={styles.meta}>
        <Text style={[styles.metaText, { color: colors.textSecondary }]}>
          {getUnitLabel(item)}
          {item.lugar ? ` · ${item.lugar}` : ""}
        </Text>
        <View style={styles.metaRow}>
          {photoCount ? (
            <View style={styles.photoPill}>
              <Ionicons
                name="image-outline"
                size={rf(13)}
                color={colors.textTertiary}
              />
              <Text style={[styles.metaText, { color: colors.textTertiary }]}>
                {photoCount}
              </Text>
            </View>
          ) : null}
          <Text style={[styles.metaText, { color: colors.textTertiary }]}>
            {formatDateTime(item.fecha_hora_evento)}
          </Text>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderRadius: borderRadius.xl,
    padding: spacing.md,
    gap: spacing.sm,
  },
  top: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.sm,
  },
  typeRow: { flexDirection: "row", alignItems: "center", gap: spacing.xs },
  type: { fontSize: rf(14), fontWeight: "800" },
  description: { fontSize: rf(13), lineHeight: rf(19) },
  meta: { gap: spacing.xs / 2 },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    gap: spacing.sm,
  },
  photoPill: { flexDirection: "row", alignItems: "center", gap: 2 },
  metaText: { fontSize: rf(12) },
});
