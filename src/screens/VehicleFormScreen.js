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
import WorkshopScreenHeader from "../components/common/WorkshopScreenHeader";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { listPropietarios } from "../services/propietarios/propietarioService";
import {
  createVehicle,
  deleteVehicle,
  updateMyVehicle,
  updateVehicle,
} from "../services/vehicles/vehicleService";
import { borderRadius, rf, spacing } from "../utils/responsive";

function getVehicleId(vehicle) {
  return vehicle?.id || "";
}

export default function VehicleFormScreen({
  currentRole,
  initialPropietario,
  initialVehicle,
  onBack,
  onSaved,
}) {
  const { colors } = useTheme();
  const { token, activeAssociation } = useAuth();
  const asociacionId = activeAssociation?.id;
  const isEditing = Boolean(getVehicleId(initialVehicle));
  const isOwnerSelfService = currentRole === "owner";

  const [propietarios, setPropietarios] = useState([]);
  const [selectedPropietarioId, setSelectedPropietarioId] = useState(
    initialVehicle?.propietario_id ||
      initialPropietario?.id ||
      initialPropietario?.membresia_id ||
      null,
  );
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);

  const [placa, setPlaca] = useState(initialVehicle?.placa || "");
  const [marca, setMarca] = useState(initialVehicle?.marca || "");
  const [modelo, setModelo] = useState(initialVehicle?.modelo || "");
  const [ano, setAno] = useState(
    initialVehicle?.ano ? String(initialVehicle.ano) : "",
  );
  const [color, setColor] = useState(initialVehicle?.color || "");
  const [numeroCilindros, setNumeroCilindros] = useState(
    initialVehicle?.numero_cilindros
      ? String(initialVehicle.numero_cilindros)
      : "",
  );
  const [peso, setPeso] = useState(initialVehicle?.peso || "");
  const [serialCarroceria, setSerialCarroceria] = useState(
    initialVehicle?.serial_carroceria || "",
  );
  const [serialMotor, setSerialMotor] = useState(
    initialVehicle?.serial_motor || "",
  );
  const [capacidad, setCapacidad] = useState(initialVehicle?.capacidad || "");
  const [fechaEmision, setFechaEmision] = useState(
    initialVehicle?.fecha_emision
      ? String(initialVehicle.fecha_emision).slice(0, 10)
      : "",
  );
  const [numeroPolizaRcv, setNumeroPolizaRcv] = useState(
    initialVehicle?.numero_poliza_rcv || "",
  );
  const [chofer, setChofer] = useState(initialVehicle?.chofer || "");
  const [numeroUnidad, setNumeroUnidad] = useState(
    initialVehicle?.numero_unidad ? String(initialVehicle.numero_unidad) : "",
  );
  const [numeroPuestos, setNumeroPuestos] = useState(
    initialVehicle?.numero_puestos ? String(initialVehicle.numero_puestos) : "",
  );
  const scrollRef = useRef(null);
  const numeroUnidadRef = useRef(null);
  const numeroPuestosRef = useRef(null);
  const marcaRef = useRef(null);
  const modeloRef = useRef(null);
  const anoRef = useRef(null);
  const colorRef = useRef(null);
  const numeroCilindrosRef = useRef(null);
  const pesoRef = useRef(null);
  const serialCarroceriaRef = useRef(null);
  const serialMotorRef = useRef(null);
  const capacidadRef = useRef(null);
  const fechaEmisionRef = useRef(null);
  const numeroPolizaRcvRef = useRef(null);
  const choferRef = useRef(null);

  const scrollToY = (y) => {
    scrollRef.current?.scrollTo({
      y: Math.max(y - spacing.lg, 0),
      animated: true,
    });
  };

  useEffect(() => {
    if (isOwnerSelfService) {
      const owner = initialPropietario || null;
      setPropietarios(owner ? [owner] : []);
      setSelectedPropietarioId(owner?.id || owner?.membresia_id || null);
      setLoading(false);
      return;
    }

    if (!asociacionId) {
      setLoading(false);
      return;
    }
    const load = async () => {
      setLoading(true);
      try {
        const data = await listPropietarios(token, asociacionId);
        setPropietarios(data);
        setSelectedPropietarioId((current) => {
          if (current) return current;
          if (initialPropietario?.id) return initialPropietario.id;
          if (initialPropietario?.membresia_id)
            return initialPropietario.membresia_id;
          return data[0]?.id || data[0]?.membresia_id || null;
        });
      } catch {
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [asociacionId, initialPropietario, isOwnerSelfService, token]);

  const handleSubmit = async () => {
    if (isOwnerSelfService && !isEditing) {
      Alert.alert(
        "Unidades",
        "Desde este perfil solo puedes editar unidades ya asociadas a tu usuario.",
      );
      return;
    }

    if (!placa.trim() || !numeroUnidad.trim()) {
      Alert.alert(
        "Datos incompletos",
        "Placa y numero de unidad son obligatorios.",
      );
      return;
    }
    if (!selectedPropietarioId) {
      Alert.alert("Sin propietario", "Asigna un propietario a la unidad.");
      return;
    }
    if (!asociacionId) {
      Alert.alert("Sin asociacion", "Selecciona una asociacion activa.");
      return;
    }
    setSubmitting(true);
    try {
      const payload = {
        propietario_id: Number(selectedPropietarioId),
        placa: placa.trim().toUpperCase(),
        marca: marca.trim(),
        modelo: modelo.trim(),
        ano: ano ? Number(ano) : undefined,
        color: color.trim(),
        numero_cilindros: numeroCilindros ? Number(numeroCilindros) : undefined,
        peso: peso.trim(),
        serial_carroceria: serialCarroceria.trim(),
        serial_motor: serialMotor.trim(),
        capacidad: capacidad.trim(),
        fecha_emision: fechaEmision.trim() || undefined,
        numero_poliza_rcv: numeroPolizaRcv.trim(),
        chofer: chofer.trim(),
        numero_unidad: numeroUnidad.trim(),
        numero_puestos: numeroPuestos ? Number(numeroPuestos) : undefined,
      };
      if (isEditing) {
        if (isOwnerSelfService) {
          await updateMyVehicle(
            token,
            asociacionId,
            getVehicleId(initialVehicle),
            payload,
          );
        } else {
          await updateVehicle(
            token,
            asociacionId,
            getVehicleId(initialVehicle),
            payload,
          );
        }
      } else {
        await createVehicle(token, asociacionId, payload);
      }
      onSaved?.();
    } catch (error) {
      Alert.alert(
        isEditing ? "Error al actualizar" : "Error al crear",
        error?.message || "No se pudo completar la operacion.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = () => {
    if (!isEditing || !initialVehicle?.id) return;

    Alert.alert(
      "Eliminar unidad",
      "La unidad se eliminará de la asociación activa.",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Eliminar",
          style: "destructive",
          onPress: async () => {
            setSubmitting(true);
            try {
              await deleteVehicle(token, asociacionId, initialVehicle.id);
              onSaved?.();
            } catch (error) {
              Alert.alert(
                "Error al eliminar",
                error?.message || "No se pudo eliminar la unidad.",
              );
            } finally {
              setSubmitting(false);
            }
          },
        },
      ],
    );
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView
          ref={scrollRef}
          contentContainerStyle={styles.container}
          keyboardShouldPersistTaps="handled"
        >
          <WorkshopScreenHeader
            onBack={onBack}
            section="Unidades"
            title={isEditing ? "Editar unidad" : "Nueva unidad"}
            subtitle={
              activeAssociation
                ? activeAssociation.nombre
                : "Sin asociacion activa"
            }
          />

          <View
            style={[
              styles.sectionCard,
              {
                backgroundColor: colors.cardBackground,
                borderColor: colors.border,
              },
            ]}
          >
            <Text
              style={[styles.sectionLabel, { color: colors.textSecondary }]}
            >
              Propietario *
            </Text>
            {loading ? (
              <ActivityIndicator color={colors.primary} size="small" />
            ) : propietarios.length ? (
              (() => {
                const selectedOwner = propietarios.find(
                  (p) =>
                    String(p.id || p.membresia_id) ===
                    String(selectedPropietarioId),
                );
                const owner = selectedOwner || propietarios[0];
                const fullName = [owner?.nombre, owner?.apellido]
                  .filter(Boolean)
                  .join(" ");
                return (
                  <View
                    style={[
                      styles.ownerOption,
                      {
                        backgroundColor: colors.cardMuted,
                        borderColor: colors.border,
                      },
                    ]}
                  >
                    <Text style={[styles.ownerText, { color: colors.text }]}>
                      {fullName || "Propietario sin nombre"}
                    </Text>
                    <Text
                      style={[
                        styles.ownerMeta,
                        { color: colors.textSecondary },
                      ]}
                    >
                      {owner?.rif_cedula || "Sin cédula"}
                    </Text>
                  </View>
                );
              })()
            ) : (
              <Text
                style={[styles.noOwnersText, { color: colors.textSecondary }]}
              >
                No hay propietarios. Registra uno primero.
              </Text>
            )}
          </View>

          <View
            style={[
              styles.formCard,
              {
                backgroundColor: colors.cardBackground,
                borderColor: colors.border,
              },
            ]}
          >
            <Text
              style={[styles.sectionLabel, { color: colors.textSecondary }]}
            >
              Datos de identificación
            </Text>
            {[
              {
                label: "Placa *",
                value: placa,
                onChange: setPlaca,
                placeholder: "ABC-123",
                autoCapitalize: "characters",
                returnKeyType: "next",
                onFocus: () => scrollToY(280),
                onSubmitEditing: () => numeroUnidadRef.current?.focus(),
              },
              {
                label: "Número de unidad *",
                value: numeroUnidad,
                onChange: setNumeroUnidad,
                placeholder: "001",
                inputRef: numeroUnidadRef,
                returnKeyType: "next",
                onFocus: () => scrollToY(340),
                onSubmitEditing: () => numeroPuestosRef.current?.focus(),
              },
              {
                label: "N° puestos / asientos",
                value: numeroPuestos,
                onChange: setNumeroPuestos,
                placeholder: "0",
                keyboardType: "numeric",
                inputRef: numeroPuestosRef,
                returnKeyType: "next",
                onFocus: () => scrollToY(400),
                onSubmitEditing: () => marcaRef.current?.focus(),
              },
              {
                label: "Marca",
                value: marca,
                onChange: setMarca,
                placeholder: "Toyota",
                autoCapitalize: "words",
                inputRef: marcaRef,
                returnKeyType: "next",
                onFocus: () => scrollToY(460),
                onSubmitEditing: () => modeloRef.current?.focus(),
              },
              {
                label: "Modelo",
                value: modelo,
                onChange: setModelo,
                placeholder: "Corolla",
                autoCapitalize: "words",
                inputRef: modeloRef,
                returnKeyType: "next",
                onFocus: () => scrollToY(520),
                onSubmitEditing: () => anoRef.current?.focus(),
              },
              {
                label: "Ano",
                value: ano,
                onChange: setAno,
                placeholder: "2020",
                keyboardType: "numeric",
                inputRef: anoRef,
                returnKeyType: "next",
                onFocus: () => scrollToY(580),
                onSubmitEditing: () => colorRef.current?.focus(),
              },
              {
                label: "Color",
                value: color,
                onChange: setColor,
                placeholder: "Blanco",
                autoCapitalize: "words",
                inputRef: colorRef,
                returnKeyType: "next",
                onFocus: () => scrollToY(640),
                onSubmitEditing: () => numeroCilindrosRef.current?.focus(),
              },
            ].map(({ label, value, onChange, inputRef, ...props }) => (
              <View key={label} style={styles.fieldWrap}>
                <Text style={[styles.label, { color: colors.textSecondary }]}>
                  {label}
                </Text>
                <TextInput
                  ref={inputRef}
                  value={value}
                  onChangeText={onChange}
                  placeholderTextColor={colors.textTertiary}
                  style={[
                    styles.input,
                    {
                      backgroundColor: colors.inputBackground,
                      borderColor: colors.border,
                      color: colors.text,
                    },
                  ]}
                  {...props}
                />
              </View>
            ))}
          </View>

          <View
            style={[
              styles.formCard,
              {
                backgroundColor: colors.cardBackground,
                borderColor: colors.border,
              },
            ]}
          >
            <Text
              style={[styles.sectionLabel, { color: colors.textSecondary }]}
            >
              Datos técnicos
            </Text>
            {[
              {
                label: "N° cilindros",
                value: numeroCilindros,
                onChange: setNumeroCilindros,
                placeholder: "4",
                keyboardType: "numeric",
                inputRef: numeroCilindrosRef,
                returnKeyType: "next",
                onFocus: () => scrollToY(760),
                onSubmitEditing: () => pesoRef.current?.focus(),
              },
              {
                label: "Peso",
                value: peso,
                onChange: setPeso,
                placeholder: "1200 kg",
                inputRef: pesoRef,
                returnKeyType: "next",
                onFocus: () => scrollToY(820),
                onSubmitEditing: () => serialCarroceriaRef.current?.focus(),
              },
              {
                label: "Serial de carrocería",
                value: serialCarroceria,
                onChange: setSerialCarroceria,
                placeholder: "1HGCM826...",
                autoCapitalize: "characters",
                inputRef: serialCarroceriaRef,
                returnKeyType: "next",
                onFocus: () => scrollToY(880),
                onSubmitEditing: () => serialMotorRef.current?.focus(),
              },
              {
                label: "Serial de motor",
                value: serialMotor,
                onChange: setSerialMotor,
                placeholder: "B20B...",
                autoCapitalize: "characters",
                inputRef: serialMotorRef,
                returnKeyType: "next",
                onFocus: () => scrollToY(940),
                onSubmitEditing: () => capacidadRef.current?.focus(),
              },
              {
                label: "Capacidad",
                value: capacidad,
                onChange: setCapacidad,
                placeholder: "Capacidad",
                inputRef: capacidadRef,
                returnKeyType: "next",
                onFocus: () => scrollToY(1000),
                onSubmitEditing: () => fechaEmisionRef.current?.focus(),
              },
            ].map(({ label, value, onChange, inputRef, ...props }) => (
              <View key={label} style={styles.fieldWrap}>
                <Text style={[styles.label, { color: colors.textSecondary }]}>
                  {label}
                </Text>
                <TextInput
                  ref={inputRef}
                  value={value}
                  onChangeText={onChange}
                  placeholderTextColor={colors.textTertiary}
                  style={[
                    styles.input,
                    {
                      backgroundColor: colors.inputBackground,
                      borderColor: colors.border,
                      color: colors.text,
                    },
                  ]}
                  {...props}
                />
              </View>
            ))}
          </View>

          <View
            style={[
              styles.formCard,
              {
                backgroundColor: colors.cardBackground,
                borderColor: colors.border,
              },
            ]}
          >
            <Text
              style={[styles.sectionLabel, { color: colors.textSecondary }]}
            >
              Documentos y responsable
            </Text>
            {[
              {
                label: "Fecha de emisión (AAAA-MM-DD)",
                value: fechaEmision,
                onChange: setFechaEmision,
                placeholder: "2024-01-15",
                keyboardType: "numeric",
                inputRef: fechaEmisionRef,
                returnKeyType: "next",
                onFocus: () => scrollToY(1120),
                onSubmitEditing: () => numeroPolizaRcvRef.current?.focus(),
              },
              {
                label: "N° póliza RCV",
                value: numeroPolizaRcv,
                onChange: setNumeroPolizaRcv,
                placeholder: "RCV-000000",
                autoCapitalize: "characters",
                inputRef: numeroPolizaRcvRef,
                returnKeyType: "next",
                onFocus: () => scrollToY(1180),
                onSubmitEditing: () => choferRef.current?.focus(),
              },
              {
                label: "Chofer habitual",
                value: chofer,
                onChange: setChofer,
                placeholder: "Nombre del chofer",
                autoCapitalize: "words",
                inputRef: choferRef,
                returnKeyType: "done",
                onFocus: () => scrollToY(1240),
              },
            ].map(({ label, value, onChange, inputRef, ...props }) => (
              <View key={label} style={styles.fieldWrap}>
                <Text style={[styles.label, { color: colors.textSecondary }]}>
                  {label}
                </Text>
                <TextInput
                  ref={inputRef}
                  value={value}
                  onChangeText={onChange}
                  placeholderTextColor={colors.textTertiary}
                  style={[
                    styles.input,
                    {
                      backgroundColor: colors.inputBackground,
                      borderColor: colors.border,
                      color: colors.text,
                    },
                  ]}
                  {...props}
                />
              </View>
            ))}
          </View>

          <Pressable
            onPress={handleSubmit}
            disabled={submitting}
            style={[
              styles.submitBtn,
              { backgroundColor: submitting ? colors.border : colors.primary },
            ]}
          >
            {submitting ? (
              <ActivityIndicator color={colors.white} size="small" />
            ) : (
              <>
                <Ionicons
                  name={isEditing ? "save-outline" : "car-outline"}
                  size={rf(18)}
                  color={colors.white}
                />
                <Text style={[styles.submitText, { color: colors.white }]}>
                  {isEditing ? "Guardar cambios" : "Crear unidad"}
                </Text>
              </>
            )}
          </Pressable>

          {isEditing && !isOwnerSelfService ? (
            <Pressable
              onPress={handleDelete}
              disabled={submitting}
              style={[styles.deleteBtn, { borderColor: colors.danger }]}
            >
              <Ionicons
                name="trash-outline"
                size={rf(18)}
                color={colors.danger}
              />
              <Text style={[styles.deleteBtnText, { color: colors.danger }]}>
                Eliminar unidad
              </Text>
            </Pressable>
          ) : null}
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
  sectionCard: {
    borderWidth: 1,
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    gap: spacing.sm,
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
    marginBottom: spacing.xs,
  },
  ownerOption: {
    borderWidth: 1,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    gap: spacing.xs / 2,
  },
  ownerText: { fontSize: rf(14), fontWeight: "700" },
  ownerMeta: { fontSize: rf(12) },
  noOwnersText: { fontSize: rf(13), lineHeight: rf(19) },
  fieldWrap: { gap: spacing.xs },
  label: {
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
  deleteBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    borderWidth: 1,
    borderRadius: borderRadius.xl,
    minHeight: rf(48),
    paddingHorizontal: spacing.lg,
  },
  deleteBtnText: { fontSize: rf(14), fontWeight: "800" },
});
