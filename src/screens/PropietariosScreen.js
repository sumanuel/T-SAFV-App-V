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
import { listVehiclesByPropietarioId } from "../services/vehicles/vehicleService";
import { borderRadius, rf, spacing } from "../utils/responsive";

const SCREEN_MODES = { LIST: "list", DETAIL: "detail" };

function getEntityId(entity) {
  return entity?.membresia_id || entity?.id || "";
}

export default function PropietariosScreen({
  onBack,
  onOpenPropietarioForm,
  onOpenVehicleForm,
  currentRole,
  userProfile,
  viewState,
}) {
  const { colors } = useTheme();
  const { token, activeAssociation } = useAuth();
  const [screenMode, setScreenMode] = useState(SCREEN_MODES.LIST);
  const [propietarios, setPropietarios] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedPropietario, setSelectedPropietario] = useState(null);
  const [vehicles, setVehicles] = useState([]);
  const [vehicleLoading, setVehicleLoading] = useState(false);

  const asociacionId = activeAssociation?.id;
  const selectedId = getEntityId(selectedPropietario);

  const filtered = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return propietarios.filter((p) => {
      if (!q) return true;
      const text = [p.rif_cedula, p.nombre, p.apellido, p.email]
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
      const data = await listPropietarios(token, asociacionId);
      setPropietarios(data);
      if (selectedId) {
        const refreshed = data.find((p) => getEntityId(p) === selectedId);
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
      (p) => getEntityId(p) === viewState.selectedClientId,
    );
    if (!match) return;
    setSelectedPropietario(match);
    setScreenMode(viewState.screenMode || SCREEN_MODES.DETAIL);
  }, [propietarios, viewState?.selectedClientId, viewState?.screenMode]);

  useEffect(() => {
    if (!selectedId || !asociacionId) {
      setVehicles([]);
      return;
    }
    const loadVehicles = async () => {
      setVehicleLoading(true);
      try {
        const data = await listVehiclesByPropietarioId(
          token,
          asociacionId,
          selectedId,
        );
        setVehicles(data);
      } catch {
        Alert.alert(
          "Unidades",
          "No se pudo cargar las unidades del propietario.",
        );
      } finally {
        setVehicleLoading(false);
      }
    };
    loadVehicles();
  }, [selectedId, asociacionId]);

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
                getEntityId(propietario),
              );
              if (selectedId === getEntityId(propietario)) {
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
            subtitle="Propietarios registrados en la asociacion activa."
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
              Sin asociacion activa
            </Text>
            <Text style={[styles.emptyMsg, { color: colors.textSecondary }]}>
              Crea o selecciona una asociacion desde Inicio para gestionar
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
            section="Recepcion"
            title={fullName || "Propietario"}
            subtitle={selectedPropietario.rif_cedula || "Sin identificacion"}
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
            {[
              {
                label: "Identificacion",
                value: selectedPropietario.rif_cedula,
              },
              { label: "Telefono", value: selectedPropietario.telefono },
              { label: "Correo", value: selectedPropietario.email },
              { label: "Direccion", value: selectedPropietario.direccion },
            ].map(({ label, value }) =>
              value ? (
                <View key={label} style={styles.fieldRow}>
                  <Text
                    style={[styles.fieldLabel, { color: colors.textSecondary }]}
                  >
                    {label}
                  </Text>
                  <Text style={[styles.fieldValue, { color: colors.text }]}>
                    {value}
                  </Text>
                </View>
              ) : null,
            )}
          </View>

          <View style={styles.sectionRow}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Unidades
            </Text>
            <Pressable
              onPress={() => onOpenVehicleForm?.(selectedPropietario, null)}
              style={[styles.addBtn, { backgroundColor: colors.primary }]}
            >
              <Ionicons name="add" size={rf(16)} color={colors.white} />
              <Text style={[styles.addBtnText, { color: colors.white }]}>
                Nueva unidad
              </Text>
            </Pressable>
          </View>

          {vehicleLoading ? (
            <ActivityIndicator
              color={colors.primary}
              style={{ marginTop: spacing.md }}
            />
          ) : vehicles.length ? (
            vehicles.map((v) => (
              <Pressable
                key={v.id}
                onPress={() => onOpenVehicleForm?.(selectedPropietario, v)}
                style={[
                  styles.vehicleRow,
                  {
                    backgroundColor: colors.cardMuted,
                    borderColor: colors.border,
                  },
                ]}
              >
                <View style={styles.vehicleInfo}>
                  <Text
                    style={[styles.vehiclePlate, { color: colors.primary }]}
                  >
                    {v.placa}
                  </Text>
                  <Text
                    style={[
                      styles.vehicleMeta,
                      { color: colors.textSecondary },
                    ]}
                  >
                    {[v.marca, v.modelo, v.ano].filter(Boolean).join(" · ")}
                  </Text>
                </View>
                <Ionicons
                  name="chevron-forward"
                  size={rf(16)}
                  color={colors.textTertiary}
                />
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
          subtitle="Directorio operativo de propietarios en la asociacion activa."
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
            placeholder="Buscar por cedula, nombre o correo"
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
          filtered.map((p) => {
            const fullName = [p.nombre, p.apellido].filter(Boolean).join(" ");
            return (
              <Pressable
                key={getEntityId(p)}
                onPress={() => {
                  setSelectedPropietario(p);
                  setScreenMode(SCREEN_MODES.DETAIL);
                }}
                style={[
                  styles.itemRow,
                  {
                    backgroundColor: colors.cardBackground,
                    borderColor: colors.border,
                  },
                ]}
              >
                <View style={styles.itemInfo}>
                  <Text style={[styles.itemName, { color: colors.text }]}>
                    {fullName}
                  </Text>
                  <Text
                    style={[styles.itemMeta, { color: colors.textSecondary }]}
                  >
                    {p.rif_cedula || p.email || "Sin datos adicionales"}
                  </Text>
                </View>
                <Ionicons
                  name="chevron-forward"
                  size={rf(16)}
                  color={colors.textTertiary}
                />
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
              Registra el primer propietario de la asociacion usando el boton
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
  itemRow: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: borderRadius.xl,
    padding: spacing.md,
    gap: spacing.md,
  },
  itemInfo: { flex: 1, gap: spacing.xs / 2 },
  itemName: { fontSize: rf(15), fontWeight: "700" },
  itemMeta: { fontSize: rf(12) },
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
  fieldRow: { gap: spacing.xs / 2 },
  fieldLabel: {
    fontSize: rf(11),
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.6,
  },
  fieldValue: { fontSize: rf(14) },
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
  vehicleRow: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: borderRadius.xl,
    padding: spacing.md,
    gap: spacing.md,
  },
  vehicleInfo: { flex: 1, gap: spacing.xs / 2 },
  vehiclePlate: { fontSize: rf(15), fontWeight: "800" },
  vehicleMeta: { fontSize: rf(12) },
});
