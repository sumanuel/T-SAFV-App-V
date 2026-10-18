import { Ionicons } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useState } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useTheme } from "../../context/ThemeContext";
import { formatInputDate } from "../../utils/traza";
import { borderRadius, rf, spacing } from "../../utils/responsive";

function DateField({ label, value, onPress }) {
  const { colors } = useTheme();

  return (
    <View style={styles.dateField}>
      <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>
        {label}
      </Text>
      <Pressable
        onPress={onPress}
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
            { color: value ? colors.text : colors.textTertiary },
          ]}
        >
          {value || "AAAA-MM-DD"}
        </Text>
        <Ionicons
          name="calendar-outline"
          size={rf(18)}
          color={colors.textSecondary}
        />
      </Pressable>
    </View>
  );
}

function Chip({ label, active, activeColor, onPress }) {
  const { colors } = useTheme();

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
      onPress={onPress}
      style={[
        styles.chip,
        {
          backgroundColor: active ? activeColor : colors.cardMuted,
          borderColor: active ? activeColor : colors.border,
        },
      ]}
    >
      <Text
        style={[
          styles.chipText,
          { color: active ? colors.white : colors.text },
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

// Tarjeta de filtros de la traza: unidad filtrada, fechas, texto, fiscal y total
// de pasajeros.
export default function TrazaFilters({
  unitLabel,
  startDate,
  endDate,
  today,
  onChangeStartDate,
  onChangeEndDate,
  searchQuery,
  onChangeSearch,
  fiscalOptions,
  selectedFiscalId,
  onSelectFiscal,
  totalPasajeros,
  onRefresh,
}) {
  const { colors } = useTheme();
  const [pickingField, setPickingField] = useState(null);

  const pickerValue = pickingField === "start" ? startDate : endDate;
  const handlePicked = (_, selectedDate) => {
    const field = pickingField;
    setPickingField(null);
    if (!selectedDate) return;
    const formatted = formatInputDate(selectedDate);
    if (field === "start") onChangeStartDate(formatted);
    else onChangeEndDate(formatted);
  };

  return (
    <View
      style={[
        styles.filtersCard,
        {
          backgroundColor: colors.cardBackground,
          borderColor: colors.border,
        },
      ]}
    >
      {unitLabel ? (
        <View
          style={[
            styles.chip,
            {
              alignSelf: "flex-start",
              backgroundColor: colors.cardMuted,
              borderColor: colors.border,
            },
          ]}
        >
          <Text style={[styles.chipText, { color: colors.text }]}>
            Unidad filtrada: {unitLabel}
          </Text>
        </View>
      ) : null}

      <View style={styles.dateRow}>
        <DateField
          label="Desde"
          value={startDate}
          onPress={() => setPickingField("start")}
        />
        <DateField
          label="Hasta"
          value={endDate}
          onPress={() => setPickingField("end")}
        />
      </View>

      {pickingField ? (
        <DateTimePicker
          mode="date"
          value={new Date(pickerValue || today)}
          onChange={handlePicked}
        />
      ) : null}

      <TextInput
        value={searchQuery}
        onChangeText={onChangeSearch}
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
          <Chip
            label="Todos"
            active={selectedFiscalId === "ALL"}
            activeColor={colors.primary}
            onPress={() => onSelectFiscal("ALL")}
          />
          {fiscalOptions.map((fiscal) => {
            const active = String(fiscal.id) === String(selectedFiscalId);
            return (
              <Chip
                key={fiscal.id}
                label={fiscal.nombre}
                active={active}
                activeColor={colors.accent}
                onPress={() => onSelectFiscal(active ? "ALL" : fiscal.id)}
              />
            );
          })}
        </ScrollView>
      )}

      <View
        style={[
          styles.countBadge,
          { backgroundColor: colors.cardMuted, borderColor: colors.border },
        ]}
      >
        <Text style={[styles.countText, { color: colors.primary }]}>
          {totalPasajeros} {totalPasajeros === 1 ? "pasajero" : "pasajeros"}
        </Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Actualizar traza"
          onPress={onRefresh}
          style={styles.refreshBtn}
        >
          <Ionicons
            name="refresh-outline"
            size={rf(14)}
            color={colors.textSecondary}
          />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  filtersCard: {
    borderWidth: 1,
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    gap: spacing.md,
  },
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
});
