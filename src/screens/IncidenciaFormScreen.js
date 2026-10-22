import { Ionicons } from "@expo/vector-icons";
import { useEffect, useRef, useState } from "react";
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
import PhotoAttachment from "../components/common/PhotoAttachment";
import WorkshopScreenHeader from "../components/common/WorkshopScreenHeader";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { deletePhoto } from "../services/media/photoFiles";
import { KINDS, newRequestId } from "../services/offline/outbox";
import { submitRecord } from "../services/offline/submitRecord";
import { listVehiclesWithCache } from "../services/vehicles/vehicleService";
import {
  DESCRIPCION_MAX,
  INCIDENCIA_TIPOS,
  LUGAR_MAX,
  MAX_INCIDENCIA_PHOTOS,
  buildIncidenciaPayload,
  validateIncidenciaDraft,
} from "../utils/incidencias";
import { borderRadius, rf, spacing } from "../utils/responsive";

export default function IncidenciaFormScreen({ initialUnit, onBack, onSaved }) {
  const { colors } = useTheme();
  const { token, activeAssociation, authUser } = useAuth();
  const asociacionId = activeAssociation?.id;
  const [units, setUnits] = useState([]);
  const [unitsFromCache, setUnitsFromCache] = useState(false);
  const [loadingUnits, setLoadingUnits] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [tipo, setTipo] = useState("");
  const [unidadId, setUnidadId] = useState(initialUnit?.id || null);
  const [descripcion, setDescripcion] = useState("");
  const [lugar, setLugar] = useState("");
  const [photos, setPhotos] = useState([]);
  const photosRef = useRef(photos);
  const handedOffRef = useRef(false);

  useEffect(() => {
    photosRef.current = photos;
  }, [photos]);

  // Si el usuario sale sin guardar, las fotos preparadas no deben quedar huerfanas.
  useEffect(
    () => () => {
      if (!handedOffRef.current) {
        photosRef.current.forEach((photo) => deletePhoto(photo.path));
      }
    },
    [],
  );

  useEffect(() => {
    if (!asociacionId) {
      setLoadingUnits(false);
      return undefined;
    }
    let cancelled = false;
    (async () => {
      try {
        const { units: data, fromCache } = await listVehiclesWithCache(
          token,
          asociacionId,
        );
        if (cancelled) return;
        setUnits(data);
        setUnitsFromCache(fromCache);
      } catch {
        // La unidad es opcional: sin lista se puede registrar igual.
      } finally {
        if (!cancelled) setLoadingUnits(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [asociacionId, token]);

  const handleSubmit = async () => {
    if (!asociacionId) {
      Alert.alert("Incidencia", "No hay una asociación activa.");
      return;
    }
    const problem = validateIncidenciaDraft({ tipo, descripcion, lugar });
    if (problem) {
      Alert.alert("Datos incompletos", problem);
      return;
    }

    setSubmitting(true);
    try {
      // Las fotos pasan a ser responsabilidad del envio (o de la bandeja).
      handedOffRef.current = true;
      // El id y la hora se fijan ahora: si hay que reenviar, la API no la
      // duplica y conserva la hora real del evento.
      const result = await submitRecord({
        kind: KINDS.INCIDENCIA,
        token,
        userId: authUser?.id,
        id: newRequestId(),
        payload: buildIncidenciaPayload({
          asociacionId,
          unidadId,
          tipo,
          descripcion,
          lugar,
        }),
        capturedAt: new Date().toISOString(),
        photos,
        fallbackMessage: "No se pudo guardar la incidencia.",
      });

      if (result.outcome === "rejected") {
        handedOffRef.current = false;
        Alert.alert("Error", result.message);
      } else if (result.outcome === "sent") {
        Alert.alert(
          "Incidencia registrada",
          result.photosRejected > 0
            ? "La incidencia fue guardada, pero el servidor no aceptó alguna foto."
            : "La incidencia fue guardada correctamente.",
        );
        onSaved?.();
      } else {
        Alert.alert(
          "Guardada en el teléfono",
          result.outcome === "photo_queued"
            ? "La incidencia se envió, pero algunas fotos quedaron guardadas y se subirán automáticamente cuando haya conexión."
            : "No se pudo enviar ahora. La incidencia quedó guardada y se enviará automáticamente cuando haya conexión.",
        );
        onSaved?.();
      }
    } catch (error) {
      handedOffRef.current = false;
      Alert.alert(
        "Error",
        error?.message || "No se pudo guardar la incidencia.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  const card = [
    styles.formCard,
    { backgroundColor: colors.cardBackground, borderColor: colors.border },
  ];
  const label = [styles.sectionLabel, { color: colors.textSecondary }];
  const input = [
    styles.input,
    {
      backgroundColor: colors.inputBackground,
      borderColor: colors.border,
      color: colors.text,
    },
  ];

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={styles.container}
          keyboardShouldPersistTaps="handled"
        >
          <WorkshopScreenHeader
            onBack={onBack}
            section="Control"
            title="Registrar incidencia"
            subtitle={activeAssociation?.nombre || "Sin asociación activa"}
          />

          <View style={card}>
            <Text style={label}>Tipo de incidencia</Text>
            <View style={styles.chipWrap}>
              {INCIDENCIA_TIPOS.map((item) => {
                const selected = item.value === tipo;
                return (
                  <Pressable
                    key={item.value}
                    onPress={() => setTipo(item.value)}
                    style={[
                      styles.chip,
                      {
                        backgroundColor: selected
                          ? colors.primary
                          : colors.cardMuted,
                        borderColor: selected ? colors.primary : colors.border,
                      },
                    ]}
                  >
                    <Ionicons
                      name={item.icon}
                      size={rf(15)}
                      color={selected ? colors.white : colors.primary}
                    />
                    <Text
                      style={[
                        styles.chipText,
                        { color: selected ? colors.white : colors.text },
                      ]}
                    >
                      {item.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          <View style={card}>
            <Text style={label}>Unidad (opcional)</Text>
            {unitsFromCache ? (
              <Text style={[styles.help, { color: colors.warning }]}>
                Sin conexión: se muestran las unidades guardadas la última vez.
              </Text>
            ) : null}
            {loadingUnits ? (
              <ActivityIndicator color={colors.primary} size="small" />
            ) : (
              <View style={styles.chipWrap}>
                {[{ id: null, label: "Sin unidad" }, ...units].map((unit) => {
                  const selected = String(unit.id) === String(unidadId);
                  return (
                    <Pressable
                      key={String(unit.id)}
                      onPress={() => setUnidadId(unit.id)}
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
                        {unit.label || `U-${unit.numero_unidad || unit.id}`}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            )}
          </View>

          <View style={card}>
            <Text style={label}>Detalle</Text>
            <View style={styles.fieldWrap}>
              <Text
                style={[styles.fieldLabel, { color: colors.textSecondary }]}
              >
                Descripción
              </Text>
              <TextInput
                value={descripcion}
                onChangeText={setDescripcion}
                placeholder="¿Qué ocurrió?"
                placeholderTextColor={colors.textTertiary}
                multiline
                maxLength={DESCRIPCION_MAX}
                textAlignVertical="top"
                style={[input, styles.multiline]}
              />
            </View>
            <View style={styles.fieldWrap}>
              <Text
                style={[styles.fieldLabel, { color: colors.textSecondary }]}
              >
                Lugar (opcional)
              </Text>
              <TextInput
                value={lugar}
                onChangeText={setLugar}
                placeholder="Dónde ocurrió"
                placeholderTextColor={colors.textTertiary}
                maxLength={LUGAR_MAX}
                autoCapitalize="sentences"
                style={input}
              />
            </View>
          </View>

          <View style={card}>
            <PhotoAttachment
              photos={photos}
              onChange={setPhotos}
              max={MAX_INCIDENCIA_PHOTOS}
              label="Fotos de evidencia"
              hint={`Hasta ${MAX_INCIDENCIA_PHOTOS} fotos, desde la cámara o la galería.`}
              disabled={submitting}
            />
          </View>

          <Pressable
            onPress={handleSubmit}
            disabled={submitting}
            style={[
              styles.submitBtn,
              { backgroundColor: submitting ? colors.border : colors.accent },
            ]}
          >
            {submitting ? (
              <ActivityIndicator color={colors.white} size="small" />
            ) : (
              <>
                <Ionicons
                  name="checkmark-circle-outline"
                  size={rf(18)}
                  color={colors.white}
                />
                <Text style={[styles.submitText, { color: colors.white }]}>
                  Guardar incidencia
                </Text>
              </>
            )}
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
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
  formCard: {
    borderWidth: 1,
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    gap: spacing.md,
  },
  sectionLabel: {
    fontSize: rf(11),
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.6,
  },
  help: { fontSize: rf(12), fontWeight: "600" },
  chipWrap: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    borderWidth: 1,
    borderRadius: borderRadius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  chipText: { fontSize: rf(12), fontWeight: "800" },
  fieldWrap: { gap: spacing.xs },
  fieldLabel: {
    fontSize: rf(12),
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  input: {
    borderWidth: 1,
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    fontSize: rf(14),
    minHeight: rf(44),
  },
  multiline: { minHeight: rf(110) },
  submitBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    borderRadius: borderRadius.xl,
    minHeight: rf(52),
    paddingHorizontal: spacing.lg,
  },
  submitText: { fontSize: rf(15), fontWeight: "800" },
});
