import { useEffect, useState } from "react";
import * as ImagePicker from "expo-image-picker";
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
import {
  hasPermission,
  USER_ROLES,
  USER_STATUSES,
} from "../constants/accessControl";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import {
  approveUserProfile,
  cancelStaffInvitation,
  createStaffInvitation,
  listPendingApprovals,
  listPendingInvitations,
  listStaffProfiles,
  updateStaffProfile,
} from "../services/admin/staffAdmin";
import { updateAssociation } from "../services/associations/associationService";
import { resetActiveWorkshopDataForCurrentUser } from "../services/workshops/workshopResetService";
import { borderRadius, rf, spacing } from "../utils/responsive";

const roleLabels = {
  owner: "Dueno",
  administrator: "Administrador",
  reception: "Recepcion",
  mechanic: "Mecanico",
};

const statusLabels = {
  active: "Activo",
  pendingApproval: "Pendiente",
  suspended: "Suspendido",
  disabled: "Inhabilitado",
};

const invitationRoleOptions = [
  USER_ROLES.MECHANIC,
  USER_ROLES.RECEPTION,
  USER_ROLES.ADMINISTRATOR,
];

const staffStatusOptions = [
  USER_STATUSES.ACTIVE,
  USER_STATUSES.PENDING_APPROVAL,
  USER_STATUSES.SUSPENDED,
  USER_STATUSES.DISABLED,
];

function buildStaffForm(profile) {
  return {
    fullName: profile?.fullName || "",
    phone: profile?.phone || "",
    role: profile?.role || USER_ROLES.MECHANIC,
    status: profile?.status || USER_STATUSES.ACTIVE,
  };
}

function buildAssociationForm(association) {
  return {
    name: association?.nombre || "",
    phone: association?.telefonos || "",
    email: association?.email || "",
    address: association?.direccion_fiscal || "",
    rif: association?.rif || "",
    logoUrl: association?.logo_url || "",
    logoData: association?.logo_data || "",
    socialText: association?.redes_sociales
      ? JSON.stringify(association.redes_sociales, null, 2)
      : "",
  };
}

function isProtectedCollaboratorForRole(profile, currentRole) {
  return (
    currentRole === USER_ROLES.ADMINISTRATOR &&
    profile?.role === USER_ROLES.OWNER
  );
}

async function pickWorkshopLogo() {
  const permissionResult =
    await ImagePicker.requestMediaLibraryPermissionsAsync();

  if (!permissionResult.granted) {
    throw new Error(
      "Debes permitir acceso a la galería para seleccionar el logo de la asociación.",
    );
  }

  const result = await ImagePicker.launchImageLibraryAsync({
    allowsEditing: true,
    aspect: [1, 1],
    base64: true,
    mediaTypes: ["images"],
    quality: 0.55,
  });

  if (result.canceled || !result.assets?.length) {
    return "";
  }

  const [asset] = result.assets;

  if (!asset?.base64) {
    throw new Error("No se pudo preparar la imagen seleccionada.");
  }

  return `data:${asset.mimeType || "image/jpeg"};base64,${asset.base64}`;
}

function formatShortDate(value) {
  const resolvedDate = value?.toDate ? value.toDate() : value;

  if (!(resolvedDate instanceof Date) || Number.isNaN(resolvedDate.getTime())) {
    return "Sin fecha";
  }

  const day = String(resolvedDate.getDate()).padStart(2, "0");
  const month = String(resolvedDate.getMonth() + 1).padStart(2, "0");
  const year = resolvedDate.getFullYear();
  return `${day}/${month}/${year}`;
}

function formatDeliveryStatus(value) {
  if (value === "in_app") {
    return "en app";
  }

  if (value === "queued") {
    return "por correo";
  }

  if (value === "failed") {
    return "fallida";
  }

  return value || "sin estado";
}

