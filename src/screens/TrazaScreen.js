import { Ionicons } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import WorkshopScreenHeader from "../components/common/WorkshopScreenHeader";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { listTraza } from "../services/traza/trazaService";
import { borderRadius, rf, spacing } from "../utils/responsive";

function normalizeDateInput(value) {
  return value.replace(/[^0-9-]/g, "").slice(0, 10);
}

function formatInputDate(value = new Date()) {
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, "0");
  const day = String(value.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function formatDateTime(value) {
  if (!value) return "Sin fecha";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "Sin fecha";
  return d.toLocaleString("es-VE");
}

export default function TrazaScreen({ onBack, currentRole, userProfile }) {
  const { colors } = useTheme();
  const { token, activeAssociation } = useAuth();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const today = formatInputDate(new Date());
  const [startDate, setStartDate] = useState(today);
  const [endDate, setEndDate] = useState(today);
  const [selectedFiscalId, setSelectedFiscalId] = useState("ALL");
  const [fiscalOptions, setFiscalOptions] = useState([]);
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);

  const asociacionId = activeAssociation?.id;

  const refreshData = async () => {
    if (!asociacionId) return;
    setLoading(true);
    try {
      const data = await listTraza(token, asociacionId, {
        fecha_inicio: startDate || undefined,
        fecha_fin: endDate || undefined,
      });
      setItems(data);

      // Extract unique fiscales for filter
      const fiscalesMap = {};
      data.forEach((item) => {
        if (item.fiscal_id && item.fiscal_nombre) {
          fiscalesMap[item.fiscal_id] = item.fiscal_nombre;
        }
      });
      setFiscalOptions(
        Object.entries(fiscalesMap).map(([id, nombre]) => ({ id, nombre })),
      );
    } catch {
      Alert.alert("Traza", "No se pudo cargar el registro de trazabilidad.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshData();
  }, [asociacionId, startDate, endDate]);

  const filtered = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return items.filter((item) => {
      if (
        selectedFiscalId !== "ALL" &&
        String(item.fiscal_id) !== String(selectedFiscalId)
      ) {
        return false;
      }
      if (q) {
        const text = [
          item.placa,
          item.numero_unidad,
          item.chofer,
          item.destino,
          item.origen,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        if (!text.includes(q)) return false;
      }
      return true;
    });
  }, [items, searchQuery, selectedFiscalId]);

  const exportTraza = async () => {
    if (!filtered.length) return;
    const header = [
      "Fecha",
      "Unidad",
      "Placa",
      "Fiscal",
      "Punto de control",
      "Chofer",
      "Origen",
      "Destino",
      "Pasajeros",
    ];
    const rows = filtered.map((item) => [
      formatDateTime(item.fecha_hora_registro),
      item.numero_unidad || item.unidad_id || "",
      item.placa || "",
      item.fiscal_nombre || item.fiscal_id || "",
      item.punto_control || "",
      item.chofer || "",
      item.origen || "",
      item.destino || "",
      item.pasajeros ?? "",
    ]);
    const csv = [header, ...rows]
      .map((line) =>
        line.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(","),
      )
      .join("\n");
    await Share.share({ title: "Exportacion de trazas", message: csv });
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
      <ScrollView contentContainerStyle={styles.container}>
        <WorkshopScreenHeader
          onBack={onBack}
          section="Trazabilidad"
          title="Traza"
          subtitle={
            activeAssociation?.nombre || "Registro de movimientos operativos"
          }
          rightAction={{
            icon: "share-outline",
            onPress: exportTraza,
          }}
        />

        {/* Filtros */}
        <View
          style={[
            styles.filtersCard,
            {
              backgroundColor: colors.cardBackground,
              borderColor: colors.border,
            },
          ]}
        >
          <Text style={[styles.filterTitle, { color: colors.text }]}>
            Filtros
          </Text>

          <View style={styles.dateRow}>
            <View style={styles.dateField}>
              <Text
                style={[styles.inputLabel, { color: colors.textSecondary }]}
              >
                Desde
              </Text>
              <Pressable
                onPress={() => setShowStartPicker(true)}
                style={[
                  styles.dateSelector,
                  {
                    backgroundColor: colors.inputBackground,
                    borderColor: colors.border,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.dateSelectorText,
                    { color: startDate ? colors.text : colors.textTertiary },
                  ]}
                >
                  {startDate || "AAAA-MM-DD"}
                </Text>
                <Ionicons
                  name="calendar-outline"
                  size={rf(18)}
                  color={colors.textSecondary}
                />
              </Pressable>
            </View>
            <View style={styles.dateField}>
              <Text
                style={[styles.inputLabel, { color: colors.textSecondary }]}
              >
                Hasta
              </Text>
              <Pressable
                onPress={() => setShowEndPicker(true)}
                style={[
                  styles.dateSelector,
                  {
                    backgroundColor: colors.inputBackground,
                    borderColor: colors.border,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.dateSelectorText,
                    { color: endDate ? colors.text : colors.textTertiary },
                  ]}
                >
                  {endDate || "AAAA-MM-DD"}
                </Text>
                <Ionicons
                  name="calendar-outline"
                  size={rf(18)}
                  color={colors.textSecondary}
                />
              </Pressable>
            </View>
          </View>

          {showStartPicker ? (
            <DateTimePicker
              mode="date"
              value={new Date(startDate || today)}
              onChange={(_, selectedDate) => {
                setShowStartPicker(false);
                if (selectedDate) {
                  setStartDate(formatInputDate(selectedDate));
                }
              }}
            />
          ) : null}

          {showEndPicker ? (
            <DateTimePicker
              mode="date"
              value={new Date(endDate || today)}
              onChange={(_, selectedDate) => {
                setShowEndPicker(false);
                if (selectedDate) {
                  setEndDate(formatInputDate(selectedDate));
                }
              }}
            />
          ) : null}

          <TextInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Buscar por placa, unidad, chofer o destino"
            placeholderTextColor={colors.textTertiary}
            style={[
              styles.input,
              {
                backgroundColor: colors.inputBackground,
                borderColor: colors.border,
                color: colors.text,
              },
            ]}
          />

          {fiscalOptions.length > 0 && (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.filterChips}
            >
              <Pressable
                onPress={() => setSelectedFiscalId("ALL")}
                style={[
                  styles.chip,
                  {
                    backgroundColor:
                      selectedFiscalId === "ALL"
                        ? colors.primary
                        : colors.cardMuted,
                    borderColor:
                      selectedFiscalId === "ALL"
                        ? colors.primary
                        : colors.border,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.chipText,
                    {
                      color:
                        selectedFiscalId === "ALL" ? colors.white : colors.text,
                    },
                  ]}
                >
                  Todos
                </Text>
              </Pressable>
              {fiscalOptions.map((f) => (
                <Pressable
                  key={f.id}
                  onPress={() =>
                    setSelectedFiscalId(
                      String(f.id) === String(selectedFiscalId) ? "ALL" : f.id,
                    )
                  }
                  style={[
                    styles.chip,
                    {
                      backgroundColor:
                        String(f.id) === String(selectedFiscalId)
                          ? colors.accent
                          : colors.cardMuted,
                      borderColor:
                        String(f.id) === String(selectedFiscalId)
                          ? colors.accent
                          : colors.border,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.chipText,
                      {
                        color:
                          String(f.id) === String(selectedFiscalId)
                            ? colors.white
                            : colors.text,
                      },
                    ]}
                  >
                    {f.nombre}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>
          )}

          <View
            style={[
              styles.countBadge,
              { backgroundColor: colors.cardMuted, borderColor: colors.border },
            ]}
          >
            <Text style={[styles.countText, { color: colors.primary }]}>
              {filtered.length}{" "}
              {filtered.length === 1 ? "registro" : "registros"}
            </Text>
            <Pressable onPress={refreshData} style={styles.refreshBtn}>
              <Ionicons
                name="refresh-outline"
                size={rf(14)}
                color={colors.textSecondary}
              />
            </Pressable>
          </View>
        </View>

        {loading ? (
          <ActivityIndicator
            color={colors.primary}
            style={{ marginTop: spacing.lg }}
          />
        ) : filtered.length ? (
          filtered.map((item, idx) => (
            <View
              key={item.id || idx}
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
                    {item.placa || item.numero_unidad || "—"}
                  </Text>
                </View>
                <Text
                  style={[styles.traceDate, { color: colors.textTertiary }]}
                >
                  {formatDateTime(item.fecha_hora_registro)}
                </Text>
              </View>

              <View style={styles.traceMeta}>
                {item.fiscal_nombre ? (
                  <Text
                    style={[
                      styles.traceMetaText,
                      { color: colors.textSecondary },
                    ]}
                  >
                    <Text style={{ fontWeight: "700" }}>Fiscal: </Text>
                    {item.fiscal_nombre}
                  </Text>
                ) : null}
                {item.punto_control ? (
                  <Text
                    style={[
                      styles.traceMetaText,
                      { color: colors.textSecondary },
                    ]}
                  >
                    <Text style={{ fontWeight: "700" }}>
                      Punto de control:{" "}
                    </Text>
                    {item.punto_control}
                  </Text>
                ) : null}
                {item.chofer ? (
                  <Text
                    style={[
                      styles.traceMetaText,
                      { color: colors.textSecondary },
                    ]}
                  >
                    <Text style={{ fontWeight: "700" }}>Chofer: </Text>
                    {item.chofer}
                  </Text>
                ) : null}
                {item.origen || item.destino ? (
                  <Text
                    style={[
                      styles.traceMetaText,
                      { color: colors.textSecondary },
                    ]}
                  >
                    {[item.origen, item.destino].filter(Boolean).join(" → ")}
                  </Text>
                ) : null}
                {item.pasajeros !== undefined && item.pasajeros !== null ? (
                  <Text
                    style={[
                      styles.traceMetaText,
                      { color: colors.textSecondary },
                    ]}
                  >
                    <Text style={{ fontWeight: "700" }}>Pasajeros: </Text>
                    {item.pasajeros}
                  </Text>
                ) : null}
              </View>
            </View>
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
        )}
      </ScrollView>
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
  filtersCard: {
    borderWidth: 1,
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    gap: spacing.md,
  },
  filterTitle: { fontSize: rf(14), fontWeight: "800" },
  dateRow: { flexDirection: "row", gap: spacing.sm },
  dateField: { flex: 1, gap: spacing.xs },
  inputLabel: { fontSize: rf(11), fontWeight: "700" },
  dateSelector: {
    borderWidth: 1,
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    minHeight: rf(40),
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  dateSelectorText: { fontSize: rf(13), fontWeight: "600" },
  input: {
    borderWidth: 1,
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    fontSize: rf(13),
    minHeight: rf(40),
  },
  filterChips: { flexGrow: 0 },
  chip: {
    borderWidth: 1,
    borderRadius: borderRadius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    marginRight: spacing.sm,
  },
  chipText: { fontSize: rf(12), fontWeight: "700" },
  countBadge: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1,
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  countText: { fontSize: rf(13), fontWeight: "700" },
  refreshBtn: { padding: spacing.xs },
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
