import { Ionicons } from "@expo/vector-icons";
import { useEffect, useState } from "react";
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import WorkshopScreenHeader from "../components/common/WorkshopScreenHeader";
import MetricCard from "../components/common/MetricCard";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { createAssociation } from "../services/associations/associationService";
import { listVehicles } from "../services/vehicles/vehicleService";
import { borderRadius, rf, spacing } from "../utils/responsive";

export default function WorkshopHomeScreen({ onOpenPropietarios, onOpenFiscales, onOpenTraza, onOpenFiscalRecord, onSignOut, currentRole, userProfile }) {
  const { colors } = useTheme();
  const { token, associations, activeAssociation, activeAssociationId, refreshAssociations } = useAuth();
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newAsocName, setNewAsocName] = useState("");
  const [newAsocRif, setNewAsocRif] = useState("");
  const [creating, setCreating] = useState(false);
  const hasAssociation = associations.length > 0;

  const refreshUnits = async () => {
    if (!activeAssociation?.id) return;
    setLoading(true);
    try {
      const data = await listVehicles(token, activeAssociation.id);
      setVehicles(data);
    } catch { Alert.alert("Unidades", "No se pudo cargar las unidades."); }
    finally { setLoading(false); }
  };

  useEffect(() => { refreshUnits(); }, [activeAssociationId]);

  const filtered = vehicles.filter((v) => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return true;
    return [v.placa, v.numero_unidad, v.marca, v.modelo, v.chofer, v.propietario_nombre].filter(Boolean).join(" ").toLowerCase().includes(q);
  });

  const handleCreateAssociation = async () => {
    if (!newAsocName.trim()) { Alert.alert("Datos incompletos", "El nombre es obligatorio."); return; }
    setCreating(true);
    try {
      await createAssociation(token, { nombre: newAsocName, rif: newAsocRif });
      await refreshAssociations();
      setShowCreateForm(false); setNewAsocName(""); setNewAsocRif("");
    } catch (error) { Alert.alert("Error", error?.message || "No se pudo crear la asociacion."); }
    finally { setCreating(false); }
  };

  if (!hasAssociation) {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
        <ScrollView contentContainerStyle={styles.container}>
          <WorkshopScreenHeader section="Fiscalización" title="T-SAFV" subtitle="Sistema operativo para control y fiscalización de unidades." />
          {!showCreateForm ? (
            <View style={[styles.noAssocBlock, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}>
              <Ionicons name="business-outline" size={rf(40)} color={colors.textTertiary} />
              <Text style={[styles.noAssocTitle, { color: colors.text }]}>Sin asociacion registrada</Text>
              <Text style={[styles.noAssocMsg, { color: colors.textSecondary }]}>Para comenzar necesitas crear una asociacion. Solo se puede crear una por cuenta.</Text>
              <Pressable onPress={() => setShowCreateForm(true)} style={[styles.createAssocBtn, { backgroundColor: colors.primary }]}>
                <Ionicons name="add-circle-outline" size={rf(18)} color={colors.white} />
                <Text style={[styles.createAssocBtnText, { color: colors.white }]}>Crear asociacion</Text>
              </Pressable>
            </View>
          ) : (
            <View style={[styles.formCard, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}>
              <Text style={[styles.formTitle, { color: colors.text }]}>Nueva asociacion</Text>
              <View style={styles.fieldWrap}>
                <Text style={[styles.label, { color: colors.textSecondary }]}>Nombre *</Text>
                <TextInput value={newAsocName} onChangeText={setNewAsocName} placeholder="Nombre de la asociacion" placeholderTextColor={colors.textTertiary} autoCapitalize="words" style={[styles.input, { backgroundColor: colors.inputBackground, borderColor: colors.border, color: colors.text }]} />
              </View>
              <View style={styles.fieldWrap}>
                <Text style={[styles.label, { color: colors.textSecondary }]}>RIF (opcional)</Text>
                <TextInput value={newAsocRif} onChangeText={setNewAsocRif} placeholder="J-12345678-9" placeholderTextColor={colors.textTertiary} autoCapitalize="characters" style={[styles.input, { backgroundColor: colors.inputBackground, borderColor: colors.border, color: colors.text }]} />
              </View>
              <View style={styles.formActions}>
                <Pressable onPress={() => setShowCreateForm(false)} style={[styles.cancelBtn, { backgroundColor: colors.cardMuted, borderColor: colors.border }]}>
                  <Text style={[styles.cancelBtnText, { color: colors.text }]}>Cancelar</Text>
                </Pressable>
                <Pressable onPress={handleCreateAssociation} disabled={creating} style={[styles.confirmBtn, { backgroundColor: creating ? colors.border : colors.primary }]}>
                  {creating ? <ActivityIndicator color={colors.white} size="small" /> : <Text style={[styles.confirmBtnText, { color: colors.white }]}>Crear</Text>}
                </Pressable>
              </View>
            </View>
          )}
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.container}>
        <WorkshopScreenHeader section="Fiscalización" title={activeAssociation?.nombre || "T-SAFV"} subtitle={activeAssociation?.rif || "Control operativo de la asociación activa"} />
        <View style={styles.metricsRow}>
          <MetricCard value={String(vehicles.length)} label="Unidades" tone="primary" />
          <MetricCard value={loading ? "..." : String(filtered.length)} label="Visibles" tone="accent" />
        </View>
        <View style={styles.quickActionsRow}>
          {[
            { icon: "people-outline", label: "Propietarios", color: colors.primary, onPress: onOpenPropietarios },
            { icon: "shield-checkmark-outline", label: "Fiscales", color: colors.accent, onPress: onOpenFiscales },
            { icon: "git-merge-outline", label: "Traza", color: colors.warning, onPress: onOpenTraza },
          ].map((a) => (
            <Pressable key={a.label} onPress={a.onPress} style={[styles.quickAction, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}>
              <Ionicons name={a.icon} size={rf(22)} color={a.color} />
              <Text style={[styles.quickActionLabel, { color: colors.text }]}>{a.label}</Text>
            </Pressable>
          ))}
        </View>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Unidades activas</Text>
        <View style={[styles.searchPanel, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}>
          <TextInput value={searchQuery} onChangeText={setSearchQuery} placeholder="Buscar por placa, unidad, marca o chofer" placeholderTextColor={colors.textTertiary} style={[styles.searchInput, { backgroundColor: colors.inputBackground, borderColor: colors.border, color: colors.text }]} />
        </View>
        {loading ? (
          <ActivityIndicator color={colors.primary} style={{ marginTop: spacing.lg }} />
        ) : filtered.length ? (
          filtered.map((v) => (
            <Pressable key={v.id} onPress={() => onOpenFiscalRecord?.(v)} style={[styles.unitCard, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}> 
              <View style={styles.unitCardTopRow}>
                <View style={[styles.unitPill, { backgroundColor: colors.cardMuted, borderColor: colors.border }]}> 
                  <Ionicons name="bus-outline" size={rf(14)} color={colors.primary} />
                  <Text style={[styles.unitPillText, { color: colors.primary }]}>Unidad</Text>
                </View>
                <View style={[styles.unitActionPill, { borderColor: colors.primary }]}> 
                  <Text style={[styles.unitActionText, { color: colors.primary }]}>Fiscalizar</Text>
                </View>
              </View>
              <Text style={[styles.unitTitle, { color: colors.text }]}>{[v.marca, v.modelo, v.ano].filter(Boolean).join(" ") || "Unidad sin descripción"}</Text>
              <Text style={[styles.unitAccent, { color: colors.accent }]}>Placa: {v.placa || "Sin placa"}</Text>
              <Text style={[styles.unitCode, { color: colors.primary }]}>Unidad N° {v.numero_unidad || v.id}</Text>
              {v.propietario_nombre || v.propietario_apellido ? (
                <Text style={[styles.unitMeta, { color: colors.textSecondary }]}>Propietario: {[v.propietario_nombre, v.propietario_apellido].filter(Boolean).join(" ")}</Text>
              ) : null}
              <Text style={[styles.unitOwner, { color: colors.textTertiary }]}>Chofer: {v.ultimo_chofer || v.chofer || "Sin chofer"}</Text>
            </Pressable>
          ))
        ) : (
          <View style={[styles.emptyBlock, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}>
            <Ionicons name="car-outline" size={rf(32)} color={colors.textTertiary} />
            <Text style={[styles.emptyTitle, { color: colors.text }]}>Sin unidades</Text>
            <Text style={[styles.emptyMsg, { color: colors.textSecondary }]}>Registra propietarios y asígnales unidades para verlas aquí.</Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  container: { padding: spacing.md, gap: spacing.md, paddingBottom: spacing.xxl * 2 },
  metricsRow: { flexDirection: "row", gap: spacing.sm },
  quickActionsRow: { flexDirection: "row", gap: spacing.sm },
  quickAction: { flex: 1, borderWidth: 1, borderRadius: borderRadius.xl, padding: spacing.md, alignItems: "center", gap: spacing.xs },
  quickActionLabel: { fontSize: rf(11), fontWeight: "700", textAlign: "center" },
  sectionTitle: { fontSize: rf(15), fontWeight: "800", paddingHorizontal: spacing.xs },
  searchPanel: { borderWidth: 1, borderRadius: borderRadius.xl, padding: spacing.md },
  searchInput: { borderWidth: 1, borderRadius: borderRadius.lg, paddingHorizontal: spacing.md, paddingVertical: spacing.sm, fontSize: rf(14), minHeight: rf(44) },
  unitCard: { borderWidth: 1, borderRadius: borderRadius.xl, padding: spacing.md, gap: spacing.sm },
  unitCardTopRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: spacing.sm },
  unitPill: { flexDirection: "row", alignItems: "center", gap: spacing.xs, alignSelf: "flex-start", borderWidth: 1, borderRadius: borderRadius.pill, paddingHorizontal: spacing.sm, paddingVertical: spacing.xs },
  unitPillText: { fontSize: rf(10), fontWeight: "800" },
  unitActionPill: { borderWidth: 1, borderRadius: borderRadius.pill, paddingHorizontal: spacing.md, paddingVertical: spacing.xs },
  unitActionText: { fontSize: rf(11), fontWeight: "800" },
  unitTitle: { fontSize: rf(17), fontWeight: "800" },
  unitAccent: { fontSize: rf(18), fontWeight: "900" },
  unitCode: { fontSize: rf(14), fontWeight: "800" },
  unitMeta: { fontSize: rf(13), lineHeight: rf(18) },
  unitOwner: { fontSize: rf(12), lineHeight: rf(18) },
  emptyBlock: { borderWidth: 1, borderRadius: borderRadius.xl, padding: spacing.xl, alignItems: "center", gap: spacing.md },
  emptyTitle: { fontSize: rf(16), fontWeight: "800" },
  emptyMsg: { fontSize: rf(13), textAlign: "center", lineHeight: rf(19) },
  noAssocBlock: { borderWidth: 1, borderRadius: borderRadius.xl, padding: spacing.xxl, alignItems: "center", gap: spacing.lg },
  noAssocTitle: { fontSize: rf(18), fontWeight: "800", textAlign: "center" },
  noAssocMsg: { fontSize: rf(14), textAlign: "center", lineHeight: rf(20) },
  createAssocBtn: { flexDirection: "row", alignItems: "center", gap: spacing.sm, borderRadius: borderRadius.xl, paddingHorizontal: spacing.xl, paddingVertical: spacing.md },
  createAssocBtnText: { fontSize: rf(15), fontWeight: "800" },
  formCard: { borderWidth: 1, borderRadius: borderRadius.xl, padding: spacing.lg, gap: spacing.md },
  formTitle: { fontSize: rf(16), fontWeight: "800" },
  fieldWrap: { gap: spacing.xs },
  label: { fontSize: rf(12), fontWeight: "700", textTransform: "uppercase", letterSpacing: 0.5 },
  input: { borderWidth: 1, borderRadius: borderRadius.lg, paddingHorizontal: spacing.md, paddingVertical: spacing.sm, fontSize: rf(14), minHeight: rf(44) },
  formActions: { flexDirection: "row", gap: spacing.sm, marginTop: spacing.xs },
  cancelBtn: { flex: 1, borderWidth: 1, borderRadius: borderRadius.lg, minHeight: rf(44), alignItems: "center", justifyContent: "center" },
  cancelBtnText: { fontSize: rf(14), fontWeight: "700" },
  confirmBtn: { flex: 1, borderRadius: borderRadius.lg, minHeight: rf(44), alignItems: "center", justifyContent: "center" },
  confirmBtnText: { fontSize: rf(14), fontWeight: "800" },
});