export default function TeamAccessScreen({
  onBack,
  screenMode = "all",
  userProfile,
}) {
  const { colors } = useTheme();
  const {
    acceptPendingInvitation,
    activeAssociation,
    activeAssociationId,
    activeWorkshop,
    activeWorkshopId,
    authBusy,
    memberships,
    pendingInvitation,
    refreshAssociations,
    switchWorkshop,
    token,
  } = useAuth();
  const activeMembership = memberships.find(
    (membership) => membership.workshopId === activeWorkshopId,
  );
  const currentRole = activeMembership?.role || userProfile?.role;
  const canManageCollaborators = hasPermission(
    currentRole,
    "invitations.manage",
  );
  const canManageWorkshop = hasPermission(currentRole, "workshop.manage");
  const canResetWorkshopData = currentRole === USER_ROLES.OWNER;
  const showWorkshopSection = screenMode !== "collaborators";
  const showCollaboratorsSection = screenMode !== "workshop";
  const canViewWorkshopAdminPanel = canManageWorkshop || canResetWorkshopData;
  const showWorkshopRestrictedNotice =
    showWorkshopSection && !canViewWorkshopAdminPanel;
  const showCollaboratorsRestrictedNotice =
    showCollaboratorsSection && !canManageCollaborators;
  const [adminRefreshing, setAdminRefreshing] = useState(false);
  const [adminSubmitting, setAdminSubmitting] = useState(false);
  const [resetSubmitting, setResetSubmitting] = useState(false);
  const [pendingInvitations, setPendingInvitations] = useState([]);
  const [pendingApprovals, setPendingApprovals] = useState([]);
  const [staffProfiles, setStaffProfiles] = useState([]);
  const [editingStaffId, setEditingStaffId] = useState(null);
  const [staffForm, setStaffForm] = useState(buildStaffForm());
  const [switchingWorkshopId, setSwitchingWorkshopId] = useState(null);
  const [acceptingIncomingInvitation, setAcceptingIncomingInvitation] =
    useState(false);
  const [workshopSubmitting, setWorkshopSubmitting] = useState(false);
  const [activeWorkshopForm, setActiveWorkshopForm] = useState(
    buildAssociationForm(),
  );
  const [invitationForm, setInvitationForm] = useState({
    email: "",
    role: USER_ROLES.MECHANIC,
  });

  const activeWorkshopLogoPreview =
    activeWorkshopForm.logoData?.trim() || activeWorkshopForm.logoUrl.trim();

  useEffect(() => {
    setActiveWorkshopForm(buildAssociationForm(activeAssociation));
  }, [
    activeAssociation?.direccion_fiscal,
    activeAssociation?.email,
    activeAssociation?.logo_data,
    activeAssociation?.logo_url,
    activeAssociation?.nombre,
    activeAssociation?.redes_sociales,
    activeAssociation?.rif,
    activeAssociation?.telefonos,
  ]);

  const refreshAdminData = async () => {
    if (!canManageCollaborators || !activeAssociationId) {
      setPendingInvitations([]);
      setPendingApprovals([]);
      setStaffProfiles([]);
      setEditingStaffId(null);
      setStaffForm(buildStaffForm());
      return;
    }

    setAdminRefreshing(true);

    try {
      const [nextInvitations, nextApprovals, nextStaffProfiles] =
        await Promise.all([
          listPendingInvitations(),
          listPendingApprovals(),
          listStaffProfiles(),
        ]);
      setPendingInvitations(nextInvitations);
      setPendingApprovals(nextApprovals);
      setStaffProfiles(nextStaffProfiles);

      if (editingStaffId) {
        const refreshedProfile = nextStaffProfiles.find(
          (profile) => profile.uid === editingStaffId,
        );

        if (refreshedProfile) {
          setStaffForm(buildStaffForm(refreshedProfile));
        } else {
          setEditingStaffId(null);
          setStaffForm(buildStaffForm());
        }
      }
    } catch (error) {
      Alert.alert(
        "Equipo y accesos",
        "No se pudo actualizar la informacion administrativa.",
      );
    } finally {
      setAdminRefreshing(false);
    }
  };

  useEffect(() => {
    refreshAdminData();
  }, [canManageCollaborators, activeAssociationId]);

  const handleSwitchWorkshop = async (workshopId) => {
    try {
      setSwitchingWorkshopId(workshopId);
      await switchWorkshop(workshopId);
      await refreshAdminData();
      Alert.alert("Asociaciones", "La asociación activa fue actualizada.");
    } catch (error) {
      Alert.alert(
        "Asociaciones",
        error?.message || "No se pudo cambiar la asociación activa.",
      );
    } finally {
      setSwitchingWorkshopId(null);
    }
  };

  const handleAcceptIncomingInvitation = async () => {
    if (!pendingInvitation) {
      return;
    }

    try {
      setAcceptingIncomingInvitation(true);
      await acceptPendingInvitation({
        fullName: userProfile?.fullName || "",
        phone: userProfile?.phone || "",
        invitationCode:
          pendingInvitation.invitationCode || pendingInvitation.id || "",
      });
      await refreshAdminData();
      Alert.alert(
        "Asociaciones",
        "La invitación fue aceptada y ya puedes operar en esa asociación.",
      );
    } catch (error) {
      Alert.alert(
        "Asociaciones",
        error?.message || "No se pudo aceptar la invitacion pendiente.",
      );
    } finally {
      setAcceptingIncomingInvitation(false);
    }
  };

  const handleUpdateWorkshop = async () => {
    if (!activeWorkshopForm.name.trim()) {
      Alert.alert("Asociaciones", "Ingresa el nombre de la asociación activa.");
      return;
    }

    try {
      setWorkshopSubmitting(true);
      const redesSociales = activeWorkshopForm.socialText.trim()
        ? JSON.parse(activeWorkshopForm.socialText)
        : undefined;
      const association = await updateAssociation(token, activeAssociationId, {
        nombre: activeWorkshopForm.name.trim(),
        telefonos: activeWorkshopForm.phone.trim(),
        email: activeWorkshopForm.email.trim().toLowerCase(),
        direccion_fiscal: activeWorkshopForm.address.trim(),
        rif: activeWorkshopForm.rif.trim(),
        logo_url: activeWorkshopForm.logoUrl.trim(),
        logo_data: activeWorkshopForm.logoData?.trim() || "",
        redes_sociales: redesSociales,
      });
      await refreshAssociations();
      await refreshAdminData();
      Alert.alert(
        "Asociaciones",
        `Los datos de ${association.nombre} fueron actualizados.`,
      );
    } catch (error) {
      Alert.alert(
        "Asociaciones",
        error?.message || "No se pudo actualizar la asociación activa.",
      );
    } finally {
      setWorkshopSubmitting(false);
    }
  };

  const handlePickActiveWorkshopLogo = async () => {
    try {
      const nextLogo = await pickWorkshopLogo();

      if (!nextLogo) {
        return;
      }

      setActiveWorkshopForm((current) => ({
        ...current,
        logoData: nextLogo,
      }));
    } catch (error) {
      Alert.alert(
        "Asociaciones",
        error?.message || "No se pudo seleccionar el logo de la asociación.",
      );
    }
  };

  const handleClearActiveWorkshopLogo = () => {
    setActiveWorkshopForm((current) => ({
      ...current,
      logoData: "",
      logoUrl: "",
    }));
  };

  const handleCreateInvitation = async () => {
    const trimmedEmail = invitationForm.email.trim().toLowerCase();

    if (!trimmedEmail) {
      Alert.alert("Invitaciones", "Ingresa el correo del colaborador.");
      return;
    }

    if (!/^\S+@\S+\.\S+$/.test(trimmedEmail)) {
      Alert.alert("Invitaciones", "Ingresa un correo valido.");
      return;
    }

    setAdminSubmitting(true);

    try {
      const createdInvitation = await createStaffInvitation({
        email: trimmedEmail,
        role: invitationForm.role,
        invitedByUid: userProfile?.uid,
        workshopId: activeWorkshopId,
        workshopName: activeWorkshop?.name,
      });

      setInvitationForm((current) => ({
        ...current,
        email: "",
      }));
      await refreshAdminData();

      Alert.alert(
        "Invitacion emitida",
        `El codigo ${createdInvitation.id} quedo disponible en la app para el correo ${createdInvitation.email}.`,
      );
    } catch (error) {
      Alert.alert(
        "Invitaciones",
        error?.message || "No se pudo emitir la invitacion.",
      );
    } finally {
      setAdminSubmitting(false);
    }
  };

  const handleCancelInvitation = async (invitation) => {
    try {
      await cancelStaffInvitation(invitation.refId || invitation.id);
      await refreshAdminData();
      Alert.alert("Invitaciones", "La invitacion fue cancelada.");
    } catch (error) {
      Alert.alert(
        "Invitaciones",
        error?.message || "No se pudo cancelar la invitacion.",
      );
    }
  };

  const handleApproveProfile = async (profile) => {
    try {
      await approveUserProfile(profile.uid);
      await refreshAdminData();
      Alert.alert(
        "Aprobaciones",
        `${profile.fullName || profile.email || "El usuario"} ya quedo activo.`,
      );
    } catch (error) {
      Alert.alert(
        "Aprobaciones",
        error?.message || "No se pudo aprobar el usuario.",
      );
    }
  };

  const handleToggleStatus = async (profile) => {
    if (isProtectedCollaboratorForRole(profile, currentRole)) {
      Alert.alert(
        "Equipo",
        "El perfil del dueno solo puede ser gestionado por ese mismo nivel de acceso.",
      );
      return;
    }

    const nextStatus = profile.status === "active" ? "suspended" : "active";

    try {
      await updateStaffProfile(profile.uid, { status: nextStatus });
      await refreshAdminData();
      Alert.alert(
        "Equipo",
        nextStatus === "active"
          ? "El usuario fue reactivado."
          : "El usuario fue suspendido.",
      );
    } catch (error) {
      Alert.alert(
        "Equipo",
        error?.message || "No se pudo actualizar el estado del usuario.",
      );
    }
  };

  const handleEditStaffProfile = (profile) => {
    if (isProtectedCollaboratorForRole(profile, currentRole)) {
      Alert.alert(
        "Equipo",
        "El perfil del dueno no puede ser editado desde una cuenta administradora.",
      );
      return;
    }

    setEditingStaffId(profile.uid);
    setStaffForm(buildStaffForm(profile));
  };

  const handleCloseStaffEditor = () => {
    setEditingStaffId(null);
    setStaffForm(buildStaffForm());
  };

  const handleSaveStaffProfile = async () => {
    if (!editingStaffId) {
      return;
    }

    if (!staffForm.fullName.trim()) {
      Alert.alert("Equipo", "Ingresa el nombre del colaborador.");
      return;
    }

    try {
      setAdminSubmitting(true);
      await updateStaffProfile(editingStaffId, {
        fullName: staffForm.fullName.trim(),
        phone: staffForm.phone.trim(),
        role: staffForm.role,
        status: staffForm.status,
      });
      await refreshAdminData();
      Alert.alert("Equipo", "La ficha del colaborador fue actualizada.");
      handleCloseStaffEditor();
    } catch (error) {
      Alert.alert(
        "Equipo",
        error?.message || "No se pudo guardar la ficha del colaborador.",
      );
    } finally {
      setAdminSubmitting(false);
    }
  };

  const handleResetWorkshopData = () => {
    Alert.alert(
      "Reiniciar asociación",
      "Se eliminarán los registros operativos de la asociación activa. La identidad comercial, la asociación y los colaboradores se conservan. Esta acción no se puede deshacer.",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Reiniciar",
          style: "destructive",
          onPress: async () => {
            try {
              setResetSubmitting(true);
              const result = await resetActiveWorkshopDataForCurrentUser();
              await refreshAdminData();
              Alert.alert(
                "Asociación reiniciada",
                `Se eliminaron ${result.deletedDocuments} registros operativos de la asociación activa.`,
              );
            } catch (error) {
              Alert.alert(
                "Reiniciar asociación",
                error?.message ||
                  "No se pudo reiniciar la data de la asociación.",
              );
            } finally {
              setResetSubmitting(false);
            }
          },
        },
      ],
    );
  };

  const headerCopy =
    screenMode === "workshop"
      ? {
          section: "Configuracion",
          title: "Datos de la asociación",
          subtitle:
            "Identidad comercial, contexto activo y mantenimiento operativo de la asociación.",
        }
      : screenMode === "collaborators"
        ? {
            section: "Administracion",
            title: "Colaboradores",
            subtitle:
              "Invitaciones, roles, estados y control de acceso del equipo tecnico.",
          }
        : {
            section: "Control administrativo",
            title: "Asociación y colaboradores",
            subtitle:
              "Asociación activa, invitaciones y colaboradores dentro de la misma app.",
          };

  return (
    <SafeAreaView
      edges={["left", "right", "bottom"]}
      style={[styles.safeArea, { backgroundColor: colors.background }]}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <WorkshopScreenHeader
          onBack={onBack}
          section={headerCopy.section}
          subtitle={headerCopy.subtitle}
          title={headerCopy.title}
        />

        <View
          style={[
            styles.panel,
            {
              backgroundColor: colors.cardBackground,
              borderColor: colors.border,
            },
          ]}
        >
          <View style={styles.panelHeader}>
            <View style={styles.panelCopy}>
              <Text style={[styles.panelTitle, { color: colors.text }]}>
                Asociación activa
              </Text>
              <Text style={[styles.panelText, { color: colors.textSecondary }]}>
                Identidad y contexto operativo de la asociación seleccionada.
              </Text>
            </View>
            <View
              style={[
                styles.workshopBadge,
                {
                  backgroundColor: colors.cardMuted,
                  borderColor: colors.border,
                },
              ]}
            >
              <Text
                style={[styles.workshopBadgeText, { color: colors.primary }]}
              >
                {activeAssociation?.nombre || "Sin asociación activa"}
              </Text>
            </View>
          </View>

          <View style={styles.membershipList}>
            <View
              style={[
                styles.membershipRow,
                {
                  backgroundColor: colors.cardMuted,
                  borderColor: colors.primary,
                },
              ]}
            >
              <View style={styles.membershipCopy}>
                <Text style={[styles.rowTitle, { color: colors.text }]}>
                  {activeAssociation?.nombre || "Sin asociación activa"}
                </Text>
                <Text style={[styles.rowMeta, { color: colors.textSecondary }]}>
                  {activeAssociation?.rif || "Sin RIF"}
                </Text>
              </View>

              <View
                style={[
                  styles.secondaryAction,
                  {
                    borderColor: colors.primary,
                    backgroundColor: colors.primary,
                  },
                ]}
              >
                <Text
                  style={[styles.secondaryActionText, { color: colors.white }]}
                >
                  Activa
                </Text>
              </View>
            </View>
          </View>
        </View>

        {showWorkshopSection && canViewWorkshopAdminPanel ? (
          <View
            style={[
              styles.panel,
              {
                backgroundColor: colors.cardBackground,
                borderColor: colors.border,
              },
            ]}
          >
            <Text style={[styles.panelTitle, { color: colors.text }]}>
              Gestión de la asociación activa
            </Text>
            <Text style={[styles.panelText, { color: colors.textSecondary }]}>
              Ajusta identidad fiscal, contacto, logo y redes sociales de la
              asociación activa.
            </Text>

            <View style={styles.formGroup}>
              <Text style={[styles.fieldLabel, { color: colors.text }]}>
                Datos de la asociación activa
              </Text>
              {canManageWorkshop ? (
                <>
                  <TextInput
                    onChangeText={(value) =>
                      setActiveWorkshopForm((current) => ({
                        ...current,
                        name: value,
                      }))
                    }
                    placeholder="Nombre de la asociación activa"
                    placeholderTextColor={colors.textTertiary}
                    style={[
                      styles.input,
                      {
                        backgroundColor: colors.inputBackground,
                        borderColor: colors.border,
                        color: colors.text,
                      },
                    ]}
                    value={activeWorkshopForm.name}
                  />
                  <TextInput
                    onChangeText={(value) =>
                      setActiveWorkshopForm((current) => ({
                        ...current,
                        phone: value,
                      }))
                    }
                    placeholder="Teléfonos de la asociación"
                    placeholderTextColor={colors.textTertiary}
                    style={[
                      styles.input,
                      {
                        backgroundColor: colors.inputBackground,
                        borderColor: colors.border,
                        color: colors.text,
                      },
                    ]}
                    value={activeWorkshopForm.phone}
                  />
                  <TextInput
                    autoCapitalize="none"
                    keyboardType="email-address"
                    onChangeText={(value) =>
                      setActiveWorkshopForm((current) => ({
                        ...current,
                        email: value,
                      }))
                    }
                    placeholder="Correo de la asociación"
                    placeholderTextColor={colors.textTertiary}
                    style={[
                      styles.input,
                      {
                        backgroundColor: colors.inputBackground,
                        borderColor: colors.border,
                        color: colors.text,
                      },
                    ]}
                    value={activeWorkshopForm.email}
                  />
                  <TextInput
                    onChangeText={(value) =>
                      setActiveWorkshopForm((current) => ({
                        ...current,
                        address: value,
                      }))
                    }
                    placeholder="Dirección fiscal"
                    placeholderTextColor={colors.textTertiary}
                    style={[
                      styles.input,
                      {
                        backgroundColor: colors.inputBackground,
                        borderColor: colors.border,
                        color: colors.text,
                      },
                    ]}
                    value={activeWorkshopForm.address}
                  />
                  <TextInput
                    onChangeText={(value) =>
                      setActiveWorkshopForm((current) => ({
                        ...current,
                        rif: value,
                      }))
                    }
                    placeholder="RIF o identificacion fiscal"
                    placeholderTextColor={colors.textTertiary}
                    style={[
                      styles.input,
                      {
                        backgroundColor: colors.inputBackground,
                        borderColor: colors.border,
                        color: colors.text,
                      },
                    ]}
                    value={activeWorkshopForm.rif}
                  />
                  <View style={styles.logoActionsRow}>
                    <Pressable
                      onPress={handlePickActiveWorkshopLogo}
                      style={[
                        styles.secondaryFilledAction,
                        styles.logoActionButton,
                        {
                          backgroundColor: colors.cardMuted,
                          borderColor: colors.border,
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.secondaryFilledActionText,
                          { color: colors.text },
                        ]}
                      >
                        Seleccionar logo
                      </Text>
                    </Pressable>
                    <Pressable
                      disabled={!activeWorkshopLogoPreview}
                      onPress={handleClearActiveWorkshopLogo}
                      style={[
                        styles.secondaryAction,
                        styles.logoActionButton,
                        {
                          borderColor: colors.borderStrong,
                          backgroundColor: colors.cardBackground,
                        },
                        !activeWorkshopLogoPreview
                          ? styles.disabledAction
                          : null,
                      ]}
                    >
                      <Text
                        style={[
                          styles.secondaryActionText,
                          { color: colors.text },
                        ]}
                      >
                        Quitar logo
                      </Text>
                    </Pressable>
                  </View>
                  {activeWorkshopLogoPreview ? (
                    <View
                      style={[
                        styles.logoPreviewCard,
                        {
                          backgroundColor: colors.cardMuted,
                          borderColor: colors.border,
                        },
                      ]}
                    >
                      <Image
                        source={{ uri: activeWorkshopLogoPreview }}
                        style={styles.logoPreviewImage}
                      />
                      <Text
                        style={[
                          styles.logoPreviewText,
                          { color: colors.textSecondary },
                        ]}
                      >
                        Vista previa del logo de la asociación.
                      </Text>
                    </View>
                  ) : (
                    <View
                      style={[
                        styles.logoPlaceholderCard,
                        {
                          backgroundColor: colors.cardMuted,
                          borderColor: colors.border,
                        },
                      ]}
                    >
                      <View
                        style={[
                          styles.logoPlaceholderBadge,
                          {
                            backgroundColor: colors.cardBackground,
                            borderColor: colors.border,
                          },
                        ]}
                      >
                        <Text
                          style={[
                            styles.logoPlaceholderInitials,
                            { color: colors.textSecondary },
                          ]}
                        >
                          LOGO
                        </Text>
                      </View>
                      <Text
                        style={[styles.logoPreviewText, { color: colors.text }]}
                      >
                        Aún no hay logo cargado
                      </Text>
                      <Text
                        style={[
                          styles.rowMeta,
                          { color: colors.textSecondary },
                        ]}
                      >
                        Selecciona una imagen desde la galería para guardarla
                        como logo de la asociación.
                      </Text>
                    </View>
                  )}
                  <TextInput
                    multiline
                    numberOfLines={4}
                    onChangeText={(value) =>
                      setActiveWorkshopForm((current) => ({
                        ...current,
                        socialText: value,
                      }))
                    }
                    placeholder='Redes sociales en JSON. Ejemplo: {"instagram":"@mi_asociacion"}'
                    placeholderTextColor={colors.textTertiary}
                    style={[
                      styles.input,
                      styles.notesInput,
                      {
                        backgroundColor: colors.inputBackground,
                        borderColor: colors.border,
                        color: colors.text,
                      },
                    ]}
                    textAlignVertical="top"
                    value={activeWorkshopForm.socialText}
                  />
                  <Pressable
                    disabled={
                      workshopSubmitting || authBusy || !activeWorkshopId
                    }
                    onPress={handleUpdateWorkshop}
                    style={[
                      styles.secondaryFilledAction,
                      {
                        backgroundColor: colors.cardMuted,
                        borderColor: colors.border,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.secondaryFilledActionText,
                        { color: colors.text },
                      ]}
                    >
                      {workshopSubmitting
                        ? "Guardando..."
                        : "Guardar datos de la asociación"}
                    </Text>
                  </Pressable>
                </>
              ) : (
                <Text
                  style={[styles.panelText, { color: colors.textSecondary }]}
                >
                  Solo el administrador puede cambiar la identidad y el contacto
                  de la asociación.
                </Text>
              )}
            </View>

            <View
              style={[
                styles.summaryPanel,
                {
                  backgroundColor: colors.cardMuted,
                  borderColor: colors.border,
                },
              ]}
            >
              <Text style={[styles.summaryText, { color: colors.text }]}>
                Esta pantalla administra la identidad visible de la asociación
                activa.
              </Text>
            </View>

            {canResetWorkshopData ? (
              <View
                style={[
                  styles.resetPanel,
                  {
                    backgroundColor: colors.cardMuted,
                    borderColor: colors.border,
                  },
                ]}
              >
                <Text style={[styles.fieldLabel, { color: colors.text }]}>
                  Reiniciar datos de la asociación
                </Text>
                <Text
                  style={[styles.panelText, { color: colors.textSecondary }]}
                >
                  Borra toda la data operativa de la asociación activa y
                  conserva la identidad comercial, la asociación activa y los
                  colaboradores.
                </Text>
                <Pressable
                  disabled={resetSubmitting || authBusy}
                  onPress={handleResetWorkshopData}
                  style={[
                    styles.dangerAction,
                    {
                      backgroundColor: colors.cardBackground,
                      borderColor: colors.danger,
                    },
                  ]}
                >
                  <Text
                    style={[styles.dangerActionText, { color: colors.danger }]}
                  >
                    {resetSubmitting
                      ? "Reiniciando..."
                      : "Reiniciar datos de la asociación"}
                  </Text>
                </Pressable>
              </View>
            ) : null}
          </View>
        ) : null}

        {showWorkshopRestrictedNotice ? (
          <View
            style={[
              styles.accessNotice,
              {
                backgroundColor: colors.cardBackground,
                borderColor: colors.border,
              },
            ]}
          >
            <Text style={[styles.panelTitle, { color: colors.text }]}>
              Gestión de la asociación restringida
            </Text>
            <Text style={[styles.panelText, { color: colors.textSecondary }]}>
              {currentRole === USER_ROLES.ADMINISTRATOR
                ? "Tu perfil puede operar el equipo y el flujo diario, pero no cambiar la identidad comercial ni reiniciar la data de la asociación."
                : "Este perfil no administra la configuración de la asociación. Usa esta pantalla solo como contexto de la asociación activa."}
            </Text>
          </View>
        ) : null}

        {showCollaboratorsSection && pendingInvitation ? (
          <View
            style={[
              styles.panel,
              {
                backgroundColor: colors.cardBackground,
                borderColor: colors.border,
              },
            ]}
          >
            <Text style={[styles.panelTitle, { color: colors.text }]}>
              Invitacion entrante
            </Text>
            <Text style={[styles.panelText, { color: colors.textSecondary }]}>
              Tienes una invitacion pendiente para unirte a{" "}
              {pendingInvitation.asociacion_nombre ||
                pendingInvitation.workshopName ||
                "otra asociación"}
              .
            </Text>
            <Text style={[styles.rowMeta, { color: colors.textSecondary }]}>
              Rol {roleLabels[pendingInvitation.role] || pendingInvitation.role}
            </Text>
            <Text style={[styles.rowMeta, { color: colors.textTertiary }]}>
              Codigo {pendingInvitation.id || pendingInvitation.invitationCode}
            </Text>
            <Pressable
              disabled={acceptingIncomingInvitation || authBusy}
              onPress={handleAcceptIncomingInvitation}
              style={[
                styles.primaryAction,
                { backgroundColor: colors.primary },
              ]}
            >
              <Text style={[styles.primaryActionText, { color: colors.white }]}>
                {acceptingIncomingInvitation
                  ? "Aceptando invitacion..."
                  : "Aceptar invitacion"}
              </Text>
            </Pressable>
          </View>
        ) : null}

        {showCollaboratorsRestrictedNotice && (
          <View
            style={[
              styles.accessNotice,
              {
                backgroundColor: colors.cardBackground,
                borderColor: colors.border,
              },
            ]}
          >
            <Text style={[styles.panelTitle, { color: colors.text }]}>
              Acceso restringido
            </Text>
            <Text style={[styles.panelText, { color: colors.textSecondary }]}>
              {currentRole === USER_ROLES.RECEPTION
                ? "Recepcion no puede emitir invitaciones, aprobar accesos ni editar fichas del equipo."
                : currentRole === USER_ROLES.MECHANIC
                  ? "Mecanico no puede gestionar invitaciones ni colaboradores desde esta pantalla."
                  : "La gestion de invitaciones y colaboradores solo esta habilitada para perfiles con permiso administrativo."}
            </Text>
          </View>
        )}

        {showCollaboratorsSection && canManageCollaborators && (
          <>
            {editingStaffId ? (
              <View
                style={[
                  styles.panel,
                  {
                    backgroundColor: colors.cardBackground,
                    borderColor: colors.border,
                  },
                ]}
              >
                <View style={styles.panelHeader}>
                  <View style={styles.panelCopy}>
                    <Text style={[styles.panelTitle, { color: colors.text }]}>
                      Editar ficha tecnica
                    </Text>
                    <Text
                      style={[
                        styles.panelText,
                        { color: colors.textSecondary },
                      ]}
                    >
                      Completa nombre, telefono, rol y estado del colaborador
                      desde una sola ficha operativa.
                    </Text>
                  </View>

                  <Pressable
                    onPress={handleCloseStaffEditor}
                    style={[
                      styles.refreshButton,
                      {
                        borderColor: colors.borderStrong,
                        backgroundColor: colors.cardBackground,
                      },
                    ]}
                  >
                    <Text
                      style={[styles.refreshButtonText, { color: colors.text }]}
                    >
                      Cerrar
                    </Text>
                  </Pressable>
                </View>

                <View style={styles.formGroup}>
                  <Text style={[styles.fieldLabel, { color: colors.text }]}>
                    Nombre completo
                  </Text>
                  <TextInput
                    onChangeText={(value) =>
                      setStaffForm((current) => ({
                        ...current,
                        fullName: value,
                      }))
                    }
                    placeholder="Nombre del colaborador"
                    placeholderTextColor={colors.textTertiary}
                    style={[
                      styles.input,
                      {
                        backgroundColor: colors.inputBackground,
                        borderColor: colors.border,
                        color: colors.text,
                      },
                    ]}
                    value={staffForm.fullName}
                  />
                </View>

                <View style={styles.formGroup}>
                  <Text style={[styles.fieldLabel, { color: colors.text }]}>
                    Telefono
                  </Text>
                  <TextInput
                    keyboardType="phone-pad"
                    onChangeText={(value) =>
                      setStaffForm((current) => ({
                        ...current,
                        phone: value,
                      }))
                    }
                    placeholder="Numero de contacto"
                    placeholderTextColor={colors.textTertiary}
                    style={[
                      styles.input,
                      {
                        backgroundColor: colors.inputBackground,
                        borderColor: colors.border,
                        color: colors.text,
                      },
                    ]}
                    value={staffForm.phone}
                  />
                </View>

                <View style={styles.formGroup}>
                  <Text style={[styles.fieldLabel, { color: colors.text }]}>
                    Rol operativo
                  </Text>
                  <View style={styles.roleOptionRow}>
                    {invitationRoleOptions.map((role) => {
                      const selected = staffForm.role === role;

                      return (
                        <Pressable
                          key={`staff-role-${role}`}
                          onPress={() =>
                            setStaffForm((current) => ({
                              ...current,
                              role,
                            }))
                          }
                          style={[
                            styles.roleOption,
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
                              styles.roleOptionText,
                              { color: selected ? colors.white : colors.text },
                            ]}
                          >
                            {roleLabels[role] || role}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </View>
                </View>

                <View style={styles.formGroup}>
                  <Text style={[styles.fieldLabel, { color: colors.text }]}>
                    Estado de acceso
                  </Text>
                  <View style={styles.roleOptionRow}>
                    {staffStatusOptions.map((status) => {
                      const selected = staffForm.status === status;

                      return (
                        <Pressable
                          key={`staff-status-${status}`}
                          onPress={() =>
                            setStaffForm((current) => ({
                              ...current,
                              status,
                            }))
                          }
                          style={[
                            styles.roleOption,
                            {
                              backgroundColor: selected
                                ? colors.accent
                                : colors.cardMuted,
                              borderColor: selected
                                ? colors.accent
                                : colors.border,
                            },
                          ]}
                        >
                          <Text
                            style={[
                              styles.roleOptionText,
                              { color: selected ? colors.white : colors.text },
                            ]}
                          >
                            {statusLabels[status] || status}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </View>
                </View>

                <Pressable
                  onPress={handleSaveStaffProfile}
                  style={[
                    styles.primaryAction,
                    { backgroundColor: colors.primary },
                  ]}
                >
                  <Text
                    style={[styles.primaryActionText, { color: colors.white }]}
                  >
                    {adminSubmitting ? "Guardando ficha..." : "Guardar ficha"}
                  </Text>
                </Pressable>
              </View>
            ) : null}

            <View
              style={[
                styles.panel,
                {
                  backgroundColor: colors.cardBackground,
                  borderColor: colors.border,
                },
              ]}
            >
              <View style={styles.panelHeader}>
                <View style={styles.panelCopy}>
                  <Text style={[styles.panelTitle, { color: colors.text }]}>
                    Nueva invitacion
                  </Text>
                  <Text
                    style={[styles.panelText, { color: colors.textSecondary }]}
                  >
                    Cada invitacion genera un codigo consecutivo y queda
                    disponible en la app para que el colaborador se active con
                    ese mismo correo.
                  </Text>
                </View>

                <Pressable
                  onPress={refreshAdminData}
                  style={[
                    styles.refreshButton,
                    {
                      borderColor: colors.borderStrong,
                      backgroundColor: colors.overlay,
                    },
                  ]}
                >
                  <Text
                    style={[styles.refreshButtonText, { color: colors.white }]}
                  >
                    Actualizar
                  </Text>
                </Pressable>
              </View>

              <View style={styles.formGroup}>
                <Text style={[styles.fieldLabel, { color: colors.text }]}>
                  Correo del colaborador
                </Text>
                <TextInput
                  autoCapitalize="none"
                  keyboardType="email-address"
                  onChangeText={(value) =>
                    setInvitationForm((current) => ({
                      ...current,
                      email: value,
                    }))
                  }
                  placeholder="tecnico@taller.com"
                  placeholderTextColor={colors.textTertiary}
                  style={[
                    styles.input,
                    {
                      backgroundColor: colors.inputBackground,
                      borderColor: colors.border,
                      color: colors.text,
                    },
                  ]}
                  value={invitationForm.email}
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={[styles.fieldLabel, { color: colors.text }]}>
                  Rol operativo
                </Text>
                <View style={styles.roleOptionRow}>
                  {invitationRoleOptions.map((role) => {
                    const selected = invitationForm.role === role;

                    return (
                      <Pressable
                        key={role}
                        onPress={() =>
                          setInvitationForm((current) => ({
                            ...current,
                            role,
                          }))
                        }
                        style={[
                          styles.roleOption,
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
                            styles.roleOptionText,
                            { color: selected ? colors.white : colors.text },
                          ]}
                        >
                          {roleLabels[role] || role}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              </View>

              <Pressable
                onPress={handleCreateInvitation}
                style={[
                  styles.primaryAction,
                  { backgroundColor: colors.primary },
                ]}
              >
                <Text
                  style={[styles.primaryActionText, { color: colors.white }]}
                >
                  {adminSubmitting
                    ? "Emitiendo invitacion..."
                    : "Emitir invitacion"}
                </Text>
              </Pressable>
            </View>

            <View style={styles.listGrid}>
              <View
                style={[
                  styles.listCard,
                  {
                    backgroundColor: colors.cardBackground,
                    borderColor: colors.border,
                  },
                ]}
              >
                <View style={styles.listHeader}>
                  <Text style={[styles.listTitle, { color: colors.text }]}>
                    Invitaciones pendientes
                  </Text>
                  <Text style={[styles.counterText, { color: colors.primary }]}>
                    {pendingInvitations.length}
                  </Text>
                </View>

                {adminRefreshing ? (
                  <ActivityIndicator color={colors.primary} />
                ) : pendingInvitations.length ? (
                  <View style={styles.listBody}>
                    {pendingInvitations.map((invitation) => (
                      <View
                        key={invitation.refId || invitation.id}
                        style={[
                          styles.listRow,
                          {
                            backgroundColor: colors.cardMuted,
                            borderColor: colors.border,
                          },
                        ]}
                      >
                        <View style={styles.listCopy}>
                          <View
                            style={[
                              styles.listRowHeader,
                              { borderBottomColor: colors.border },
                            ]}
                          >
                            <View style={styles.listHeaderCopy}>
                              <Text
                                style={[
                                  styles.rowEyebrow,
                                  { color: colors.primary },
                                ]}
                              >
                                Invitacion
                              </Text>
                              <Text
                                style={[
                                  styles.rowTitle,
                                  { color: colors.text },
                                ]}
                              >
                                {invitation.email}
                              </Text>
                            </View>
                            <Text
                              style={[styles.rowTag, { color: colors.primary }]}
                            >
                              {roleLabels[invitation.role] || invitation.role}
                            </Text>
                          </View>
                          <View style={styles.listRowBody}>
                            <Text
                              style={[
                                styles.rowMeta,
                                { color: colors.textSecondary },
                              ]}
                            >
                              Taller {invitation.workshopName || "Sin nombre"}
                            </Text>
                            <Text
                              style={[
                                styles.rowMeta,
                                { color: colors.textSecondary },
                              ]}
                            >
                              Codigo {invitation.id || invitation.refId}
                            </Text>
                            <Text
                              style={[
                                styles.rowMeta,
                                { color: colors.textTertiary },
                              ]}
                            >
                              Vence {formatShortDate(invitation.expiresAt)} ·
                              Entrega{" "}
                              {formatDeliveryStatus(invitation.deliveryStatus)}
                            </Text>
                          </View>
                        </View>

                        <Pressable
                          onPress={() => handleCancelInvitation(invitation)}
                          style={[
                            styles.secondaryAction,
                            {
                              borderColor: colors.borderStrong,
                              backgroundColor: colors.overlay,
                            },
                          ]}
                        >
                          <Text
                            style={[
                              styles.secondaryActionText,
                              { color: colors.white },
                            ]}
                          >
                            Cancelar
                          </Text>
                        </Pressable>
                      </View>
                    ))}
                  </View>
                ) : (
                  <View
                    style={[
                      styles.emptyStateCard,
                      {
                        backgroundColor: colors.cardMuted,
                        borderColor: colors.border,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.emptyStateEyebrow,
                        { color: colors.primary },
                      ]}
                    >
                      Invitaciones
                    </Text>
                    <Text
                      style={[
                        styles.emptyStateText,
                        { color: colors.textSecondary },
                      ]}
                    >
                      No hay invitaciones abiertas. Emite la primera para sumar
                      personal al taller.
                    </Text>
                  </View>
                )}
              </View>

              <View
                style={[
                  styles.listCard,
                  {
                    backgroundColor: colors.cardBackground,
                    borderColor: colors.border,
                  },
                ]}
              >
                <View style={styles.listHeader}>
                  <Text style={[styles.listTitle, { color: colors.text }]}>
                    Aprobaciones internas
                  </Text>
                  <Text style={[styles.counterText, { color: colors.warning }]}>
                    {pendingApprovals.length}
                  </Text>
                </View>

                {adminRefreshing ? (
                  <ActivityIndicator color={colors.primary} />
                ) : pendingApprovals.length ? (
                  <View style={styles.listBody}>
                    {pendingApprovals.map((profile) => (
                      <View
                        key={profile.uid}
                        style={[
                          styles.listRow,
                          {
                            backgroundColor: colors.cardMuted,
                            borderColor: colors.border,
                          },
                        ]}
                      >
                        <View style={styles.listCopy}>
                          <View
                            style={[
                              styles.listRowHeader,
                              { borderBottomColor: colors.border },
                            ]}
                          >
                            <View style={styles.listHeaderCopy}>
                              <Text
                                style={[
                                  styles.rowEyebrow,
                                  { color: colors.warning },
                                ]}
                              >
                                Pendiente
                              </Text>
                              <Text
                                style={[
                                  styles.rowTitle,
                                  { color: colors.text },
                                ]}
                              >
                                {profile.fullName || "Usuario sin nombre"}
                              </Text>
                            </View>
                            <Text
                              style={[styles.rowTag, { color: colors.warning }]}
                            >
                              {roleLabels[profile.role] || profile.role}
                            </Text>
                          </View>
                          <View style={styles.listRowBody}>
                            <Text
                              style={[
                                styles.rowMeta,
                                { color: colors.textSecondary },
                              ]}
                            >
                              {profile.email}
                            </Text>
                            <Text
                              style={[
                                styles.rowMeta,
                                { color: colors.textTertiary },
                              ]}
                            >
                              Codigo {profile.userCode || "Sin consecutivo"}
                            </Text>
                          </View>
                        </View>

                        <Pressable
                          onPress={() => handleApproveProfile(profile)}
                          style={[
                            styles.approveAction,
                            {
                              borderColor: colors.primary,
                              backgroundColor: colors.cardBackground,
                            },
                          ]}
                        >
                          <Text
                            style={[
                              styles.approveActionText,
                              { color: colors.primary },
                            ]}
                          >
                            Aprobar
                          </Text>
                        </Pressable>
                      </View>
                    ))}
                  </View>
                ) : (
                  <View
                    style={[
                      styles.emptyStateCard,
                      {
                        backgroundColor: colors.cardMuted,
                        borderColor: colors.border,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.emptyStateEyebrow,
                        { color: colors.warning },
                      ]}
                    >
                      Aprobaciones
                    </Text>
                    <Text
                      style={[
                        styles.emptyStateText,
                        { color: colors.textSecondary },
                      ]}
                    >
                      No hay usuarios pendientes de aprobacion interna.
                    </Text>
                  </View>
                )}
              </View>

              <View
                style={[
                  styles.listCard,
                  {
                    backgroundColor: colors.cardBackground,
                    borderColor: colors.border,
                  },
                ]}
              >
                <View style={styles.listHeader}>
                  <Text style={[styles.listTitle, { color: colors.text }]}>
                    Personal tecnico
                  </Text>
                  <Text style={[styles.counterText, { color: colors.accent }]}>
                    {staffProfiles.length}
                  </Text>
                </View>

                {adminRefreshing ? (
                  <ActivityIndicator color={colors.primary} />
                ) : staffProfiles.length ? (
                  <View style={styles.listBody}>
                    {staffProfiles.map((profile) => {
                      const isProtectedProfile = isProtectedCollaboratorForRole(
                        profile,
                        currentRole,
                      );

                      return (
                        <View
                          key={profile.uid}
                          style={[
                            styles.listRow,
                            {
                              backgroundColor: colors.cardMuted,
                              borderColor: colors.border,
                            },
                          ]}
                        >
                          <View style={styles.listCopy}>
                            <View
                              style={[
                                styles.listRowHeader,
                                { borderBottomColor: colors.border },
                              ]}
                            >
                              <View style={styles.listHeaderCopy}>
                                <Text
                                  style={[
                                    styles.rowEyebrow,
                                    { color: colors.accent },
                                  ]}
                                >
                                  Colaborador
                                </Text>
                                <Text
                                  style={[
                                    styles.rowTitle,
                                    { color: colors.text },
                                  ]}
                                >
                                  {profile.fullName || "Usuario sin nombre"}
                                </Text>
                              </View>
                              <Text
                                style={[
                                  styles.rowTag,
                                  { color: colors.accent },
                                ]}
                              >
                                {statusLabels[profile.status] ||
                                  statusLabels[profile.membershipStatus] ||
                                  profile.status ||
                                  "Sin estado"}
                              </Text>
                            </View>
                            <View style={styles.listRowBody}>
                              <Text
                                style={[
                                  styles.rowMeta,
                                  { color: colors.textSecondary },
                                ]}
                              >
                                {profile.userCode || "Sin codigo"} ·{" "}
                                {profile.email}
                              </Text>
                              <Text
                                style={[
                                  styles.rowMeta,
                                  { color: colors.textTertiary },
                                ]}
                              >
                                {roleLabels[profile.role] || profile.role}
                              </Text>
                              <Text
                                style={[
                                  styles.rowMeta,
                                  { color: colors.textTertiary },
                                ]}
                              >
                                {profile.phone || "Sin telefono operativo"}
                              </Text>
                              {isProtectedProfile ? (
                                <Text
                                  style={[
                                    styles.rowMeta,
                                    { color: colors.warning },
                                  ]}
                                >
                                  El dueno no puede ser editado ni suspendido
                                  desde una cuenta administradora.
                                </Text>
                              ) : null}
                            </View>
                          </View>

                          {isProtectedProfile ? null : (
                            <View style={styles.staffActions}>
                              <Pressable
                                onPress={() => handleEditStaffProfile(profile)}
                                style={[
                                  styles.approveAction,
                                  {
                                    borderColor: colors.primary,
                                    backgroundColor: colors.cardBackground,
                                  },
                                ]}
                              >
                                <Text
                                  style={[
                                    styles.approveActionText,
                                    { color: colors.primary },
                                  ]}
                                >
                                  Editar ficha
                                </Text>
                              </Pressable>

                              <Pressable
                                onPress={() => handleToggleStatus(profile)}
                                style={[
                                  styles.approveAction,
                                  {
                                    borderColor:
                                      profile.status === "active"
                                        ? colors.warning
                                        : colors.success,
                                    backgroundColor: colors.cardBackground,
                                  },
                                ]}
                              >
                                <Text
                                  style={[
                                    styles.approveActionText,
                                    {
                                      color:
                                        profile.status === "active"
                                          ? colors.warning
                                          : colors.success,
                                    },
                                  ]}
                                >
                                  {profile.status === "active"
                                    ? "Suspender"
                                    : "Reactivar"}
                                </Text>
                              </Pressable>
                            </View>
                          )}
                        </View>
                      );
                    })}
                  </View>
                ) : (
                  <View
                    style={[
                      styles.emptyStateCard,
                      {
                        backgroundColor: colors.cardMuted,
                        borderColor: colors.border,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.emptyStateEyebrow,
                        { color: colors.accent },
                      ]}
                    >
                      Personal
                    </Text>
                    <Text
                      style={[
                        styles.emptyStateText,
                        { color: colors.textSecondary },
                      ]}
                    >
                      No hay personal tecnico registrado todavia.
                    </Text>
                  </View>
                )}
              </View>
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
    gap: spacing.xl,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: spacing.md,
  },
  headerCopy: {
    flex: 1,
    gap: spacing.sm,
  },
  kicker: {
    fontSize: rf(12),
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  title: {
    fontSize: rf(28),
    fontWeight: "900",
    letterSpacing: -0.8,
  },
  subtitle: {
    fontSize: rf(14),
    lineHeight: rf(20),
  },
  backButton: {
    borderWidth: 1,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  backButtonText: {
    fontSize: rf(12),
    fontWeight: "700",
  },
  panel: {
    borderWidth: 1,
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    gap: spacing.md,
  },
  membershipList: {
    gap: spacing.sm,
  },
  membershipRow: {
    borderWidth: 1,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: spacing.md,
  },
  membershipCopy: {
    flex: 1,
    gap: spacing.xs,
  },
  accessNotice: {
    borderWidth: 1,
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    gap: spacing.sm,
  },
  panelHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: spacing.md,
  },
  panelCopy: {
    flex: 1,
    gap: spacing.sm,
  },
  panelTitle: {
    fontSize: rf(16),
    fontWeight: "800",
  },
  panelText: {
    fontSize: rf(13),
    lineHeight: rf(19),
  },
  refreshButton: {
    borderWidth: 1,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
  },
  refreshButtonText: {
    fontSize: rf(12),
    fontWeight: "700",
  },
  workshopBadge: {
    borderWidth: 1,
    borderRadius: borderRadius.pill,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
  },
  workshopBadgeText: {
    fontSize: rf(12),
    fontWeight: "800",
  },
  formGroup: {
    gap: spacing.sm,
  },
  fieldLabel: {
    fontSize: rf(12),
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  input: {
    borderWidth: 1,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    fontSize: rf(14),
  },
  logoActionsRow: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  logoActionButton: {
    flex: 1,
  },
  notesInput: {
    minHeight: rf(92),
  },
  summaryPanel: {
    marginTop: spacing.lg,
    borderWidth: 1,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
  },
  resetPanel: {
    marginTop: spacing.sm,
    borderWidth: 1,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    gap: spacing.sm,
  },
  logoPreviewCard: {
    borderWidth: 1,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    gap: spacing.sm,
    alignItems: "center",
  },
  logoPreviewImage: {
    width: rf(96),
    height: rf(96),
    borderRadius: borderRadius.md,
    resizeMode: "contain",
  },
  logoPreviewText: {
    fontSize: rf(12),
    lineHeight: rf(17),
    textAlign: "center",
  },
  logoPlaceholderCard: {
    borderWidth: 1,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    gap: spacing.sm,
    alignItems: "center",
  },
  logoPlaceholderBadge: {
    minWidth: rf(92),
    minHeight: rf(92),
    borderWidth: 1,
    borderRadius: borderRadius.md,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing.sm,
  },
  logoPlaceholderInitials: {
    fontSize: rf(16),
    fontWeight: "900",
    letterSpacing: 1.2,
  },
  roleOptionRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  roleOption: {
    borderWidth: 1,
    borderRadius: borderRadius.pill,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
  },
  roleOptionText: {
    fontSize: rf(12),
    fontWeight: "700",
  },
  primaryAction: {
    borderRadius: borderRadius.md,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    alignItems: "center",
  },
  primaryActionText: {
    fontSize: rf(14),
    fontWeight: "800",
  },
  listGrid: {
    gap: spacing.md,
  },
  listCard: {
    borderWidth: 1,
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    gap: spacing.md,
  },
  listHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: spacing.md,
  },
  listTitle: {
    fontSize: rf(16),
    fontWeight: "800",
  },
  counterText: {
    fontSize: rf(16),
    fontWeight: "900",
  },
  listBody: {
    gap: spacing.sm,
  },
  listRow: {
    borderWidth: 1,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: spacing.md,
  },
  listCopy: {
    flex: 1,
    gap: spacing.sm,
  },
  listRowHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.md,
    borderBottomWidth: 1,
    paddingBottom: spacing.sm,
  },
  listHeaderCopy: { flex: 1, gap: 2 },
  listRowBody: { gap: 2 },
  rowEyebrow: {
    fontSize: rf(10),
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  rowTag: {
    fontSize: rf(11),
    fontWeight: "800",
  },
  staffActions: {
    gap: spacing.sm,
    alignItems: "flex-end",
  },
  rowTitle: {
    fontSize: rf(14),
    fontWeight: "800",
  },
  rowMeta: {
    fontSize: rf(12),
    lineHeight: rf(17),
  },
  secondaryAction: {
    borderWidth: 1,
    borderRadius: borderRadius.pill,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
  },
  secondaryActionText: {
    fontSize: rf(12),
    fontWeight: "700",
  },
  secondaryFilledAction: {
    borderWidth: 1,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    alignItems: "center",
  },
  secondaryFilledActionText: {
    fontSize: rf(13),
    fontWeight: "800",
  },
  dangerAction: {
    minHeight: rf(46),
    borderWidth: 1,
    borderRadius: borderRadius.lg,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing.md,
  },
  dangerActionText: {
    fontSize: rf(13),
    fontWeight: "800",
  },
  disabledAction: {
    opacity: 0.55,
  },
  approveAction: {
    borderWidth: 1,
    borderRadius: borderRadius.pill,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
  },
  approveActionText: {
    fontSize: rf(12),
    fontWeight: "800",
  },
  emptyStateCard: {
    borderWidth: 1,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    gap: spacing.xs,
  },
  emptyStateEyebrow: {
    fontSize: rf(10),
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  emptyStateText: {
    fontSize: rf(13),
    lineHeight: rf(19),
  },
  summaryText: {
    fontSize: rf(13),
    fontWeight: "600",
    lineHeight: rf(19),
  },
});
