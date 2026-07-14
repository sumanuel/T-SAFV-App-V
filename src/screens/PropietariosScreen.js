import { Ionicons } from "@expo/vector-icons";
import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  BackHandler,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import WorkshopScreenHeader from "../components/common/WorkshopScreenHeader";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import {
  deletePropietario,
  listPropietarios,
} from "../services/propietarios/propietarioService";
import { listVehicles } from "../services/vehicles/vehicleService";
import { borderRadius, rf, spacing } from "../utils/responsive";

const SCREEN_MODES = { LIST: "list", DETAIL: "detail" };

function getMembershipId(entity) {
  return entity?.membresia_id || "";
}

function getUserId(entity) {
  return entity?.id || "";
}

function mergeLinkedUnits(propietario, allVehicles) {
  const linkedUnits = Array.isArray(propietario?.linked_units)
    ? propietario.linked_units
    : [];
  const ownerVehicles = (allVehicles || []).filter(
    (vehicle) =>
      String(vehicle.propietario_id) === String(getUserId(propietario)),
  );
  const map = new Map();

  linkedUnits.forEach((vehicle) => {
    const key = String(vehicle.id || vehicle.numero_unidad || vehicle.placa);
    map.set(key, vehicle);
  });

  ownerVehicles.forEach((vehicle) => {
    const key = String(vehicle.id || vehicle.numero_unidad || vehicle.placa);
    map.set(key, { ...map.get(key), ...vehicle });
  });

  return Array.from(map.values()).sort((left, right) =>
    String(left.numero_unidad || left.id).localeCompare(
      String(right.numero_unidad || right.id),
      "es",
      { numeric: true },
    ),
  );
}

