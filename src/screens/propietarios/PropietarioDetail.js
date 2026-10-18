import { Ionicons } from "@expo/vector-icons";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useTheme } from "../../context/ThemeContext";
import { describeUnit, getFullName, getUserId } from "../../utils/propietarios";
import { borderRadius, rf, spacing } from "../../utils/responsive";

// Ficha de un propietario: resumen, acciones (solo administracion) y unidades.
export default function PropietarioDetail({
  propietario,
  vehicles,
  vehicleLoading,
  canManage,
  onAddUnit,
  onOpenUnit,
  onDelete,
  onInvite,
}) {
  const { colors } = useTheme();

  return (
    <>
      <View
        style={[
          styles.detailCard,
          {
            backgroundColor: colors.cardBackground,
            borderColor: colors.border,
          },
        ]}
      >
        <View style={styles.detailCardHeader}>
          <View style={styles.detailCardHeaderCopy}>
            <Text style={[styles.detailEyebrow, { color: colors.primary }]}>
              Fiscalización
            </Text>
            <Text style={[styles.detailTitle, { color: colors.text }]}>
              Resumen del propietario
            </Text>
          </View>
          <Text style={[styles.detailCode, { color: colors.primary }]}>
            PRO-{String(getUserId(propietario)).padStart(6, "0")}
          </Text>
        </View>

        <View style={styles.detailFieldsWrap}>
          <Text style={[styles.fieldValue, { color: colors.text }]}>
            <Text style={styles.fieldValueStrong}>Nombre:</Text>{" "}
            {getFullName(propietario) || "Sin nombre"}
          </Text>
          <Text style={[styles.fieldValue, { color: colors.text }]}>
            <Text style={styles.fieldValueStrong}>Identificación:</Text>{" "}
            {propietario.rif_cedula || "Sin identificación"}
          </Text>
          <Text style={[styles.fieldValue, { color: colors.text }]}>
            <Text style={styles.fieldValueStrong}>Teléfono:</Text>{" "}
            {propietario.telefono || "Sin teléfono"}
          </Text>
          <Text style={[styles.fieldValue, { color: colors.text }]}>
            <Text style={styles.fieldValueStrong}>Correo:</Text>{" "}
            {propietario.email || "Sin correo"}
          </Text>
          <Text style={[styles.fieldValue, { color: colors.text }]}>
            <Text style={styles.fieldValueStrong}>Dirección:</Text>{" "}
            {propietario.direccion || "Sin dirección"}
          </Text>
          <Text style={[styles.fieldValue, { color: colors.text }]}>
            <Text style={styles.fieldValueStrong}>Invitación:</Text>{" "}
            {propietario.estado_invitacion || "PENDIENTE_INVITACION"}
          </Text>
        </View>

        <View style={styles.detailActionsRow}>
          {canManage ? (
            <Pressable
              onPress={onAddUnit}
              style={[styles.linkAction, { borderColor: colors.accent }]}
            >
              <Text style={[styles.linkActionText, { color: colors.accent }]}>
                Asociar unidad
              </Text>
            </Pressable>
          ) : null}
          {canManage ? (
            <Pressable
              onPress={onDelete}
              style={[styles.linkAction, { borderColor: colors.danger }]}
            >
              <Text style={[styles.linkActionText, { color: colors.danger }]}>
                Eliminar propietario
              </Text>
            </Pressable>
          ) : null}
          {canManage && propietario.email ? (
            <Pressable
              onPress={onInvite}
              style={[styles.linkAction, { borderColor: colors.primary }]}
            >
              <Text style={[styles.linkActionText, { color: colors.primary }]}>
                Invitar
              </Text>
            </Pressable>
          ) : null}
        </View>
      </View>

      <View style={styles.sectionRow}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          Unidades asociadas
        </Text>
        {canManage ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Agregar unidad"
            onPress={onAddUnit}
            style={[styles.addBtn, { backgroundColor: colors.primary }]}
          >
            <Ionicons name="add" size={rf(16)} color={colors.white} />
            <Text style={[styles.addBtnText, { color: colors.white }]}>
              Asociar unidad
            </Text>
          </Pressable>
        ) : null}
      </View>

      {vehicleLoading ? (
        <ActivityIndicator
          color={colors.primary}
          style={{ marginTop: spacing.md }}
        />
      ) : vehicles.length ? (
        vehicles.map((vehicle) => (
          <Pressable
            key={vehicle.id}
            onPress={() => onOpenUnit(vehicle)}
            style={[
              styles.vehicleCard,
              {
                backgroundColor: colors.cardBackground,
                borderColor: colors.border,
              },
            ]}
          >
            <View style={styles.vehicleCardHeader}>
              <Text style={[styles.vehicleEyebrow, { color: colors.accent }]}>
                Unidad
              </Text>
              <Ionicons
                name="create-outline"
                size={rf(18)}
                color={colors.text}
              />
            </View>
            <Text style={[styles.vehicleTitle, { color: colors.text }]}>
              {describeUnit(vehicle)}
            </Text>
            <View
              style={[
                styles.vehicleDivider,
                { backgroundColor: colors.border },
              ]}
            />
            <Text style={[styles.vehicleAccent, { color: colors.accent }]}>
              Placa: {vehicle.placa || "Sin placa"}
            </Text>
            <Text style={[styles.vehicleUnitNumber, { color: colors.text }]}>
              Unidad N° {vehicle.numero_unidad || "Sin número"}
            </Text>
            <Text style={[styles.vehicleMeta, { color: colors.textSecondary }]}>
              Kilometraje: {vehicle.kilometraje || "Sin kilometraje"}
            </Text>
          </Pressable>
        ))
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
          <Text style={[styles.emptyMsg, { color: colors.textSecondary }]}>
            Sin unidades registradas para este propietario.
          </Text>
        </View>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  emptyBlock: {
    borderWidth: 1,
    borderRadius: borderRadius.xl,
    padding: spacing.xl,
    alignItems: "center",
    gap: spacing.md,
  },
  emptyMsg: { fontSize: rf(13), textAlign: "center", lineHeight: rf(19) },
  detailCard: {
    borderWidth: 1,
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    gap: spacing.sm,
  },
  detailCardHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: spacing.md,
    paddingBottom: spacing.sm,
  },
  detailCardHeaderCopy: { flex: 1, gap: spacing.xs / 2 },
  detailEyebrow: {
    fontSize: rf(11),
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 0.7,
  },
  detailTitle: { fontSize: rf(18), fontWeight: "800" },
  detailCode: { fontSize: rf(14), fontWeight: "800" },
  detailFieldsWrap: { gap: spacing.xs },
  fieldValue: { fontSize: rf(14), lineHeight: rf(20) },
  fieldValueStrong: { fontWeight: "800" },
  detailActionsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  linkAction: {
    borderWidth: 1,
    borderRadius: borderRadius.pill,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  linkActionText: { fontSize: rf(14), fontWeight: "800" },
  sectionRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.md,
    paddingHorizontal: spacing.xs,
  },
  sectionTitle: { fontSize: rf(15), fontWeight: "800" },
  addBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    borderRadius: borderRadius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  addBtnText: { fontSize: rf(12), fontWeight: "700" },
  vehicleCard: {
    borderWidth: 1,
    borderRadius: borderRadius.xl,
    padding: spacing.md,
    gap: spacing.sm,
  },
  vehicleCardHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.sm,
  },
  vehicleEyebrow: {
    fontSize: rf(11),
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 0.7,
  },
  vehicleTitle: { fontSize: rf(16), fontWeight: "800" },
  vehicleDivider: { height: 1 },
  vehicleAccent: { fontSize: rf(16), fontWeight: "900" },
  vehicleUnitNumber: { fontSize: rf(13), fontWeight: "800" },
  vehicleMeta: { fontSize: rf(12), lineHeight: rf(18) },
});
