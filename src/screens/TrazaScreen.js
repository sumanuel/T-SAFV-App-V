import { Ionicons } from "@expo/vector-icons";
import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import WorkshopScreenHeader from "../components/common/WorkshopScreenHeader";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { useTraza } from "../hooks/useTraza";
import { borderRadius, rf, spacing } from "../utils/responsive";
import {
  buildTrazaCsv,
  extractFiscalOptions,
  filterTraza,
  formatInputDate,
  sumPassengers,
} from "../utils/traza";
import TrazaFilters from "./traza/TrazaFilters";
import TrazaRow from "./traza/TrazaRow";

export default function TrazaScreen({ initialUnit, onBack, currentRole }) {
  const { colors } = useTheme();
  const { token, activeAssociation } = useAuth();
  const today = formatInputDate(new Date());
  const [searchQuery, setSearchQuery] = useState("");
  const [startDate, setStartDate] = useState(today);
  const [endDate, setEndDate] = useState(today);
  const [selectedFiscalId, setSelectedFiscalId] = useState("ALL");
  const [selectedUnitId, setSelectedUnitId] = useState(initialUnit?.id || null);

  const asociacionId = activeAssociation?.id;
  const { items, loading, refresh } = useTraza({
    token,
    associationId: asociacionId,
    isOwner: currentRole === "owner",
    unitId: selectedUnitId,
    startDate,
    endDate,
  });

  useEffect(() => {
    setSelectedUnitId(initialUnit?.id || null);
    if (initialUnit?.placa || initialUnit?.numero_unidad) {
      setSearchQuery(initialUnit?.placa || initialUnit?.numero_unidad || "");
    } else {
      setSearchQuery("");
    }
  }, [initialUnit?.id, initialUnit?.numero_unidad, initialUnit?.placa]);

  const fiscalOptions = useMemo(() => extractFiscalOptions(items), [items]);
  const filtered = useMemo(
    () =>
      filterTraza(items, {
        fiscalId: selectedFiscalId,
        unitId: selectedUnitId,
        query: searchQuery,
      }),
    [items, searchQuery, selectedFiscalId, selectedUnitId],
  );
  const totalPasajeros = useMemo(() => sumPassengers(filtered), [filtered]);

  const exportTraza = async () => {
    if (!filtered.length) return;
    await Share.share({
      title: "Exportacion de trazas",
      message: buildTrazaCsv(filtered),
    });
  };

  if (!asociacionId) {
    return (
      <SafeAreaView
        style={[styles.safe, { backgroundColor: colors.background }]}
      >
        <ScrollView contentContainerStyle={styles.container}>
          <WorkshopScreenHeader
            onBack={onBack}
            section="Trazabilidad"
            title="Traza"
            subtitle="Registro de trazabilidad operativa."
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
              name="git-merge-outline"
              size={rf(32)}
              color={colors.textTertiary}
            />
            <Text style={[styles.emptyTitle, { color: colors.text }]}>
              Sin asociacion activa
            </Text>
            <Text style={[styles.emptyMsg, { color: colors.textSecondary }]}>
              Selecciona una asociacion desde Inicio para ver la trazabilidad.
            </Text>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
      <FlatList
        data={loading ? [] : filtered}
        keyExtractor={(item, idx) => String(item.id ?? idx)}
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
        initialNumToRender={10}
        windowSize={7}
        ListHeaderComponent={
          <View style={styles.listHeader}>
            <WorkshopScreenHeader
              onBack={onBack}
              section="Trazabilidad"
              title="Traza"
              subtitle={
                activeAssociation?.nombre ||
                "Registro de movimientos operativos"
              }
              rightAction={{
                icon: "share-outline",
                label: "Exportar traza",
                onPress: exportTraza,
              }}
            />
            <TrazaFilters
              unitLabel={
                selectedUnitId
                  ? initialUnit?.numero_unidad ||
                    initialUnit?.placa ||
                    selectedUnitId
                  : null
              }
              startDate={startDate}
              endDate={endDate}
              today={today}
              onChangeStartDate={setStartDate}
              onChangeEndDate={setEndDate}
              searchQuery={searchQuery}
              onChangeSearch={setSearchQuery}
              fiscalOptions={fiscalOptions}
              selectedFiscalId={selectedFiscalId}
              onSelectFiscal={setSelectedFiscalId}
              totalPasajeros={totalPasajeros}
              onRefresh={refresh}
            />
          </View>
        }
        renderItem={({ item }) => <TrazaRow item={item} />}
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
              <Ionicons
                name="git-merge-outline"
                size={rf(32)}
                color={colors.textTertiary}
              />
              <Text style={[styles.emptyTitle, { color: colors.text }]}>
                Sin registros
              </Text>
              <Text style={[styles.emptyMsg, { color: colors.textSecondary }]}>
                No hay trazas que coincidan con los filtros aplicados.
              </Text>
            </View>
          )
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  listHeader: { gap: spacing.md },
  container: {
    padding: spacing.md,
    gap: spacing.md,
    paddingBottom: spacing.xxl * 2,
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
});
