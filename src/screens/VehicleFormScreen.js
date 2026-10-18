import { Ionicons } from "@expo/vector-icons";
import { createRef, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import WorkshopScreenHeader from "../components/common/WorkshopScreenHeader";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { useVehicleOwner } from "../hooks/useVehicleOwner";
import {
  createVehicle,
  deleteVehicle,
  updateMyVehicle,
  updateVehicle,
} from "../services/vehicles/vehicleService";
import { borderRadius, rf, spacing } from "../utils/responsive";
import {
  buildVehicleDraft,
  buildVehiclePayload,
  validateVehicleSubmission,
} from "../utils/vehicleForm";
import OwnerSummaryCard from "./vehicleForm/OwnerSummaryCard";
import VehicleFormSection from "./vehicleForm/VehicleFormSection";
import { VEHICLE_FIELD_COUNT, VEHICLE_SECTIONS } from "./vehicleForm/fields";

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
  const vehicleId = initialVehicle?.id || "";
  const isEditing = Boolean(vehicleId);
  const isOwnerSelfService = currentRole === "owner";

  const {
    propietarios,
    selectedId: selectedPropietarioId,
    loading,
  } = useVehicleOwner({
    isOwnerSelfService,
    initialPropietario,
    initialVehicle,
    token,
    associationId: asociacionId,
  });
  const [draft, setDraft] = useState(() => buildVehicleDraft(initialVehicle));
  const [submitting, setSubmitting] = useState(false);
  const scrollRef = useRef(null);
  const inputRefs = useMemo(
    () => Array.from({ length: VEHICLE_FIELD_COUNT }, () => createRef()),
    [],
  );

  const scrollToY = (y) => {
    scrollRef.current?.scrollTo({
      y: Math.max(y - spacing.lg, 0),
      animated: true,
    });
  };

  const handleChange = (key, value) =>
    setDraft((current) => ({ ...current, [key]: value }));

  const handleSubmit = async () => {
    const problem = validateVehicleSubmission({
      draft,
      isOwnerSelfService,
      isEditing,
      propietarioId: selectedPropietarioId,
      asociacionId,
    });
    if (problem) {
      Alert.alert(problem.title, problem.message);
      return;
    }

    setSubmitting(true);
    try {
      const payload = buildVehiclePayload(draft, selectedPropietarioId);
      if (!isEditing) {
        await createVehicle(token, asociacionId, payload);
      } else if (isOwnerSelfService) {
        await updateMyVehicle(token, asociacionId, vehicleId, payload);
      } else {
        await updateVehicle(token, asociacionId, vehicleId, payload);
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
    if (!isEditing) return;

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
              await deleteVehicle(token, asociacionId, vehicleId);
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

  let startIndex = 0;

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

          <OwnerSummaryCard
            loading={loading}
            propietarios={propietarios}
            selectedId={selectedPropietarioId}
          />

          {VEHICLE_SECTIONS.map((section) => {
            const sectionStart = startIndex;
            startIndex += section.fields.length;
            return (
              <VehicleFormSection
                key={section.title}
                section={section}
                startIndex={sectionStart}
                inputRefs={inputRefs}
                draft={draft}
                onChange={handleChange}
                onFocusScroll={scrollToY}
              />
            );
          })}

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
