import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../context/ThemeContext";
import { apiResetPassword } from "../services/auth/resetPasswordService";

export default function ResetPasswordScreen({ onNavigate, screenContext }) {
  const { colors } = useTheme();
  const email = screenContext?.email || "";
  const resetToken = screenContext?.resetToken || "";

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const styles = getStyles(colors);

  function validatePasswords() {
    if (!password || password.trim().length === 0) {
      return "La contraseña es requerida";
    }
    if (password.length < 8) {
      return "La contraseña debe tener al menos 8 caracteres";
    }
    if (!confirmPassword || confirmPassword.trim().length === 0) {
      return "Confirma tu contraseña";
    }
    if (password !== confirmPassword) {
      return "Las contraseñas no coinciden";
    }
    return null;
  }

  async function handleSubmit() {
    const validationError = validatePasswords();
    if (validationError) {
      setError(validationError);
      return;
    }

    if (!resetToken) {
      setError("Token de reseteo inválido");
      return;
    }

    setError(null);
    setLoading(true);

    try {
      await apiResetPassword(resetToken, password);

      // Mostrar alerta de éxito y navegar a login
      Alert.alert(
        "✅ Contraseña actualizada",
        "Tu contraseña ha sido actualizada exitosamente. Ahora puedes iniciar sesión.",
        [
          {
            text: "Iniciar sesión",
            onPress: () => onNavigate("AuthScreen", { email }),
          },
        ],
        { cancelable: false },
      );
    } catch (err) {
      console.error(err);
      setError(err.message || "Error al actualizar contraseña");
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => onNavigate("VerifyCodeScreen", { email })}
          >
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Nueva contraseña</Text>
        </View>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          {/* Icon */}
          <View style={styles.iconContainer}>
            <Ionicons name="key-outline" size={64} color={colors.primary} />
          </View>

          {/* Title */}
          <Text style={styles.title}>Crea una nueva contraseña</Text>
          <Text style={styles.subtitle}>
            Ingresa una nueva contraseña segura para tu cuenta.
          </Text>

          {/* Password Input */}
          <View style={styles.fieldContainer}>
            <Text style={styles.label}>Nueva contraseña</Text>
            <View
              style={[
                styles.inputWrapper,
                error &&
                  error.includes("contraseña") &&
                  styles.inputWrapperError,
              ]}
            >
              <Ionicons
                name="lock-closed-outline"
                size={20}
                color={colors.textSecondary}
                style={styles.inputIcon}
              />
              <TextInput
                style={styles.input}
                value={password}
                onChangeText={(text) => {
                  setPassword(text);
                  if (error) setError(null);
                }}
                placeholder="Mínimo 8 caracteres"
                placeholderTextColor={colors.textTertiary}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                autoCorrect={false}
                editable={!loading}
              />
              <TouchableOpacity
                onPress={() => setShowPassword(!showPassword)}
                style={styles.eyeButton}
              >
                <Ionicons
                  name={showPassword ? "eye-off-outline" : "eye-outline"}
                  size={20}
                  color={colors.textSecondary}
                />
              </TouchableOpacity>
            </View>
            {password.length > 0 && password.length < 8 && (
              <Text style={styles.hintText}>
                {8 - password.length} caracteres más
              </Text>
            )}
          </View>

          {/* Confirm Password Input */}
          <View style={styles.fieldContainer}>
            <Text style={styles.label}>Confirmar contraseña</Text>
            <View
              style={[
                styles.inputWrapper,
                error &&
                  error.includes("coinciden") &&
                  styles.inputWrapperError,
              ]}
            >
              <Ionicons
                name="lock-closed-outline"
                size={20}
                color={colors.textSecondary}
                style={styles.inputIcon}
              />
              <TextInput
                style={styles.input}
                value={confirmPassword}
                onChangeText={(text) => {
                  setConfirmPassword(text);
                  if (error) setError(null);
                }}
                placeholder="Repite la contraseña"
                placeholderTextColor={colors.textTertiary}
                secureTextEntry={!showConfirmPassword}
                autoCapitalize="none"
                autoCorrect={false}
                editable={!loading}
              />
              <TouchableOpacity
                onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                style={styles.eyeButton}
              >
                <Ionicons
                  name={showConfirmPassword ? "eye-off-outline" : "eye-outline"}
                  size={20}
                  color={colors.textSecondary}
                />
              </TouchableOpacity>
            </View>
            {confirmPassword.length > 0 && password !== confirmPassword && (
              <Text style={styles.errorText}>Las contraseñas no coinciden</Text>
            )}
          </View>

          {/* General Error */}
          {error && <Text style={styles.errorText}>{error}</Text>}

          {/* Submit Button */}
          <TouchableOpacity
            style={[
              styles.submitButton,
              loading && styles.submitButtonDisabled,
            ]}
            onPress={handleSubmit}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.submitButtonText}>Guardar contraseña</Text>
            )}
          </TouchableOpacity>

          {/* Password Requirements */}
          <View style={styles.requirementsBox}>
            <Text style={styles.requirementsTitle}>
              Requisitos de contraseña:
            </Text>
            <View style={styles.requirement}>
              <Ionicons
                name={
                  password.length >= 8 ? "checkmark-circle" : "ellipse-outline"
                }
                size={18}
                color={
                  password.length >= 8 ? colors.success : colors.textSecondary
                }
              />
              <Text style={styles.requirementText}>Mínimo 8 caracteres</Text>
            </View>
            <View style={styles.requirement}>
              <Ionicons
                name={
                  password === confirmPassword && password.length > 0
                    ? "checkmark-circle"
                    : "ellipse-outline"
                }
                size={18}
                color={
                  password === confirmPassword && password.length > 0
                    ? colors.success
                    : colors.textSecondary
                }
              />
              <Text style={styles.requirementText}>
                Las contraseñas coinciden
              </Text>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function getStyles(colors) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    header: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    backButton: {
      padding: 8,
      marginRight: 8,
    },
    headerTitle: {
      fontSize: 18,
      fontWeight: "600",
      color: colors.text,
    },
    scrollContent: {
      padding: 24,
    },
    iconContainer: {
      alignItems: "center",
      marginBottom: 24,
    },
    title: {
      fontSize: 24,
      fontWeight: "bold",
      color: colors.text,
      marginBottom: 12,
      textAlign: "center",
    },
    subtitle: {
      fontSize: 15,
      color: colors.textSecondary,
      marginBottom: 32,
      textAlign: "center",
      lineHeight: 22,
    },
    fieldContainer: {
      marginBottom: 20,
    },
    label: {
      fontSize: 14,
      fontWeight: "600",
      color: colors.text,
      marginBottom: 8,
    },
    inputWrapper: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: colors.inputBackground || colors.cardBackground,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 8,
      paddingHorizontal: 12,
    },
    inputWrapperError: {
      borderColor: colors.danger,
    },
    inputIcon: {
      marginRight: 10,
    },
    input: {
      flex: 1,
      paddingVertical: 14,
      fontSize: 16,
      color: colors.text,
    },
    eyeButton: {
      padding: 8,
    },
    hintText: {
      fontSize: 12,
      color: colors.textSecondary,
      marginTop: 6,
    },
    errorText: {
      fontSize: 12,
      color: colors.danger,
      marginTop: 6,
    },
    submitButton: {
      backgroundColor: colors.primary,
      paddingVertical: 16,
      borderRadius: 8,
      alignItems: "center",
      marginBottom: 24,
      marginTop: 12,
    },
    submitButtonDisabled: {
      opacity: 0.6,
    },
    submitButtonText: {
      color: "#fff",
      fontSize: 16,
      fontWeight: "600",
    },
    requirementsBox: {
      backgroundColor: colors.cardBackground,
      padding: 16,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: colors.border,
    },
    requirementsTitle: {
      fontSize: 13,
      fontWeight: "600",
      color: colors.text,
      marginBottom: 12,
    },
    requirement: {
      flexDirection: "row",
      alignItems: "center",
      marginBottom: 8,
    },
    requirementText: {
      fontSize: 13,
      color: colors.textSecondary,
      marginLeft: 8,
    },
  });
}
