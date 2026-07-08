import { Ionicons } from "@expo/vector-icons";
import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
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
import sdk from "../services/api/sdk";
import { listVehicles } from "../services/vehicles/vehicleService";
import { borderRadius, rf, spacing } from "../utils/responsive";

function getUnitLabel(unit) {
  return [unit?.marca, unit?.modelo, unit?.ano].filter(Boolean).join(" ") || "Unidad sin descripción";
}

export default function FiscalRecordFormScreen({ initialUnit, onBack, onSaved }) {
  const { colors } = useTheme();
  const { token, activeAssociation } = useAuth();
  const asociacionId = activeAssociation?.id;
  const [units, setUnits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [selectedUnitId, setSelectedUnitId] = useState(initialUnit?.id || null);
  const [chofer, setChofer] = useState(initialUnit?.ultimo_chofer || initialUnit?.chofer || "");
  const [origen, setOrigen] = useState("");
  const [destino, setDestino] = useState("");
  const [pasajeros, setPasajeros] = useState("");

  useEffect(() => {
    if (!asociacionId) {
      setUnits([]);
      setLoading(false);
      return;
    }

    const load = async () => {
      setLoading(true);
      try {
        const data = await listVehicles(token, asociacionId);
        setUnits(data);
        setSelectedUnitId((current) => current || initialUnit?.id || data[0]?.id || null);
      } catch {
        Alert.alert("Fiscalización", "No se pudieron cargar las unidades activas.");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [asociacionId, initialUnit?.id, token]);

  const selectedUnit = useMemo(
    () => units.find((unit) => String(unit.id) === String(selectedUnitId)) || null,
    [selectedUnitId, units],
  );

  const handleSubmit = async () => {
    if (!asociacionId || !selectedUnitId) {
      Alert.alert("Datos incompletos", "Selecciona una unidad para registrar la fiscalización.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await sdk.createFiscalRecord(token, {
        unidad_id: Number(selectedUnitId),
        asociacion_id: Number(asociacionId),
        chofer: chofer.trim(),
        origen: origen.trim(),
        destino: destino.trim(),
        pasajeros: pasajeros ? Number(pasajeros) : undefined,
      });

      if (res.status === 201 || res.status === 200) {
        Alert.alert("Fiscalización registrada", "La traza operativa fue guardada correctamente.");
        onSaved?.();
      } else {
        Alert.alert("Error", res.data?.message || res.data?.error || "No se pudo guardar la fiscalización.");
      }
    } catch (error) {
      Alert.alert("Error", error?.message || "No se pudo guardar la fiscalización.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.container}>
          <WorkshopScreenHeader
            onBack={onBack}
            section="Fiscalización"
            title="Registrar fiscalización"
            subtitle={activeAssociation?.nombre || "Sin asociación activa"}
          />

          <View style={[styles.formCard, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}> 
            <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>Unidad</Text>
            {loading ? (
              <ActivityIndicator color={colors.primary} size="small" />
            ) : units.length ? (
              <View style={styles.unitChipWrap}>
                {units.map((unit) => {
                  const selected = String(unit.id) === String(selectedUnitId);
                  return (
                    <Pressable
                      key={unit.id}
                      onPress={() => {
                        setSelectedUnitId(unit.id);
                        setChofer(unit.ultimo_chofer || unit.chofer || "");
                      }}
                      style={[
                        styles.unitChip,
                        {
                          backgroundColor: selected ? colors.primary : colors.cardMuted,
                          borderColor: selected ? colors.primary : colors.border,
                        },
                      ]}
                    >
                      <Text style={[styles.unitChipText, { color: selected ? colors.white : colors.text }]}>
                        U-{unit.numero_unidad || unit.id}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            ) : (
              <Text style={[styles.helpText, { color: colors.textSecondary }]}>No hay unidades activas para fiscalizar.</Text>
            )}

            {selectedUnit ? (
              <View style={[styles.unitSummary, { backgroundColor: colors.cardMuted, borderColor: colors.border }]}> 
                <Text style={[styles.unitSummaryTitle, { color: colors.text }]}>{getUnitLabel(selectedUnit)}</Text>
                <Text style={[styles.unitSummaryAccent, { color: colors.accent }]}>Placa: {selectedUnit.placa || "Sin placa"}</Text>
                <Text style={[styles.unitSummaryCode, { color: colors.primary }]}>Unidad N° {selectedUnit.numero_unidad || selectedUnit.id}</Text>
                <Text style={[styles.unitSummaryMeta, { color: colors.textSecondary }]}>Propietario: {[selectedUnit.propietario_nombre, selectedUnit.propietario_apellido].filter(Boolean).join(" ") || "Sin propietario"}</Text>
                <Text style={[styles.unitSummaryMeta, { color: colors.textSecondary }]}>Chofer actual: {selectedUnit.ultimo_chofer || selectedUnit.chofer || "Sin chofer"}</Text>
              </View>
            ) : null}
          </View>

          <View style={[styles.formCard, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}> 
            <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>Datos de fiscalización</Text>
            <Field colors={colors} label="Chofer" value={chofer} onChangeText={setChofer} placeholder="Nombre del chofer" autoCapitalize="words" />
            <Field colors={colors} label="Origen" value={origen} onChangeText={setOrigen} placeholder="Punto de salida" autoCapitalize="sentences" />
            <Field colors={colors} label="Destino" value={destino} onChangeText={setDestino} placeholder="Punto de destino" autoCapitalize="sentences" />
            <Field
              colors={colors}
              label="Pasajeros"
              value={pasajeros}
              onChangeText={(value) => setPasajeros(value.replace(/[^0-9]/g, ""))}
              placeholder="0"
              keyboardType="numeric"
            />
          </View>

          <Pressable onPress={handleSubmit} disabled={submitting || !selectedUnitId} style={[styles.submitBtn, { backgroundColor: submitting ? colors.border : colors.accent }]}> 
            {submitting ? (
              <ActivityIndicator color={colors.white} size="small" />
            ) : (
              <>
                <Ionicons name="checkmark-circle-outline" size={rf(18)} color={colors.white} />
                <Text style={[styles.submitText, { color: colors.white }]}>Guardar fiscalización</Text>
              </>
            )}
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function Field({ colors, label, ...props }) {
  return (
    <View style={styles.fieldWrap}>
      <Text style={[styles.label, { color: colors.textSecondary }]}>{label}</Text>
      <TextInput
        placeholderTextColor={colors.textTertiary}
        style={[styles.input, { backgroundColor: colors.inputBackground, borderColor: colors.border, color: colors.text }]}
        {...props}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  container: { padding: spacing.md, gap: spacing.md, paddingBottom: spacing.xxl * 2 },
  formCard: { borderWidth: 1, borderRadius: borderRadius.xl, padding: spacing.lg, gap: spacing.md },
  sectionLabel: { fontSize: rf(11), fontWeight: "700", textTransform: "uppercase", letterSpacing: 0.6 },
  unitChipWrap: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
  unitChip: { borderWidth: 1, borderRadius: borderRadius.pill, paddingHorizontal: spacing.md, paddingVertical: spacing.sm },
  unitChipText: { fontSize: rf(12), fontWeight: "800" },
  unitSummary: { borderWidth: 1, borderRadius: borderRadius.lg, padding: spacing.md, gap: spacing.xs },
  unitSummaryTitle: { fontSize: rf(16), fontWeight: "800" },
  unitSummaryAccent: { fontSize: rf(16), fontWeight: "900" },
  unitSummaryCode: { fontSize: rf(14), fontWeight: "800" },
  unitSummaryMeta: { fontSize: rf(12), lineHeight: rf(18) },
  helpText: { fontSize: rf(13), lineHeight: rf(19) },
  fieldWrap: { gap: spacing.xs },
  label: { fontSize: rf(12), fontWeight: "700", textTransform: "uppercase", letterSpacing: 0.5 },
  input: { borderWidth: 1, borderRadius: borderRadius.lg, paddingHorizontal: spacing.md, paddingVertical: spacing.sm, fontSize: rf(14), minHeight: rf(44) },
  submitBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: spacing.sm, borderRadius: borderRadius.xl, minHeight: rf(52), paddingHorizontal: spacing.lg },
  submitText: { fontSize: rf(15), fontWeight: "800" },
});