import { StyleSheet, Text, View } from "react-native";
import { useTheme } from "../../context/ThemeContext";
import { formatDateTime } from "../../utils/traza";
import { borderRadius, rf, spacing } from "../../utils/responsive";

export default function TrazaRow({ item }) {
  const { colors } = useTheme();
  const metaStyle = [styles.traceMetaText, { color: colors.textSecondary }];

  return (
    <View
      style={[
        styles.traceRow,
        {
          backgroundColor: colors.cardBackground,
          borderColor: colors.border,
        },
      ]}
    >
      <View style={styles.traceTop}>
        <View
          style={[
            styles.unitBadge,
            { backgroundColor: colors.backgroundAccent },
          ]}
        >
          <Text style={[styles.unitText, { color: colors.primary }]}>
            {item.numero_unidad || item.placa || "—"}
          </Text>
        </View>
        <Text style={[styles.traceDate, { color: colors.textTertiary }]}>
          {formatDateTime(item.fecha_hora_registro)}
        </Text>
      </View>

      <View style={styles.traceMeta}>
        {item.fiscal_nombre ? (
          <Text style={metaStyle}>
            <Text style={styles.strong}>Fiscal: </Text>
            {[item.fiscal_nombre, item.fiscal_apellido]
              .filter(Boolean)
              .join(" ") || item.fiscal_nombre}
          </Text>
        ) : null}
        {item.punto_control ? (
          <Text style={metaStyle}>
            <Text style={styles.strong}>Punto de control: </Text>
            {item.punto_control}
          </Text>
        ) : null}
        {item.chofer ? (
          <Text style={metaStyle}>
            <Text style={styles.strong}>Chofer: </Text>
            {item.chofer}
          </Text>
        ) : null}
        {item.origen || item.destino ? (
          <Text style={metaStyle}>
            {[item.origen, item.destino].filter(Boolean).join(" → ")}
          </Text>
        ) : null}
        {item.pasajeros !== undefined && item.pasajeros !== null ? (
          <Text style={metaStyle}>
            <Text style={styles.strong}>Pasajeros: </Text>
            {item.pasajeros}
          </Text>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  traceRow: {
    borderWidth: 1,
    borderRadius: borderRadius.xl,
    padding: spacing.md,
    gap: spacing.sm,
  },
  traceTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.sm,
  },
  unitBadge: {
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs / 2,
  },
  unitText: { fontSize: rf(14), fontWeight: "800" },
  traceDate: { fontSize: rf(11) },
  traceMeta: { gap: spacing.xs / 2 },
  traceMetaText: { fontSize: rf(12), lineHeight: rf(17) },
  strong: { fontWeight: "700" },
});
