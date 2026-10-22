import { Ionicons } from "@expo/vector-icons";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import PhotoViewerModal from "../components/common/PhotoViewerModal";
import WorkshopScreenHeader from "../components/common/WorkshopScreenHeader";
import { hasPermission } from "../constants/accessControl";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import sdk from "../services/api/sdk";
import {
  INCIDENCIA_ESTADOS,
  getReporterName,
  getTipoIcon,
  getTipoLabel,
  getUnitLabel,
} from "../utils/incidencias";
import { borderRadius, rf, spacing } from "../utils/responsive";
import { formatDateTime } from "../utils/traza";
import EstadoBadge from "./incidencias/EstadoBadge";

export default function IncidenciaDetailScreen({
  incidencia: initial,
  onBack,
  currentRole,
}) {
  const { colors } = useTheme();
  const { token } = useAuth();
  const [incidencia, setIncidencia] = useState(initial);
  const [loading, setLoading] = useState(true);
  const [changing, setChanging] = useState(false);
  const [viewerPhotoId, setViewerPhotoId] = useState(null);
  const canManage = hasPermission(currentRole, "incidents.manage");

  const load = useCallback(async () => {
    try {
      const res = await sdk.getIncidencia(token, initial.id);
      if (res.status === 200 && res.data) setIncidencia(res.data);
    } finally {
      setLoading(false);
    }
  }, [initial.id, token]);

  useEffect(() => {
    load();
  }, [load]);

  const changeEstado = async (estado) => {
    setChanging(true);
    try {
      const res = await sdk.updateIncidenciaEstado(
        token,
        incidencia.id,
        estado,
      );
      if (res.status === 200) {
        setIncidencia((current) => ({ ...current, ...res.data }));
      } else {
        Alert.alert(
          "Incidencia",
          res.data?.message || "No se pudo cambiar el estado.",
        );
      }
    } catch (error) {
      Alert.alert(
        "Incidencia",
        error?.message || "No se pudo cambiar el estado.",
      );
    } finally {
      setChanging(false);
    }
  };

  const photos = (incidencia.adjuntos || []).filter(
    (photo) => !photo.purgado_at,
  );
  const card = [
    styles.card,
    { backgroundColor: colors.cardBackground, borderColor: colors.border },
  ];

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.container}>
        <WorkshopScreenHeader
          onBack={onBack}
          section="Control"
          title="Incidencia"
          subtitle={getTipoLabel(incidencia.tipo)}
        />

        <View style={card}>
          <View style={styles.titleRow}>
            <View style={styles.typeRow}>
              <Ionicons
                name={getTipoIcon(incidencia.tipo)}
                size={rf(20)}
                color={colors.primary}
              />
              <Text style={[styles.type, { color: colors.text }]}>
                {getTipoLabel(incidencia.tipo)}
              </Text>
            </View>
            <EstadoBadge estado={incidencia.estado} />
          </View>
          <Text style={[styles.description, { color: colors.text }]}>
            {incidencia.descripcion}
          </Text>
        </View>

        <View style={card}>
          <Info
            colors={colors}
            label="Unidad"
            value={getUnitLabel(incidencia)}
          />
          {incidencia.lugar ? (
            <Info colors={colors} label="Lugar" value={incidencia.lugar} />
          ) : null}
          <Info
            colors={colors}
            label="Fecha del evento"
            value={formatDateTime(incidencia.fecha_hora_evento)}
          />
          <Info
            colors={colors}
            label="Registrada por"
            value={getReporterName(incidencia)}
          />
        </View>

        <View style={card}>
          <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>
            Fotos
          </Text>
          {loading && !photos.length ? (
            <ActivityIndicator color={colors.primary} size="small" />
          ) : photos.length ? (
            <View style={styles.thumbRow}>
              {photos.map((photo) => (
                <Pressable
                  key={photo.id}
                  onPress={() => setViewerPhotoId(photo.id)}
                  accessibilityRole="button"
                  accessibilityLabel="Ver foto"
                >
                  <Image
                    source={sdk.getAttachmentSource(token, photo.id)}
                    style={[styles.thumb, { borderColor: colors.border }]}
                  />
                </Pressable>
              ))}
            </View>
          ) : (
            <Text style={[styles.empty, { color: colors.textSecondary }]}>
              Esta incidencia no tiene fotos.
            </Text>
          )}
        </View>

        {canManage ? (
          <View style={card}>
            <Text
              style={[styles.sectionLabel, { color: colors.textSecondary }]}
            >
              Cambiar estado
            </Text>
            <View style={styles.chips}>
              {INCIDENCIA_ESTADOS.map((estado) => {
                const selected = estado.value === incidencia.estado;
                return (
                  <Pressable
                    key={estado.value}
                    disabled={selected || changing}
                    onPress={() => changeEstado(estado.value)}
                    style={[
                      styles.chip,
                      {
                        backgroundColor: selected
                          ? colors.primary
                          : colors.cardMuted,
                        borderColor: selected ? colors.primary : colors.border,
                        opacity: changing && !selected ? 0.6 : 1,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.chipText,
                        { color: selected ? colors.white : colors.text },
                      ]}
                    >
                      {estado.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>
        ) : null}
      </ScrollView>

      <PhotoViewerModal
        source={
          viewerPhotoId ? sdk.getAttachmentSource(token, viewerPhotoId) : null
        }
        onClose={() => setViewerPhotoId(null)}
      />
    </SafeAreaView>
  );
}

function Info({ colors, label, value }) {
  return (
    <View style={styles.info}>
      <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>
        {label}
      </Text>
      <Text style={[styles.infoValue, { color: colors.text }]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  container: {
    padding: spacing.md,
    gap: spacing.md,
    paddingBottom: spacing.xxl * 2,
  },
  card: {
    borderWidth: 1,
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    gap: spacing.md,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.sm,
  },
  typeRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  type: { fontSize: rf(16), fontWeight: "800" },
  description: { fontSize: rf(14), lineHeight: rf(21) },
  info: { gap: 2 },
  infoLabel: {
    fontSize: rf(11),
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  infoValue: { fontSize: rf(14) },
  sectionLabel: {
    fontSize: rf(11),
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.6,
  },
  thumbRow: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
  thumb: {
    width: rf(96),
    height: rf(96),
    borderRadius: borderRadius.lg,
    borderWidth: 1,
  },
  empty: { fontSize: rf(13) },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
  chip: {
    borderWidth: 1,
    borderRadius: borderRadius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  chipText: { fontSize: rf(12), fontWeight: "800" },
});
