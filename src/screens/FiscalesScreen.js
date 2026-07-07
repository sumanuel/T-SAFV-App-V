import { Ionicons } from "@expo/vector-icons";
import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
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
import { listFiscales } from "../services/fiscales/fiscalService";
import { borderRadius, rf, spacing } from "../utils/responsive";

function getEntityId(entity) {
  return entity?.membresia_id || entity?.id || "";
}

export default function FiscalesScreen({
  onBack,
  onOpenFiscalForm,
  currentRole,
  userProfile,
}) {
  const { colors } = useTheme();
  const { token, activeAssociation } = useAuth();
  const [fiscales, setFiscales] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const asociacionId = activeAssociation?.id;

  const filtered = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return fiscales.filter((f) => {
      if (!q) return true;
      const text = [f.rif_cedula, f.nombre, f.apellido, f.email]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return text.includes(q);
    });
  }, [fiscales, searchQuery]);

  const refreshFiscales = async () => {
    if (!asociacionId) return;
    setLoading(true);
    try {
      const data = await listFiscales(token, asociacionId);
      setFiscales(data);
    } catch {
      Alert.alert("Fiscales", "No se pudo cargar el directorio de fiscales.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshFiscales();
  }, [asociacionId]);

  if (!asociacionId) {
    return (
      <SafeAreaView
        style={[styles.safe, { backgroundColor: colors.background }]}
      >
        <ScrollView contentContainerStyle={styles.container}>
          <WorkshopScreenHeader
            onBack={onBack}
            section="Control"
            title="Fiscales"
            subtitle="Fiscales disponibles en la asociacion activa."
          />
          <View
            style={[
              styles.emptyBlock,
              {
                backgroundColor: colors.cardBackground,
                borderColor: colors.border,
              },
            ]}
          >
            <Ionicons
              name="shield-checkmark-outline"
              size={rf(32)}
              color={colors.textTertiary}
            />
            <Text style={[styles.emptyTitle, { color: colors.text }]}>
              Sin asociacion activa
            </Text>
            <Text style={[styles.emptyMsg, { color: colors.textSecondary }]}>
              Crea o selecciona una asociacion desde Inicio para ver los
              fiscales disponibles.
            </Text>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.container}>
        <WorkshopScreenHeader
          onBack={onBack}
          section="Control"
          title="Fiscales"
          subtitle="Fiscales disponibles en la asociacion activa."
        />

        <View
          style={[
            styles.controlsPanel,
            {
              backgroundColor: colors.cardBackground,
              borderColor: colors.border,
            },
          ]}
        >
          <TextInput
            autoCapitalize="none"
            onChangeText={setSearchQuery}
            placeholder="Buscar por cedula, nombre o correo"
            placeholderTextColor={colors.textTertiary}
            style={[
              styles.input,
              {
                backgroundColor: colors.inputBackground,
                borderColor: colors.border,
                color: colors.text,
              },
            ]}
            value={searchQuery}
          />
        </View>

        {loading ? (
          <ActivityIndicator
            color={colors.primary}
            style={{ marginTop: spacing.lg }}
          />
        ) : filtered.length ? (
          filtered.map((f) => {
            const fullName = [f.nombre, f.apellido].filter(Boolean).join(" ");
            return (
              <Pressable
                key={getEntityId(f)}
                onPress={() => onOpenFiscalForm?.(f)}
                style={[
                  styles.itemRow,
                  {
                    backgroundColor: colors.cardBackground,
                    borderColor: colors.border,
                  },
                ]}
              >
                <View
                  style={[
                    styles.avatar,
                    { backgroundColor: colors.backgroundAccent },
                  ]}
                >
                  <Ionicons
                    name="shield-checkmark-outline"
                    size={rf(18)}
                    color={colors.accent}
                  />
                </View>
                <View style={styles.itemInfo}>
                  <Text style={[styles.itemName, { color: colors.text }]}>
                    {fullName}
                  </Text>
                  <Text
                    style={[styles.itemMeta, { color: colors.textSecondary }]}
                  >
                    {f.rif_cedula || f.email || "Sin datos adicionales"}
                  </Text>
                  {f.telefono ? (
                    <Text
                      style={[styles.itemPhone, { color: colors.textTertiary }]}
                    >
                      {f.telefono}
                    </Text>
                  ) : null}
                </View>
                <View
                  style={[
                    styles.roleBadge,
                    {
                      backgroundColor: colors.cardMuted,
                      borderColor: colors.border,
                    },
                  ]}
                >
                  <Text style={[styles.roleText, { color: colors.accent }]}>
                    FISCAL
                  </Text>
                </View>
              </Pressable>
            );
          })
        ) : (
          <View
            style={[
              styles.emptyBlock,
              {
                backgroundColor: colors.cardBackground,
                borderColor: colors.border,
              },
            ]}
          >
            <Ionicons
              name="shield-checkmark-outline"
              size={rf(32)}
              color={colors.textTertiary}
            />
            <Text style={[styles.emptyTitle, { color: colors.text }]}>
              Sin fiscales registrados
            </Text>
            <Text style={[styles.emptyMsg, { color: colors.textSecondary }]}>
              Agrega el primer fiscal a la asociacion usando el boton inferior.
            </Text>
          </View>
        )}
      </ScrollView>

      <Pressable
        onPress={() => onOpenFiscalForm?.(null)}
        style={[styles.fab, { backgroundColor: colors.accent }]}
      >
        <Ionicons name="add" size={rf(22)} color={colors.white} />
      </Pressable>
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
  controlsPanel: {
    borderWidth: 1,
    borderRadius: borderRadius.xl,
    padding: spacing.md,
  },
  input: {
    borderWidth: 1,
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    fontSize: rf(14),
    minHeight: rf(44),
  },
  itemRow: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: borderRadius.xl,
    padding: spacing.md,
    gap: spacing.md,
  },
  avatar: {
    width: rf(40),
    height: rf(40),
    borderRadius: borderRadius.pill,
    alignItems: "center",
    justifyContent: "center",
  },
  itemInfo: { flex: 1, gap: spacing.xs / 2 },
  itemName: { fontSize: rf(15), fontWeight: "700" },
  itemMeta: { fontSize: rf(12) },
  itemPhone: { fontSize: rf(11) },
  roleBadge: {
    borderWidth: 1,
    borderRadius: borderRadius.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs / 2,
  },
  roleText: { fontSize: rf(10), fontWeight: "800", letterSpacing: 0.5 },
  emptyBlock: {
    borderWidth: 1,
    borderRadius: borderRadius.xl,
    padding: spacing.xl,
    alignItems: "center",
    gap: spacing.md,
  },
  emptyTitle: { fontSize: rf(16), fontWeight: "800" },
  emptyMsg: { fontSize: rf(13), textAlign: "center", lineHeight: rf(19) },
  fab: {
    position: "absolute",
    bottom: spacing.xl,
    right: spacing.xl,
    width: rf(52),
    height: rf(52),
    borderRadius: borderRadius.pill,
    alignItems: "center",
    justifyContent: "center",
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
});
