import { Ionicons } from "@expo/vector-icons";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useTheme } from "../../context/ThemeContext";
import { borderRadius, rf, spacing } from "../../utils/responsive";
import { describeUnit, getFullName } from "../../utils/propietarios";

// Tarjeta de un propietario en el listado, con sus unidades.
export default function PropietarioListItem({
  propietario,
  canEdit,
  canDelete,
  onOpen,
  onEdit,
  onDelete,
  onOpenVehicle,
}) {
  const { colors } = useTheme();
  const linkedUnits = propietario.linked_units || [];

  return (
    <Pressable
      onPress={onOpen}
      style={[
        styles.ownerCard,
        {
          backgroundColor: colors.cardBackground,
          borderColor: colors.border,
        },
      ]}
    >
      <View style={styles.ownerCardHeader}>
        <View style={styles.itemInfo}>
          <Text style={[styles.ownerEyebrow, { color: colors.primary }]}>
            Recepción
          </Text>
          <Text style={[styles.itemName, { color: colors.text }]}>
            {getFullName(propietario) || "Sin nombre"}
          </Text>
        </View>
        {canEdit ? (
          <View style={styles.ownerActions}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Editar propietario"
              onPress={onEdit}
              style={[
                styles.iconAction,
                {
                  backgroundColor: colors.cardMuted,
                  borderColor: colors.border,
                },
              ]}
            >
              <Ionicons
                name="create-outline"
                size={rf(18)}
                color={colors.text}
              />
            </Pressable>
            {canDelete ? (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Eliminar propietario"
                onPress={onDelete}
                style={[
                  styles.iconAction,
                  {
                    backgroundColor: colors.cardMuted,
                    borderColor: colors.border,
                  },
                ]}
              >
                <Ionicons
                  name="trash-outline"
                  size={rf(18)}
                  color={colors.danger}
                />
              </Pressable>
            ) : null}
          </View>
        ) : null}
      </View>

      <View style={[styles.ownerDivider, { backgroundColor: colors.border }]} />
      <Text style={[styles.itemMeta, { color: colors.text }]}>
        <Text style={styles.fieldValueStrong}>Identificación:</Text>{" "}
        {propietario.rif_cedula || "Sin identificación"}
      </Text>
      <Text style={[styles.itemMeta, { color: colors.text }]}>
        <Text style={styles.fieldValueStrong}>Teléfono:</Text>{" "}
        {propietario.telefono || "Sin teléfono"}
      </Text>
      <Text style={[styles.ownerUnitsTitle, { color: colors.accent }]}>
        Unidades asociadas:
      </Text>
      <Text style={[styles.ownerUnitsHint, { color: colors.textSecondary }]}>
        Presione sobre una unidad para ver detalles.
      </Text>

      {linkedUnits.length ? (
        linkedUnits.map((vehicle) => (
          <Pressable
            key={vehicle.id || vehicle.numero_unidad}
            onPress={() => onOpenVehicle(vehicle)}
            style={[
              styles.ownerVehicleCard,
              {
                backgroundColor: colors.cardMuted,
                borderColor: colors.border,
              },
            ]}
          >
            <Text style={[styles.ownerVehicleTitle, { color: colors.text }]}>
              {describeUnit(vehicle)}
            </Text>
            <View
              style={[
                styles.ownerVehicleDivider,
                { backgroundColor: colors.border },
              ]}
            />
            <Text style={[styles.ownerVehicleUnit, { color: colors.text }]}>
              Unidad N° {vehicle.numero_unidad || "Sin número"}
            </Text>
            <Text style={[styles.ownerVehicleAccent, { color: colors.accent }]}>
              Placa: {vehicle.placa || "Sin placa"}
            </Text>

            <Text
              style={[styles.ownerVehicleMeta, { color: colors.textSecondary }]}
            >
              Kilometraje: {vehicle.kilometraje || "Sin kilometraje"}
            </Text>
          </Pressable>
        ))
      ) : (
        <Text style={[styles.ownerUnitsHint, { color: colors.textSecondary }]}>
          Sin unidades asociadas.
        </Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  itemInfo: { flex: 1, gap: spacing.xs / 2 },
  itemName: { fontSize: rf(15), fontWeight: "700" },
  itemMeta: { fontSize: rf(13), lineHeight: rf(20) },
  fieldValueStrong: { fontWeight: "800" },
  ownerCard: {
    borderWidth: 1,
    borderRadius: borderRadius.xl,
    padding: spacing.md,
    gap: spacing.sm,
  },
  ownerCardHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: spacing.md,
  },
  ownerEyebrow: {
    fontSize: rf(11),
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 0.7,
  },
  ownerActions: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  iconAction: {
    width: rf(42),
    height: rf(42),
    borderWidth: 1,
    borderRadius: borderRadius.lg,
    alignItems: "center",
    justifyContent: "center",
  },
  ownerDivider: { height: 1 },
  ownerUnitsTitle: { fontSize: rf(14), fontWeight: "800" },
  ownerUnitsHint: { fontSize: rf(12), lineHeight: rf(18) },
  ownerVehicleCard: {
    borderWidth: 1,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    gap: spacing.xs,
  },
  ownerVehicleTitle: { fontSize: rf(14), fontWeight: "800" },
  ownerVehicleDivider: { height: 1 },
  ownerVehicleAccent: { fontSize: rf(13), fontWeight: "900" },
  ownerVehicleUnit: { fontSize: rf(15), fontWeight: "800" },
  ownerVehicleMeta: { fontSize: rf(12), lineHeight: rf(18) },
});
