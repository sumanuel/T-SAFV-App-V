import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useTheme } from "../../context/ThemeContext";
import { deletePhoto } from "../../services/media/photoFiles";
import { capturePhoto, choosePhoto } from "../../services/media/photoPicker";
import { preparePhoto } from "../../services/media/photoPipeline";
import { newRequestId } from "../../services/offline/outbox";
import { borderRadius, rf, spacing } from "../../utils/responsive";

/**
 * Selector de fotos opcionales (camara o galeria). Comprime cada foto y la deja
 * guardada en el telefono; el padre recibe la lista { path, width, height }.
 */
export default function PhotoAttachment({
  photos,
  onChange,
  max = 1,
  label = "Foto",
  hint,
  disabled = false,
}) {
  const { colors } = useTheme();
  const [busy, setBusy] = useState(false);
  const canAdd = photos.length < max && !disabled;

  const addFrom = async (pick) => {
    setBusy(true);
    try {
      const asset = await pick();
      if (!asset) return;
      const photo = await preparePhoto(asset, newRequestId());
      onChange([...photos, photo]);
    } catch (error) {
      Alert.alert(
        "Foto",
        error?.message || "No se pudo preparar la foto. Intenta de nuevo.",
      );
    } finally {
      setBusy(false);
    }
  };

  const remove = (photo) => {
    deletePhoto(photo.path);
    onChange(photos.filter((item) => item.path !== photo.path));
  };

  return (
    <View style={styles.wrap}>
      <Text style={[styles.label, { color: colors.textSecondary }]}>
        {label} (opcional)
      </Text>
      {hint ? (
        <Text style={[styles.hint, { color: colors.textSecondary }]}>
          {hint}
        </Text>
      ) : null}

      {photos.length ? (
        <View style={styles.thumbRow}>
          {photos.map((photo) => (
            <View key={photo.path} style={styles.thumbWrap}>
              <Image
                source={{ uri: photo.path }}
                style={[styles.thumb, { borderColor: colors.border }]}
                accessibilityLabel="Foto adjunta"
              />
              <Pressable
                onPress={() => remove(photo)}
                disabled={disabled}
                hitSlop={8}
                accessibilityRole="button"
                accessibilityLabel="Quitar foto"
                style={[styles.removeBtn, { backgroundColor: colors.danger }]}
              >
                <Ionicons name="close" size={rf(14)} color={colors.white} />
              </Pressable>
            </View>
          ))}
        </View>
      ) : null}

      {busy ? (
        <View style={styles.busyRow}>
          <ActivityIndicator color={colors.primary} size="small" />
          <Text style={[styles.hint, { color: colors.textSecondary }]}>
            Preparando foto…
          </Text>
        </View>
      ) : canAdd ? (
        <View style={styles.actions}>
          <ActionButton
            colors={colors}
            icon="camera-outline"
            text="Tomar foto"
            onPress={() => addFrom(capturePhoto)}
          />
          <ActionButton
            colors={colors}
            icon="images-outline"
            text="Galería"
            onPress={() => addFrom(choosePhoto)}
          />
        </View>
      ) : null}
    </View>
  );
}

function ActionButton({ colors, icon, text, onPress }) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      style={[
        styles.actionBtn,
        { backgroundColor: colors.cardMuted, borderColor: colors.border },
      ]}
    >
      <Ionicons name={icon} size={rf(18)} color={colors.primary} />
      <Text style={[styles.actionText, { color: colors.text }]}>{text}</Text>
    </Pressable>
  );
}

const THUMB = rf(96);

const styles = StyleSheet.create({
  wrap: { gap: spacing.sm },
  label: {
    fontSize: rf(12),
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  hint: { fontSize: rf(12), lineHeight: rf(17) },
  thumbRow: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
  thumbWrap: { width: THUMB, height: THUMB },
  thumb: {
    width: THUMB,
    height: THUMB,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
  },
  removeBtn: {
    position: "absolute",
    top: -spacing.xs,
    right: -spacing.xs,
    width: rf(24),
    height: rf(24),
    borderRadius: rf(12),
    alignItems: "center",
    justifyContent: "center",
  },
  busyRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  actions: { flexDirection: "row", gap: spacing.sm },
  actionBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.xs,
    borderWidth: 1,
    borderRadius: borderRadius.lg,
    minHeight: rf(44),
    paddingHorizontal: spacing.md,
  },
  actionText: { fontSize: rf(13), fontWeight: "700" },
});
