import React, { useState, useRef, useEffect } from "react";
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
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../context/ThemeContext";
import { apiVerifyResetCode } from "../services/auth/verifyCodeService";
import { apiForgotPassword } from "../services/auth/forgotPasswordService";

export default function VerifyCodeScreen({ onNavigate, screenContext }) {
  const { colors } = useTheme();
  const email = screenContext?.email || "";

  const [code, setCode] = useState(["", "", "", "", "", ""]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  const inputRefs = useRef([]);

  const styles = getStyles(colors);

  // Countdown para reenviar código
  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(
        () => setResendCooldown(resendCooldown - 1),
        1000,
      );
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

  // Auto-focus en el primer campo al montar
  useEffect(() => {
    if (inputRefs.current[0]) {
      setTimeout(() => inputRefs.current[0].focus(), 300);
    }
  }, []);

  function handleCodeChange(index, value) {
    // Solo permitir números
    const numericValue = value.replace(/[^0-9]/g, "");

    const newCode = [...code];
    newCode[index] = numericValue.slice(0, 1); // Solo 1 dígito
    setCode(newCode);
    setError(null);

    // Auto-focus al siguiente campo
    if (numericValue && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  }

  function handleKeyPress(index, event) {
    // Si presiona backspace y el campo está vacío, ir al anterior
    if (event.nativeEvent.key === "Backspace" && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  }

  async function handleVerify() {
    const fullCode = code.join("");

    if (fullCode.length !== 6) {
      setError("El código debe tener 6 dígitos");
      return;
    }

    setError(null);
    setLoading(true);

    try {
      const response = await apiVerifyResetCode(email, fullCode);

      // Navegar a ResetPasswordScreen con resetToken
      onNavigate("ResetPasswordScreen", {
        email,
        resetToken: response.resetToken,
      });
    } catch (err) {
      console.error(err);
      setError(err.message || "Error al verificar código");
    } finally {
      setLoading(false);
    }
  }

  async function handleResendCode() {
    if (resendCooldown > 0) return;

    setError(null);
    setLoading(true);

    try {
      await apiForgotPassword(email);
      setResendCooldown(30); // 30 segundos de cooldown
      setCode(["", "", "", "", "", ""]);
      inputRefs.current[0]?.focus();
    } catch (err) {
      console.error(err);
      setError(err.message || "Error al reenviar código");
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
            onPress={() => onNavigate("ForgotPasswordScreen", { email })}
          >
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Verificar código</Text>
        </View>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          {/* Icon */}
          <View style={styles.iconContainer}>
            <Ionicons
              name="mail-open-outline"
              size={64}
              color={colors.primary}
            />
          </View>

          {/* Title */}
          <Text style={styles.title}>Verifica tu email</Text>
          <Text style={styles.subtitle}>
            Ingresa el código de 6 dígitos que enviamos a:
          </Text>
          <Text style={styles.emailText}>{email}</Text>

          {/* Code Inputs */}
          <View style={styles.codeContainer}>
            {code.map((digit, index) => (
              <TextInput
                key={index}
                ref={(ref) => (inputRefs.current[index] = ref)}
                style={[styles.codeInput, error && styles.codeInputError]}
                value={digit}
                onChangeText={(value) => handleCodeChange(index, value)}
                onKeyPress={(event) => handleKeyPress(index, event)}
                keyboardType="number-pad"
                maxLength={1}
                editable={!loading}
                selectTextOnFocus
              />
            ))}
          </View>

          {error && <Text style={styles.errorText}>{error}</Text>}

          {/* Verify Button */}
          <TouchableOpacity
            style={[
              styles.submitButton,
              loading && styles.submitButtonDisabled,
            ]}
            onPress={handleVerify}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.submitButtonText}>Verificar</Text>
            )}
          </TouchableOpacity>

          {/* Resend Code */}
          <View style={styles.resendContainer}>
            <Text style={styles.resendText}>¿No recibiste el código?</Text>
            <TouchableOpacity
              onPress={handleResendCode}
              disabled={loading || resendCooldown > 0}
            >
              <Text
                style={[
                  styles.resendLink,
                  (loading || resendCooldown > 0) && styles.resendLinkDisabled,
                ]}
              >
                {resendCooldown > 0
                  ? `Reenviar código (${resendCooldown}s)`
                  : "Reenviar código →"}
              </Text>
            </TouchableOpacity>
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
      textAlign: "center",
      marginBottom: 8,
    },
    emailText: {
      fontSize: 16,
      fontWeight: "600",
      color: colors.primary,
      textAlign: "center",
      marginBottom: 32,
    },
    codeContainer: {
      flexDirection: "row",
      justifyContent: "center",
      gap: 8,
      marginBottom: 16,
    },
    codeInput: {
      width: 48,
      height: 56,
      backgroundColor: colors.inputBackground || colors.cardBackground,
      borderWidth: 2,
      borderColor: colors.border,
      borderRadius: 8,
      fontSize: 24,
      fontWeight: "bold",
      textAlign: "center",
      color: colors.text,
    },
    codeInputError: {
      borderColor: colors.danger,
    },
    errorText: {
      fontSize: 13,
      color: colors.danger,
      marginBottom: 16,
      textAlign: "center",
    },
    submitButton: {
      backgroundColor: colors.primary,
      paddingVertical: 16,
      borderRadius: 8,
      alignItems: "center",
      marginBottom: 24,
    },
    submitButtonDisabled: {
      opacity: 0.6,
    },
    submitButtonText: {
      color: "#fff",
      fontSize: 16,
      fontWeight: "600",
    },
    resendContainer: {
      alignItems: "center",
      marginTop: 16,
    },
    resendText: {
      fontSize: 14,
      color: colors.textSecondary,
      marginBottom: 8,
    },
    resendLink: {
      fontSize: 15,
      color: colors.primary,
      fontWeight: "600",
    },
    resendLinkDisabled: {
      opacity: 0.5,
    },
  });
}
