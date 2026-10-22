import { Ionicons } from "@expo/vector-icons";
import { useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import WorkshopScreenHeader from "../components/common/WorkshopScreenHeader";
import { hasPermission } from "../constants/accessControl";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { useIncidencias } from "../hooks/useIncidencias";
import {
  INCIDENCIA_ESTADOS,
  countByEstado,
  filterIncidencias,
} from "../utils/incidencias";
import { borderRadius, rf, spacing } from "../utils/responsive";
import IncidenciaCard from "./incidencias/IncidenciaCard";

const FILTERS = [{ value: "TODAS", label: "Todas" }, ...INCIDENCIA_ESTADOS];

export default function IncidenciasScreen({
  onBack,
  onOpenForm,
  onOpenDetail,
  currentRole,
}) {
  const { colors } = useTheme();
  const { token, activeAssociation } = useAuth();
  const asociacionId = activeAssociation?.id;
  const [estado, setEstado] = useState("TODAS");
  const [query, setQuery] = useState("");
  const { items, loading, error, refresh } = useIncidencias({
    token,
    associationId: asociacionId,
  });

  const counts = useMemo(() => countByEstado(items), [items]);
  const filtered = useMemo(
    () => filterIncidencias(items, { estado, query }),
    [estado, items, query],
  );
  const canCreate = hasPermission(currentRole, "incidents.create");

  const emptyBlock = (icon, title, message) => (
    <View
      style={[
        styles.emptyBlock,
        { backgroundColor: colors.cardBackground, borderColor: colors.border },
      ]}
    >
      <Ionicons name={icon} size={rf(32)} color={colors.textTertiary} />
      <Text style={[styles.emptyTitle, { color: colors.text }]}>{title}</Text>
      <Text style={[styles.emptyMsg, { color: colors.textSecondary }]}>
        {message}
      </Text>
    </View>
  );

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
      <FlatList
        data={loading || !asociacionId ? [] : filtered}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
        initialNumToRender={10}
        windowSize={7}
        ListHeaderComponent={
          <View style={styles.listHeader}>
            <WorkshopScreenHeader
              onBack={onBack}
              section="Control"
              title="Incidencias"
              subtitle={
                activeAssociation?.nombre ||
                "Infracciones y eventos fuera de una fiscalización"
              }
              rightAction={
                canCreate && asociacionId
                  ? {
                      icon: "add-circle-outline",
                      label: "Registrar incidencia",
                      onPress: () => onOpenForm?.(),
                    }
                  : undefined
              }
            />
            <View
              style={[
                styles.panel,
                {
                  backgroundColor: colors.cardBackground,
                  borderColor: colors.border,
                },
              ]}
            >
              <TextInput
                value={query}
                onChangeText={setQuery}
                placeholder="Buscar por descripción, unidad, lugar o tipo"
                placeholderTextColor={colors.textTertiary}
                style={[
                  styles.search,
                  {
                    backgroundColor: colors.inputBackground,
                    borderColor: colors.border,
                    color: colors.text,
                  },
                ]}
              />
              <View style={styles.chips}>
                {FILTERS.map((filter) => {
                  const selected = filter.value === estado;
                  return (
                    <Pressable
                      key={filter.value}
                      onPress={() => setEstado(filter.value)}
                      style={[
                        styles.chip,
                        {
                          backgroundColor: selected
                            ? colors.primary
                            : colors.cardMuted,
                          borderColor: selected
                            ? colors.primary
                            : colors.border,
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.chipText,
                          { color: selected ? colors.white : colors.text },
                        ]}
                      >
                        {filter.label} ({counts[filter.value] ?? 0})
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
              <Pressable
                onPress={refresh}
                accessibilityRole="button"
                style={styles.refresh}
              >
                <Ionicons
                  name="refresh-outline"
                  size={rf(16)}
                  color={colors.primary}
                />
                <Text style={[styles.refreshText, { color: colors.primary }]}>
                  Actualizar
                </Text>
              </Pressable>
            </View>
          </View>
        }
        renderItem={({ item }) => (
          <IncidenciaCard item={item} onPress={() => onOpenDetail?.(item)} />
        )}
        ListEmptyComponent={
          !asociacionId ? (
            emptyBlock(
              "alert-circle-outline",
              "Sin asociación activa",
              "Selecciona una asociación desde Inicio para ver las incidencias.",
            )
          ) : loading ? (
            <ActivityIndicator
              color={colors.primary}
              style={{ marginTop: spacing.lg }}
            />
          ) : error ? (
            emptyBlock("cloud-offline-outline", "No se pudo cargar", error)
          ) : items.length ? (
            emptyBlock(
              "search-outline",
              "Sin resultados",
              "Ninguna incidencia coincide con los filtros aplicados.",
            )
          ) : (
            emptyBlock(
              "alert-circle-outline",
              "Sin incidencias",
              canCreate
                ? "Aún no hay incidencias. Usa el botón + para registrar una."
                : "Aún no hay incidencias registradas.",
            )
          )
        }
      />
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
  panel: {
    borderWidth: 1,
    borderRadius: borderRadius.xl,
    padding: spacing.md,
    gap: spacing.sm,
  },
  search: {
    borderWidth: 1,
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    fontSize: rf(14),
    minHeight: rf(44),
  },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
  chip: {
    borderWidth: 1,
    borderRadius: borderRadius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 2,
  },
  chipText: { fontSize: rf(12), fontWeight: "700" },
  refresh: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    gap: spacing.xs,
  },
  refreshText: { fontSize: rf(13), fontWeight: "700" },
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
