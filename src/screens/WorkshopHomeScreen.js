import { Ionicons } from "@expo/vector-icons";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
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
import { createAssociation } from "../services/associations/associationService";
import {
  listMyVehicles,
  listVehicles,
} from "../services/vehicles/vehicleService";
import { borderRadius, rf, spacing } from "../utils/responsive";

export default function WorkshopHomeScreen({
  onOpenPropietarios,
  onOpenFiscales,
  onOpenTraza,
  onOpenFiscalRecord,
  currentRole,
  userProfile,
}) {
  const { colors } = useTheme();
  const {
    token,
    associations,
    activeAssociation,
    activeAssociationId,
    pendingInvitation,
    acceptPendingInvitation,
    refreshAssociations,
  } = useAuth();
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newAsocName, setNewAsocName] = useState("");
  const [newAsocRif, setNewAsocRif] = useState("");
  const [newAsocAddress, setNewAsocAddress] = useState("");
  const [newAsocEmail, setNewAsocEmail] = useState("");
  const [newAsocPhones, setNewAsocPhones] = useState("");
  const [newAsocLogoUrl, setNewAsocLogoUrl] = useState("");
  const [newAsocSocialText, setNewAsocSocialText] = useState("");
  const [creating, setCreating] = useState(false);
  const hasAssociation = associations.length > 0;
  const associationCreationAccess = userProfile?.associationCreationAccess;
  const canCreateAssociation = associationCreationAccess?.allowed !== false;
  const canStartTrial = Boolean(associationCreationAccess?.can_start_trial);
  const isFiscalUser = currentRole === "fiscal";
  const isOwnerUser = currentRole === "owner";

  const refreshUnits = async () => {
    if (!activeAssociation?.id) return;
    setLoading(true);
    try {
      const data = isOwnerUser
        ? await listMyVehicles(token, activeAssociation.id)
        : await listVehicles(token, activeAssociation.id);
      setVehicles(data);
    } catch {
      Alert.alert("Unidades", "No se pudo cargar las unidades.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshUnits();
  }, [activeAssociationId]);

  const filtered = vehicles.filter((v) => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return true;
    return [
      v.placa,
      v.numero_unidad,
      v.marca,
      v.modelo,
      v.chofer,
      v.propietario_nombre,
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase()
      .includes(q);
  });

  const handleCreateAssociation = async () => {
    if (
      !newAsocName.trim() ||
      !newAsocRif.trim() ||
      !newAsocAddress.trim() ||
      !newAsocEmail.trim() ||
      !newAsocPhones.trim()
    ) {
      Alert.alert(
        "Datos incompletos",
        "Nombre, RIF, dirección fiscal, correo y teléfonos son obligatorios.",
      );
      return;
    }

    let socialPayload;
    if (newAsocSocialText.trim()) {
      try {
        socialPayload = JSON.parse(newAsocSocialText);
      } catch {
        Alert.alert(
          "Redes sociales inválidas",
          'Si indicas redes sociales, usa un JSON válido. Ejemplo: {"instagram":"@mi_asociacion"}',
        );
        return;
      }
    }

    setCreating(true);
    try {
      await createAssociation(token, {
        nombre: newAsocName,
        rif: newAsocRif,
        direccion_fiscal: newAsocAddress,
        email: newAsocEmail,
        telefonos: newAsocPhones,
        logo_url: newAsocLogoUrl,
        redes_sociales: socialPayload,
      });
      await refreshAssociations();
      setShowCreateForm(false);
      setNewAsocName("");
      setNewAsocRif("");
      setNewAsocAddress("");
      setNewAsocEmail("");
      setNewAsocPhones("");
      setNewAsocLogoUrl("");
      setNewAsocSocialText("");
    } catch (error) {
      Alert.alert("Error", error?.message || "No se pudo crear la asociación.");
    } finally {
      setCreating(false);
    }
  };

  if (!hasAssociation) {
    return (
      <SafeAreaView
        style={[styles.safe, { backgroundColor: colors.background }]}
      >
        <ScrollView contentContainerStyle={styles.container}>
          <WorkshopScreenHeader
            section="Fiscalización"
            title="T-SAFV"
            subtitle="Sistema operativo para control y fiscalización de unidades."
          />
          {!showCreateForm ? (
            <View
              style={[
                styles.noAssocBlock,
                {
                  backgroundColor: colors.cardBackground,
                  borderColor: colors.border,
                },
              ]}
            >
              <Ionicons
                name="business-outline"
                size={rf(40)}
                color={colors.textTertiary}
              />
              <Text style={[styles.noAssocTitle, { color: colors.text }]}>
                Sin asociacion registrada
              </Text>
              <Text
                style={[styles.noAssocMsg, { color: colors.textSecondary }]}
              >
                {associationCreationAccess?.message ||
                  "Para comenzar necesitas crear una asociación. Solo se permite una por cuenta y el acceso depende de pago o período de prueba."}
              </Text>
              {canCreateAssociation ? (
                <Pressable
                  onPress={() => setShowCreateForm(true)}
                  style={[
                    styles.createAssocBtn,
                    { backgroundColor: colors.primary },
                  ]}
                >
                  <Ionicons
                    name={
                      canStartTrial ? "flask-outline" : "add-circle-outline"
                    }
                    size={rf(18)}
                    color={colors.white}
                  />
                  <Text
                    style={[styles.createAssocBtnText, { color: colors.white }]}
                  >
                    {canStartTrial
                      ? "Crear asociación y activar prueba"
                      : "Crear asociación"}
                  </Text>
                </Pressable>
              ) : (
                <View
                  style={[
                    styles.blockedBadge,
                    {
                      backgroundColor: colors.cardMuted,
                      borderColor: colors.border,
                    },
                  ]}
                >
                  <Ionicons
                    name="lock-closed-outline"
                    size={rf(18)}
                    color={colors.warning}
                  />
                  <Text
                    style={[
                      styles.blockedBadgeText,
                      { color: colors.textSecondary },
                    ]}
                  >
                    Creación bloqueada hasta resolver el estado de invitación o
                    licencia.
                  </Text>
                </View>
              )}

              {pendingInvitation ? (
                <Pressable
                  onPress={async () => {
                    try {
                      await acceptPendingInvitation();
                    } catch (error) {
                      Alert.alert(
                        "Invitación",
                        error?.message || "No se pudo aceptar la invitación.",
                      );
                    }
                  }}
                  style={[
                    styles.invitationCard,
                    {
                      backgroundColor: colors.cardMuted,
                      borderColor: colors.border,
                    },
                  ]}
                >
                  <Ionicons
                    name="mail-open-outline"
                    size={rf(18)}
                    color={colors.primary}
                  />
                  <View style={styles.invitationCopy}>
                    <Text
                      style={[styles.invitationTitle, { color: colors.text }]}
                    >
                      Invitación pendiente
                    </Text>
                    <Text
                      style={[
                        styles.invitationText,
                        { color: colors.textSecondary },
                      ]}
                    >
                      Acepta la invitación de{" "}
                      {pendingInvitation.rol_invitado?.toLowerCase?.() ||
                        "miembro"}{" "}
                      para entrar a la asociación asignada.
                    </Text>
                  </View>
                  <Ionicons
                    name="chevron-forward"
                    size={rf(18)}
                    color={colors.textTertiary}
                  />
                </Pressable>
              ) : null}
            </View>
          ) : (
            <View
              style={[
                styles.formCard,
                {
                  backgroundColor: colors.cardBackground,
                  borderColor: colors.border,
                },
              ]}
            >
              <Text style={[styles.formTitle, { color: colors.text }]}>
                Nueva asociacion
              </Text>
              <View style={styles.fieldWrap}>
                <Text style={[styles.label, { color: colors.textSecondary }]}>
                  Nombre *
                </Text>
                <TextInput
                  value={newAsocName}
                  onChangeText={setNewAsocName}
                  placeholder="Nombre de la asociacion"
                  placeholderTextColor={colors.textTertiary}
                  autoCapitalize="words"
                  style={[
                    styles.input,
                    {
                      backgroundColor: colors.inputBackground,
                      borderColor: colors.border,
                      color: colors.text,
                    },
                  ]}
                />
              </View>
              <View style={styles.fieldWrap}>
                <Text style={[styles.label, { color: colors.textSecondary }]}>
                  RIF *
                </Text>
                <TextInput
                  value={newAsocRif}
                  onChangeText={setNewAsocRif}
                  placeholder="J-12345678-9"
                  placeholderTextColor={colors.textTertiary}
                  autoCapitalize="characters"
                  style={[
                    styles.input,
                    {
                      backgroundColor: colors.inputBackground,
                      borderColor: colors.border,
                      color: colors.text,
                    },
                  ]}
                />
              </View>
              <View style={styles.fieldWrap}>
                <Text style={[styles.label, { color: colors.textSecondary }]}>
                  Dirección fiscal *
                </Text>
                <TextInput
                  value={newAsocAddress}
                  onChangeText={setNewAsocAddress}
                  placeholder="Dirección fiscal"
                  placeholderTextColor={colors.textTertiary}
                  autoCapitalize="sentences"
                  style={[
                    styles.input,
                    {
                      backgroundColor: colors.inputBackground,
                      borderColor: colors.border,
                      color: colors.text,
                    },
                  ]}
                />
              </View>
              <View style={styles.fieldWrap}>
                <Text style={[styles.label, { color: colors.textSecondary }]}>
                  Correo *
                </Text>
                <TextInput
                  value={newAsocEmail}
                  onChangeText={setNewAsocEmail}
                  placeholder="correo@asociacion.com"
                  placeholderTextColor={colors.textTertiary}
                  autoCapitalize="none"
                  keyboardType="email-address"
                  style={[
                    styles.input,
                    {
                      backgroundColor: colors.inputBackground,
                      borderColor: colors.border,
                      color: colors.text,
                    },
                  ]}
                />
              </View>
              <View style={styles.fieldWrap}>
                <Text style={[styles.label, { color: colors.textSecondary }]}>
                  Teléfonos *
                </Text>
                <TextInput
                  value={newAsocPhones}
                  onChangeText={setNewAsocPhones}
                  placeholder="0414-0000000 / 0212-0000000"
                  placeholderTextColor={colors.textTertiary}
                  style={[
                    styles.input,
                    {
                      backgroundColor: colors.inputBackground,
                      borderColor: colors.border,
                      color: colors.text,
                    },
                  ]}
                />
              </View>
              <View style={styles.fieldWrap}>
                <Text style={[styles.label, { color: colors.textSecondary }]}>
                  Logo URL
                </Text>
                <TextInput
                  value={newAsocLogoUrl}
                  onChangeText={setNewAsocLogoUrl}
                  placeholder="https://..."
                  placeholderTextColor={colors.textTertiary}
                  autoCapitalize="none"
                  style={[
                    styles.input,
                    {
                      backgroundColor: colors.inputBackground,
                      borderColor: colors.border,
                      color: colors.text,
                    },
                  ]}
                />
              </View>
              <View style={styles.fieldWrap}>
                <Text style={[styles.label, { color: colors.textSecondary }]}>
                  Redes sociales JSON
                </Text>
                <TextInput
                  value={newAsocSocialText}
                  onChangeText={setNewAsocSocialText}
                  placeholder='{"instagram":"@mi_asociacion"}'
                  placeholderTextColor={colors.textTertiary}
                  autoCapitalize="none"
                  multiline
                  style={[
                    styles.input,
                    styles.multilineInput,
                    {
                      backgroundColor: colors.inputBackground,
                      borderColor: colors.border,
                      color: colors.text,
                    },
                  ]}
                />
              </View>
              <View style={styles.formActions}>
                <Pressable
                  onPress={() => setShowCreateForm(false)}
                  style={[
                    styles.cancelBtn,
                    {
                      backgroundColor: colors.cardMuted,
                      borderColor: colors.border,
                    },
                  ]}
                >
                  <Text style={[styles.cancelBtnText, { color: colors.text }]}>
                    Cancelar
                  </Text>
                </Pressable>
                <Pressable
                  onPress={handleCreateAssociation}
                  disabled={creating}
                  style={[
                    styles.confirmBtn,
                    {
                      backgroundColor: creating
                        ? colors.border
                        : colors.primary,
                    },
                  ]}
                >
                  {creating ? (
                    <ActivityIndicator color={colors.white} size="small" />
                  ) : (
                    <Text
                      style={[styles.confirmBtnText, { color: colors.white }]}
                    >
                      {canStartTrial ? "Crear y activar prueba" : "Crear"}
                    </Text>
                  )}
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
        <WorkshopScreenHeader
          badgeImageSource={require("../../assets/icon.png")}
          section="Fiscalización"
          title="T-SAFV"
          subtitle="Sistema operativo para control y fiscalización de unidades."
        />
        <View
          style={[
            styles.associationCard,
            {
              backgroundColor: colors.cardBackground,
              borderColor: colors.border,
            },
          ]}
        >
          <View style={styles.associationCardHeader}>
            <View
              style={[
                styles.associationLogoWrap,
                {
                  backgroundColor: colors.cardMuted,
                  borderColor: colors.border,
                },
              ]}
            >
              {activeAssociation?.logo_data || activeAssociation?.logo_url ? (
                <Image
                  source={{
                    uri:
                      activeAssociation.logo_data || activeAssociation.logo_url,
                  }}
                  style={styles.associationLogoImage}
                />
              ) : (
                <Ionicons
                  name="business-outline"
                  size={rf(28)}
                  color={colors.primary}
                />
              )}
            </View>
            <View style={styles.associationCardCopy}>
              <Text
                style={[styles.associationEyebrow, { color: colors.primary }]}
              >
                Asociación activa
              </Text>
              <Text style={[styles.associationTitle, { color: colors.text }]}>
                {activeAssociation?.nombre || "Sin asociación"}
              </Text>
              <Text
                style={[
                  styles.associationSubtitle,
                  { color: colors.textSecondary },
                ]}
              >
                {activeAssociation?.rif || "Sin RIF"}
              </Text>
            </View>
          </View>

          <View style={styles.associationInfoList}>
            <Text style={[styles.associationInfoText, { color: colors.text }]}>
              <Text style={styles.associationInfoStrong}>Dirección:</Text>{" "}
              {activeAssociation?.direccion_fiscal || "Sin dirección fiscal"}
            </Text>
            <Text style={[styles.associationInfoText, { color: colors.text }]}>
              <Text style={styles.associationInfoStrong}>Teléfono:</Text>{" "}
              {activeAssociation?.telefonos || "Sin teléfonos"}
            </Text>
            <Text style={[styles.associationInfoText, { color: colors.text }]}>
              <Text style={styles.associationInfoStrong}>Usuario:</Text>{" "}
              {userProfile?.fullName || userProfile?.email || "Sin usuario"}
            </Text>
            <Text style={[styles.associationInfoText, { color: colors.text }]}>
              <Text style={styles.associationInfoStrong}>Perfil:</Text>{" "}
              {userProfile?.role === "administrator"
                ? "Administrador"
                : userProfile?.role === "owner"
                  ? "Propietario"
                  : userProfile?.role === "fiscal"
                    ? "Fiscal"
                    : userProfile?.role || "Sin perfil"}
            </Text>
          </View>

          <View style={styles.quickActionInlineRow}>
            {[
              !isFiscalUser
                ? {
                    icon: "people-outline",
                    label: isOwnerUser ? "Mis datos" : "Propietarios",
                    onPress: onOpenPropietarios,
                  }
                : null,
              {
                icon: "shield-checkmark-outline",
                label: "Fiscales",
                onPress: onOpenFiscales,
              },
              {
                icon: "git-merge-outline",
                label: "Traza",
                onPress: onOpenTraza,
              },
            ]
              .filter(Boolean)
              .map((action) => (
                <Pressable
                  key={action.label}
                  onPress={action.onPress}
                  style={[
                    styles.inlineAction,
                    {
                      backgroundColor: colors.cardMuted,
                      borderColor: colors.border,
                    },
                  ]}
                >
                  <Ionicons
                    name={action.icon}
                    size={rf(16)}
                    color={colors.primary}
                  />
                  <Text
                    style={[styles.inlineActionText, { color: colors.text }]}
                  >
                    {action.label}
                  </Text>
                </Pressable>
              ))}
          </View>
        </View>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          Unidades activas
        </Text>
        <View
          style={[
            styles.searchPanel,
            {
              backgroundColor: colors.cardBackground,
              borderColor: colors.border,
            },
          ]}
        >
          <TextInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Buscar por placa, unidad, marca o chofer"
            placeholderTextColor={colors.textTertiary}
            style={[
              styles.searchInput,
              {
                backgroundColor: colors.inputBackground,
                borderColor: colors.border,
                color: colors.text,
              },
            ]}
          />
        </View>
        {loading ? (
          <ActivityIndicator
            color={colors.primary}
            style={{ marginTop: spacing.lg }}
          />
        ) : filtered.length ? (
          filtered.map((v) => (
            <Pressable
              key={v.id}
              onPress={() => onOpenFiscalRecord?.(v)}
              style={[
                styles.unitCard,
                {
                  backgroundColor: colors.cardBackground,
                  borderColor: colors.border,
                },
              ]}
            >
              <View style={styles.unitCardTopRow}>
                <View
                  style={[
                    styles.unitPill,
                    {
                      backgroundColor: colors.cardMuted,
                      borderColor: colors.border,
                    },
                  ]}
                >
                  <Ionicons
                    name="bus-outline"
                    size={rf(14)}
                    color={colors.primary}
                  />
                  <Text
                    style={[styles.unitPillText, { color: colors.primary }]}
                  >
                    Unidad
                  </Text>
                </View>
                <View
                  style={[
                    styles.unitActionPill,
                    { borderColor: colors.primary },
                  ]}
                >
                  <Text
                    style={[styles.unitActionText, { color: colors.primary }]}
                  >
                    {isFiscalUser ? "Fiscalizar" : "Ver traza"}
                  </Text>
                </View>
              </View>
              <Text style={[styles.unitTitle, { color: colors.text }]}>
                {[v.marca, v.modelo, v.ano].filter(Boolean).join(" ") ||
                  "Unidad sin descripción"}
              </Text>
              <Text style={[styles.unitCode, { color: colors.accent }]}>
                Unidad N° {v.numero_unidad || v.id}
              </Text>
              <Text style={[styles.unitAccent, { color: colors.primary }]}>
                Placa: {v.placa || "Sin placa"}
              </Text>
              {v.propietario_nombre || v.propietario_apellido ? (
                <Text
                  style={[styles.unitMeta, { color: colors.textSecondary }]}
                >
                  Propietario:{" "}
                  {[v.propietario_nombre, v.propietario_apellido]
                    .filter(Boolean)
                    .join(" ")}
                </Text>
              ) : null}
              <Text style={[styles.unitOwner, { color: colors.textTertiary }]}>
                Chofer: {v.ultimo_chofer || v.chofer || "Sin chofer"}
              </Text>
            </Pressable>
          ))
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
              name="car-outline"
              size={rf(32)}
              color={colors.textTertiary}
            />
            <Text style={[styles.emptyTitle, { color: colors.text }]}>
              Sin unidades
            </Text>
            <Text style={[styles.emptyMsg, { color: colors.textSecondary }]}>
              Registra propietarios y asígnales unidades para verlas aquí.
            </Text>
          </View>
        )}
      </ScrollView>
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
  associationCard: {
    borderWidth: 1,
    borderRadius: borderRadius.xl,
    padding: spacing.md,
    gap: spacing.md,
  },
  associationCardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
  associationLogoWrap: {
    width: rf(58),
    height: rf(58),
    borderWidth: 1,
    borderRadius: borderRadius.lg,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  associationLogoImage: {
    width: "100%",
    height: "100%",
  },
  associationCardCopy: { flex: 1, gap: spacing.xs / 2 },
  associationEyebrow: {
    fontSize: rf(11),
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 0.7,
  },
  associationTitle: { fontSize: rf(18), fontWeight: "900" },
  associationSubtitle: { fontSize: rf(13), lineHeight: rf(18) },
  associationInfoList: { gap: spacing.xs },
  associationInfoText: { fontSize: rf(13), lineHeight: rf(18) },
  associationInfoStrong: { fontWeight: "800" },
  quickActionInlineRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  inlineAction: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    borderWidth: 1,
    borderRadius: borderRadius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  inlineActionText: { fontSize: rf(12), fontWeight: "700" },
  sectionTitle: {
    fontSize: rf(15),
    fontWeight: "800",
    paddingHorizontal: spacing.xs,
  },
  searchPanel: {
    borderWidth: 1,
    borderRadius: borderRadius.xl,
    padding: spacing.md,
  },
  searchInput: {
    borderWidth: 1,
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    fontSize: rf(14),
    minHeight: rf(44),
  },
  unitCard: {
    borderWidth: 1,
    borderRadius: borderRadius.xl,
    padding: spacing.md,
    gap: spacing.sm,
  },
  unitCardTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.sm,
  },
  unitPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    alignSelf: "flex-start",
    borderWidth: 1,
    borderRadius: borderRadius.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  unitPillText: { fontSize: rf(10), fontWeight: "800" },
  unitActionPill: {
    borderWidth: 1,
    borderRadius: borderRadius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  unitActionText: { fontSize: rf(11), fontWeight: "800" },
  unitTitle: { fontSize: rf(17), fontWeight: "800" },
  unitAccent: { fontSize: rf(14), fontWeight: "900" },
  unitCode: { fontSize: rf(18), fontWeight: "800" },
  unitMeta: { fontSize: rf(13), lineHeight: rf(18) },
  unitOwner: { fontSize: rf(12), lineHeight: rf(18) },
  emptyBlock: {
    borderWidth: 1,
    borderRadius: borderRadius.xl,
    padding: spacing.xl,
    alignItems: "center",
    gap: spacing.md,
  },
  emptyTitle: { fontSize: rf(16), fontWeight: "800" },
  emptyMsg: { fontSize: rf(13), textAlign: "center", lineHeight: rf(19) },
  noAssocBlock: {
    borderWidth: 1,
    borderRadius: borderRadius.xl,
    padding: spacing.xxl,
    alignItems: "center",
    gap: spacing.lg,
  },
  noAssocTitle: { fontSize: rf(18), fontWeight: "800", textAlign: "center" },
  noAssocMsg: { fontSize: rf(14), textAlign: "center", lineHeight: rf(20) },
  createAssocBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    borderRadius: borderRadius.xl,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
  },
  createAssocBtnText: { fontSize: rf(15), fontWeight: "800" },
  blockedBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    borderWidth: 1,
    borderRadius: borderRadius.xl,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  blockedBadgeText: { flex: 1, fontSize: rf(13), lineHeight: rf(18) },
  invitationCard: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    borderWidth: 1,
    borderRadius: borderRadius.xl,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
  invitationCopy: { flex: 1, gap: spacing.xs / 2 },
  invitationTitle: { fontSize: rf(14), fontWeight: "800" },
  invitationText: { fontSize: rf(12), lineHeight: rf(17) },
  formCard: {
    borderWidth: 1,
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    gap: spacing.md,
  },
  formTitle: { fontSize: rf(16), fontWeight: "800" },
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
  multilineInput: {
    minHeight: rf(88),
    textAlignVertical: "top",
  },
  formActions: { flexDirection: "row", gap: spacing.sm, marginTop: spacing.xs },
  cancelBtn: {
    flex: 1,
    borderWidth: 1,
    borderRadius: borderRadius.lg,
    minHeight: rf(44),
    alignItems: "center",
    justifyContent: "center",
  },
  cancelBtnText: { fontSize: rf(14), fontWeight: "700" },
  confirmBtn: {
    flex: 1,
    borderRadius: borderRadius.lg,
    minHeight: rf(44),
    alignItems: "center",
    justifyContent: "center",
  },
  confirmBtnText: { fontSize: rf(14), fontWeight: "800" },
});
