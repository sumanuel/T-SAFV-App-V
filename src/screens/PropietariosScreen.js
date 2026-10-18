import { Ionicons } from "@expo/vector-icons";
import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  BackHandler,
  FlatList,
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
import {
  filterPropietarios,
  getMembershipId,
  getUserId,
  mergeLinkedUnits,
} from "../utils/propietarios";
import { borderRadius, rf, spacing } from "../utils/responsive";
import PropietarioDetail from "./propietarios/PropietarioDetail";
import PropietarioListItem from "./propietarios/PropietarioListItem";

const SCREEN_MODES = { LIST: "list", DETAIL: "detail" };

export default function PropietariosScreen({
  onBack,
  onOpenInvitationCenter,
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
  const [allVehicles, setAllVehicles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedPropietario, setSelectedPropietario] = useState(null);
  const [vehicles, setVehicles] = useState([]);
  const [vehicleLoading, setVehicleLoading] = useState(false);
  const isOwnerSelfService = currentRole === "owner";
  const canManageOwners = currentRole === "administrator";

  const asociacionId = activeAssociation?.id;
  const selectedMembershipId = getMembershipId(selectedPropietario);
  const selectedUserId = getUserId(selectedPropietario);

  const filtered = useMemo(
    () => filterPropietarios(propietarios, searchQuery),
    [propietarios, searchQuery],
  );

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
      const scopedOwners = isOwnerSelfService
        ? nextOwners.filter(
            (propietario) =>
              String(getUserId(propietario)) === String(userProfile?.uid),
          )
        : nextOwners;

      setAllVehicles(vehiclesData);
      setPropietarios(scopedOwners);

      if (selectedMembershipId) {
        const refreshed = scopedOwners.find(
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
    const backToList = () => {
      setSelectedPropietario(null);
      setScreenMode(SCREEN_MODES.LIST);
    };

    return (
      <SafeAreaView
        style={[styles.safe, { backgroundColor: colors.background }]}
      >
        <ScrollView contentContainerStyle={styles.container}>
          <WorkshopScreenHeader
            onBack={backToList}
            section="Ficha propietario"
            title={isOwnerSelfService ? "Mis datos" : "Propietario"}
            subtitle={
              isOwnerSelfService
                ? "Edita únicamente tu ficha personal y revisa tus unidades asociadas."
                : "Gestiona la ficha y asocia sus unidades desde esta vista."
            }
            rightAction={
              canManageOwners || isOwnerSelfService
                ? {
                    icon: "create-outline",
                    label: "Editar propietario",
                    onPress: () =>
                      onOpenPropietarioForm?.(selectedPropietario, {
                        returnTo: "detail",
                      }),
                  }
                : undefined
            }
          />
          <PropietarioDetail
            propietario={selectedPropietario}
            vehicles={vehicles}
            vehicleLoading={vehicleLoading}
            canManage={canManageOwners}
            onAddUnit={() => onOpenVehicleForm?.(selectedPropietario, null)}
            onOpenUnit={(vehicle) =>
              onOpenVehicleForm?.(selectedPropietario, vehicle)
            }
            onDelete={() => handleDelete(selectedPropietario)}
            onInvite={() =>
              onOpenInvitationCenter?.(
                "PROPIETARIO",
                selectedPropietario.membresia_id || selectedPropietario.id,
              )
            }
          />
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
      <FlatList
        data={loading ? [] : filtered}
        keyExtractor={(propietario, index) =>
          String(
            getMembershipId(propietario) || getUserId(propietario) || index,
          )
        }
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
        initialNumToRender={6}
        windowSize={7}
        ListHeaderComponent={
          <View style={styles.listHeader}>
            <WorkshopScreenHeader
              onBack={onBack}
              section="Recepcion"
              title={isOwnerSelfService ? "Mis datos" : "Propietarios"}
              subtitle={
                isOwnerSelfService
                  ? "Solo verás la ficha vinculada a tu usuario y las unidades asociadas a tu perfil."
                  : "Lista operativa más limpia, con unidades asociadas visibles por propietario."
              }
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
          </View>
        }
        renderItem={({ item }) => (
          <PropietarioListItem
            propietario={item}
            canEdit={canManageOwners || isOwnerSelfService}
            canDelete={canManageOwners}
            onOpen={() => {
              setSelectedPropietario(item);
              setScreenMode(SCREEN_MODES.DETAIL);
            }}
            onEdit={() => onOpenPropietarioForm?.(item, {})}
            onDelete={() => handleDelete(item)}
            onOpenVehicle={(vehicle) => onOpenVehicleForm?.(item, vehicle)}
          />
        )}
        ListEmptyComponent={
          loading ? (
            <ActivityIndicator
              color={colors.primary}
              style={{ marginTop: spacing.lg }}
            />
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
          )
        }
      />

      {canManageOwners ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Agregar propietario"
          onPress={() => onOpenPropietarioForm?.(null, {})}
          style={[styles.fab, { backgroundColor: colors.primary }]}
        >
          <Ionicons name="add" size={rf(22)} color={colors.white} />
        </Pressable>
      ) : null}
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
  listHeader: { gap: spacing.md },
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
});