export default function PropietariosScreen({
  onBack,
  onOpenInvitationCenter,
  onOpenPropietarioForm,
  onOpenVehicleForm,
  viewState,
}) {
  const { colors } = useTheme();
  const { token, activeAssociation } = useAuth();
  const [screenMode, setScreenMode] = useState(SCREEN_MODES.LIST);
  const [propietarios, setPropietarios] = useState([]);
  const [allVehicles, setAllVehicles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedPropietario, setSelectedPropietario] = useState(null);
  const [vehicles, setVehicles] = useState([]);
  const [vehicleLoading, setVehicleLoading] = useState(false);

  const asociacionId = activeAssociation?.id;
  const selectedMembershipId = getMembershipId(selectedPropietario);
  const selectedUserId = getUserId(selectedPropietario);

  const filtered = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return propietarios.filter((propietario) => {
      if (!q) return true;
      const text = [
        propietario.rif_cedula,
        propietario.nombre,
        propietario.apellido,
        propietario.email,
        propietario.telefono,
        ...(propietario.linked_units || []).flatMap((vehicle) => [
          vehicle.placa,
          vehicle.numero_unidad,
        ]),
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return text.includes(q);
    });
  }, [propietarios, searchQuery]);

  const refreshPropietarios = async () => {
    if (!asociacionId) return;
    setLoading(true);
    try {
      const [owners, vehiclesData] = await Promise.all([
        listPropietarios(token, asociacionId),
        listVehicles(token, asociacionId),
      ]);
      const nextOwners = owners.map((propietario) => ({
        ...propietario,
        linked_units: mergeLinkedUnits(propietario, vehiclesData),
      }));

      setAllVehicles(vehiclesData);
      setPropietarios(nextOwners);

      if (selectedMembershipId) {
        const refreshed = nextOwners.find(
          (propietario) =>
            getMembershipId(propietario) === selectedMembershipId,
        );
        if (!refreshed) {
          setSelectedPropietario(null);
          setScreenMode(SCREEN_MODES.LIST);
        } else {
          setSelectedPropietario(refreshed);
        }
      }
    } catch {
      Alert.alert("Propietarios", "No se pudo cargar el listado.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshPropietarios();
  }, [asociacionId]);

  useEffect(() => {
    if (!viewState?.selectedClientId) {
      setSelectedPropietario(null);
      setScreenMode(SCREEN_MODES.LIST);
      return;
    }

    const match = propietarios.find(
      (propietario) =>
        String(getUserId(propietario)) === String(viewState.selectedClientId) ||
        String(getMembershipId(propietario)) ===
          String(viewState.selectedClientId),
    );
    if (!match) return;
    setSelectedPropietario(match);
    setScreenMode(viewState.screenMode || SCREEN_MODES.DETAIL);
  }, [propietarios, viewState?.screenMode, viewState?.selectedClientId]);

  useEffect(() => {
    if (!selectedUserId || !asociacionId) {
      setVehicles([]);
      return;
    }

    setVehicleLoading(true);
    setVehicles(mergeLinkedUnits(selectedPropietario, allVehicles));
    setVehicleLoading(false);
  }, [allVehicles, asociacionId, selectedPropietario, selectedUserId]);

  useEffect(() => {
    if (screenMode !== SCREEN_MODES.DETAIL) return undefined;
    const subscription = BackHandler.addEventListener(
      "hardwareBackPress",
      () => {
        setSelectedPropietario(null);
        setScreenMode(SCREEN_MODES.LIST);
        return true;
      },
    );
    return () => subscription.remove();
  }, [screenMode]);

  const handleDelete = (propietario) => {
    Alert.alert(
      "Eliminar propietario",
      `Se eliminará a ${propietario.nombre || "este propietario"} de la asociación.`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Eliminar",
          style: "destructive",
          onPress: async () => {
            try {
              await deletePropietario(
                token,
                asociacionId,
                getMembershipId(propietario),
              );
              if (selectedMembershipId === getMembershipId(propietario)) {
                setSelectedPropietario(null);
                setScreenMode(SCREEN_MODES.LIST);
              }
              await refreshPropietarios();
            } catch (error) {
              Alert.alert("Error", error?.message || "No se pudo eliminar.");
            }
          },
        },
      ],
    );
  };

  if (!asociacionId) {
    return (
      <SafeAreaView
        style={[styles.safe, { backgroundColor: colors.background }]}
      >
        <ScrollView contentContainerStyle={styles.container}>
          <WorkshopScreenHeader
            onBack={onBack}
            section="Recepcion"
            title="Propietarios"
            subtitle="Directorio operativo de propietarios de la asociación activa."
          />
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
              name="business-outline"
              size={rf(32)}
              color={colors.textTertiary}
            />
            <Text style={[styles.emptyTitle, { color: colors.text }]}>
              Sin asociación activa
            </Text>
            <Text style={[styles.emptyMsg, { color: colors.textSecondary }]}>
              Crea o selecciona una asociación desde Inicio para gestionar
              propietarios.
            </Text>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  if (screenMode === SCREEN_MODES.DETAIL && selectedPropietario) {
    const fullName = [selectedPropietario.nombre, selectedPropietario.apellido]
      .filter(Boolean)
      .join(" ");

    return (
      <SafeAreaView
        style={[styles.safe, { backgroundColor: colors.background }]}
      >
        <ScrollView contentContainerStyle={styles.container}>
          <WorkshopScreenHeader
            onBack={() => {
              setSelectedPropietario(null);
              setScreenMode(SCREEN_MODES.LIST);
            }}
            section="Ficha propietario"
            title="Propietario"
            subtitle="Gestiona la ficha y asocia sus unidades desde esta vista."
            rightAction={{
              icon: "create-outline",
              onPress: () =>
                onOpenPropietarioForm?.(selectedPropietario, {
                  returnTo: "detail",
                }),
            }}
          />

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
                PRO-{String(getUserId(selectedPropietario)).padStart(6, "0")}
              </Text>
            </View>

            <View style={styles.detailFieldsWrap}>
              <Text style={[styles.fieldValue, { color: colors.text }]}>
                <Text style={styles.fieldValueStrong}>Nombre:</Text>{" "}
                {fullName || "Sin nombre"}
              </Text>
              <Text style={[styles.fieldValue, { color: colors.text }]}>
                <Text style={styles.fieldValueStrong}>Identificación:</Text>{" "}
                {selectedPropietario.rif_cedula || "Sin identificación"}
              </Text>
              <Text style={[styles.fieldValue, { color: colors.text }]}>
                <Text style={styles.fieldValueStrong}>Teléfono:</Text>{" "}
                {selectedPropietario.telefono || "Sin teléfono"}
              </Text>
              <Text style={[styles.fieldValue, { color: colors.text }]}>
                <Text style={styles.fieldValueStrong}>Correo:</Text>{" "}
                {selectedPropietario.email || "Sin correo"}
              </Text>
              <Text style={[styles.fieldValue, { color: colors.text }]}>
                <Text style={styles.fieldValueStrong}>Dirección:</Text>{" "}
                {selectedPropietario.direccion || "Sin dirección"}
              </Text>
              <Text style={[styles.fieldValue, { color: colors.text }]}>
                <Text style={styles.fieldValueStrong}>Invitación:</Text>{" "}
                {selectedPropietario.estado_invitacion ||
                  "PENDIENTE_INVITACION"}
              </Text>
            </View>

            <View style={styles.detailActionsRow}>
              <Pressable
                onPress={() => onOpenVehicleForm?.(selectedPropietario, null)}
                style={[styles.linkAction, { borderColor: colors.accent }]}
              >
                <Text style={[styles.linkActionText, { color: colors.accent }]}>
                  Asociar unidad
                </Text>
              </Pressable>
              <Pressable
                onPress={() => handleDelete(selectedPropietario)}
                style={[styles.linkAction, { borderColor: colors.danger }]}
              >
                <Text style={[styles.linkActionText, { color: colors.danger }]}>
                  Eliminar propietario
                </Text>
              </Pressable>
              {selectedPropietario.email ? (
                <Pressable
                  onPress={() =>
                    onOpenInvitationCenter?.(
                      "PROPIETARIO",
                      selectedPropietario.membresia_id ||
                        selectedPropietario.id,
                    )
                  }
                  style={[styles.linkAction, { borderColor: colors.primary }]}
                >
                  <Text
                    style={[styles.linkActionText, { color: colors.primary }]}
                  >
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
            <Pressable
              onPress={() => onOpenVehicleForm?.(selectedPropietario, null)}
              style={[styles.addBtn, { backgroundColor: colors.primary }]}
            >
              <Ionicons name="add" size={rf(16)} color={colors.white} />
              <Text style={[styles.addBtnText, { color: colors.white }]}>
                Asociar unidad
              </Text>
            </Pressable>
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
                onPress={() =>
                  onOpenVehicleForm?.(selectedPropietario, vehicle)
                }
                style={[
                  styles.vehicleCard,
                  {
                    backgroundColor: colors.cardBackground,
                    borderColor: colors.border,
                  },
                ]}
              >
                <View style={styles.vehicleCardHeader}>
                  <Text
                    style={[styles.vehicleEyebrow, { color: colors.accent }]}
                  >
                    Unidad
                  </Text>
                  <Ionicons
                    name="create-outline"
                    size={rf(18)}
                    color={colors.text}
                  />
                </View>
                <Text style={[styles.vehicleTitle, { color: colors.text }]}>
                  {[vehicle.marca, vehicle.modelo, vehicle.ano]
                    .filter(Boolean)
                    .join(" ") || "Unidad sin descripción"}
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
                <Text
                  style={[styles.vehicleUnitNumber, { color: colors.text }]}
                >
                  Unidad N° {vehicle.numero_unidad || "Sin número"}
                </Text>
                <Text
                  style={[styles.vehicleMeta, { color: colors.textSecondary }]}
                >
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
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.container}>
        <WorkshopScreenHeader
          onBack={onBack}
          section="Recepcion"
          title="Propietarios"
          subtitle="Lista operativa más limpia, con unidades asociadas visibles por propietario."
        />

        <View
          style={[
            styles.controlsPanel,
            {
              backgroundColor: colors.cardBackground,
              borderColor: colors.border,
            },
          ]}
        >
          <TextInput
            autoCapitalize="none"
            onChangeText={setSearchQuery}
            placeholder="Buscar por identificación o nombre"
            placeholderTextColor={colors.textTertiary}
            style={[
              styles.input,
              {
                backgroundColor: colors.inputBackground,
                borderColor: colors.border,
                color: colors.text,
              },
            ]}
            value={searchQuery}
          />
        </View>

        {loading ? (
          <ActivityIndicator
            color={colors.primary}
            style={{ marginTop: spacing.lg }}
          />
        ) : filtered.length ? (
          filtered.map((propietario) => {
            const fullName = [propietario.nombre, propietario.apellido]
              .filter(Boolean)
              .join(" ");
            return (
              <Pressable
                key={getMembershipId(propietario) || getUserId(propietario)}
                onPress={() => {
                  setSelectedPropietario(propietario);
                  setScreenMode(SCREEN_MODES.DETAIL);
                }}
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
                    <Text
                      style={[styles.ownerEyebrow, { color: colors.primary }]}
                    >
                      Recepción
                    </Text>
                    <Text style={[styles.itemName, { color: colors.text }]}>
                      {fullName || "Sin nombre"}
                    </Text>
                  </View>
                  <View style={styles.ownerActions}>
                    <Pressable
                      onPress={() => onOpenPropietarioForm?.(propietario, {})}
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
                    <Pressable
                      onPress={() => handleDelete(propietario)}
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
                  </View>
                </View>

                <View
                  style={[
                    styles.ownerDivider,
                    { backgroundColor: colors.border },
                  ]}
                />
                <Text style={[styles.itemMeta, { color: colors.text }]}>
                  <Text style={styles.fieldValueStrong}>Identificación:</Text>{" "}
                  {propietario.rif_cedula || "Sin identificación"}
                </Text>
                <Text style={[styles.itemMeta, { color: colors.text }]}>
                  <Text style={styles.fieldValueStrong}>Teléfono:</Text>{" "}
                  {propietario.telefono || "Sin teléfono"}
                </Text>
                <Text
                  style={[styles.ownerUnitsTitle, { color: colors.accent }]}
                >
                  Unidades asociadas:
                </Text>
                <Text
                  style={[
                    styles.ownerUnitsHint,
                    { color: colors.textSecondary },
                  ]}
                >
                  Presione sobre una unidad para ver detalles.
                </Text>

                {(propietario.linked_units || []).length ? (
                  propietario.linked_units.map((vehicle) => (
                    <Pressable
                      key={vehicle.id || vehicle.numero_unidad}
                      onPress={() => onOpenVehicleForm?.(propietario, vehicle)}
                      style={[
                        styles.ownerVehicleCard,
                        {
                          backgroundColor: colors.cardMuted,
                          borderColor: colors.border,
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.ownerVehicleTitle,
                          { color: colors.text },
                        ]}
                      >
                        {[vehicle.marca, vehicle.modelo, vehicle.ano]
                          .filter(Boolean)
                          .join(" ") || "Unidad sin descripción"}
                      </Text>
                      <View
                        style={[
                          styles.ownerVehicleDivider,
                          { backgroundColor: colors.border },
                        ]}
                      />
                      <Text
                        style={[
                          styles.ownerVehicleUnit,
                          { color: colors.text },
                        ]}
                      >
                        Unidad N° {vehicle.numero_unidad || "Sin número"}
                      </Text>
                      <Text
                        style={[
                          styles.ownerVehicleAccent,
                          { color: colors.accent },
                        ]}
                      >
                        Placa: {vehicle.placa || "Sin placa"}
                      </Text>

                      <Text
                        style={[
                          styles.ownerVehicleMeta,
                          { color: colors.textSecondary },
                        ]}
                      >
                        Kilometraje: {vehicle.kilometraje || "Sin kilometraje"}
                      </Text>
                    </Pressable>
                  ))
                ) : (
                  <Text
                    style={[
                      styles.ownerUnitsHint,
                      { color: colors.textSecondary },
                    ]}
                  >
                    Sin unidades asociadas.
                  </Text>
                )}
              </Pressable>
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
            <Text style={[styles.emptyTitle, { color: colors.text }]}>
              Sin propietarios
            </Text>
            <Text style={[styles.emptyMsg, { color: colors.textSecondary }]}>
              Registra el primer propietario de la asociación usando el botón
              inferior.
            </Text>
          </View>
        )}
      </ScrollView>

      <Pressable
        onPress={() => onOpenPropietarioForm?.(null, {})}
        style={[styles.fab, { backgroundColor: colors.primary }]}
      >
        <Ionicons name="add" size={rf(22)} color={colors.white} />
      </Pressable>
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
  controlsPanel: {
    borderWidth: 1,
    borderRadius: borderRadius.xl,
    padding: spacing.md,
  },
  input: {
    borderWidth: 1,
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    fontSize: rf(14),
    minHeight: rf(44),
  },
  itemInfo: { flex: 1, gap: spacing.xs / 2 },
  itemName: { fontSize: rf(15), fontWeight: "700" },
  itemMeta: { fontSize: rf(13), lineHeight: rf(20) },
  emptyBlock: {
    borderWidth: 1,
    borderRadius: borderRadius.xl,
    padding: spacing.xl,
    alignItems: "center",
    gap: spacing.md,
  },
  emptyTitle: { fontSize: rf(16), fontWeight: "800" },
  emptyMsg: { fontSize: rf(13), textAlign: "center", lineHeight: rf(19) },
  fab: {
    position: "absolute",
    bottom: spacing.xl,
    right: spacing.xl,
    width: rf(52),
    height: rf(52),
    borderRadius: borderRadius.pill,
    alignItems: "center",
    justifyContent: "center",
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
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
