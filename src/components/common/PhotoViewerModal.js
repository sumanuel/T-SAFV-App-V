import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import {
  ActivityIndicator,
  Image,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTheme } from "../../context/ThemeContext";
import { rf, spacing } from "../../utils/responsive";

// Visor a pantalla completa. `source` es el origen de <Image> (con cabecera de
// autenticacion); null cierra el visor.
export default function PhotoViewerModal({ source, onClose }) {
  const { colors } = useTheme();
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);

  const close = () => {
    setLoading(true);
    setFailed(false);
    onClose();
  };

  return (
    <Modal
      visible={Boolean(source)}
      animationType="fade"
      transparent
      onRequestClose={close}
    >
      <SafeAreaView style={styles.backdrop}>
        <Pressable
          onPress={close}
          accessibilityRole="button"
          accessibilityLabel="Cerrar foto"
          hitSlop={12}
          style={styles.closeBtn}
        >
          <Ionicons name="close" size={rf(26)} color={colors.white} />
        </Pressable>

        <View style={styles.body}>
          {source && !failed ? (
            <Image
              source={source}
              style={styles.image}
              resizeMode="contain"
              onLoadEnd={() => setLoading(false)}
              onError={() => {
                setFailed(true);
                setLoading(false);
              }}
            />
          ) : null}
          {loading && source && !failed ? (
            <ActivityIndicator
              color={colors.white}
              size="large"
              style={StyleSheet.absoluteFill}
            />
          ) : null}
          {failed ? (
            <Text style={[styles.errorText, { color: colors.white }]}>
              No se pudo cargar la foto.
            </Text>
          ) : null}
        </View>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.92)" },
  closeBtn: {
    alignSelf: "flex-end",
    padding: spacing.md,
  },
  body: { flex: 1, alignItems: "center", justifyContent: "center" },
  image: { width: "100%", height: "100%" },
  errorText: { fontSize: rf(14), textAlign: "center", padding: spacing.lg },
});
