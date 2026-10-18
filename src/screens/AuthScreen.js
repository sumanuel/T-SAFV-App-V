import { useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import {
  validateLoginForm,
  validateRegisterForm,
} from "../utils/authValidation";
import { borderRadius, rf, s, spacing, vs } from "../utils/responsive";
import AuthHero from "./auth/AuthHero";
import LoginForm from "./auth/LoginForm";
import ModeSwitch from "./auth/ModeSwitch";
import { buildAuthPalette } from "./auth/palette";
import RegisterForm from "./auth/RegisterForm";

const MODES = { login: "login", register: "register" };
const AUTH_ERROR_FALLBACK = "Error de autenticacion. Intenta de nuevo.";

export default function AuthScreen({ onNavigate }) {
  const { authBusy, signIn, signUp } = useAuth();
  const { colors, isDarkMode } = useTheme();
  const scrollRef = useRef(null);
  const [mode, setMode] = useState(MODES.login);
  const [error, setError] = useState(null);
  const [loginForm, setLoginForm] = useState({ email: "", password: "" });
  const [registerForm, setRegisterForm] = useState({
    fullName: "",
    phone: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const isRegister = mode === MODES.register;
  const palette = useMemo(
    () => buildAuthPalette(colors, isDarkMode),
    [colors, isDarkMode],
  );

  const scrollToFocusedInput = (y) => {
    requestAnimationFrame(() => {
      scrollRef.current?.scrollTo({ y, animated: true });
    });
  };

  const changeMode = (nextMode) => {
    setError(null);
    setMode(nextMode);
  };

  const submit = async (validate, form, action) => {
    setError(null);

    const validationError = validate(form);
    if (validationError) {
      setError(validationError);
      return;
    }

    try {
      await action(form);
    } catch (authError) {
      setError(authError?.message || AUTH_ERROR_FALLBACK);
    }
  };

  const handleLogin = () => submit(validateLoginForm, loginForm, signIn);
  const handleSignUp = () => submit(validateRegisterForm, registerForm, signUp);

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: palette.page }]}>
      <KeyboardAvoidingView
        style={styles.keyboardContainer}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? vs(24) : 0}
      >
        <ScrollView
          ref={scrollRef}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <AuthHero mode={mode} palette={palette} isDarkMode={isDarkMode} />

          <View
            style={[
              styles.formCard,
              { backgroundColor: palette.surface, shadowColor: palette.shadow },
            ]}
          >
            <ModeSwitch mode={mode} palette={palette} onChange={changeMode} />

            {isRegister ? (
              <RegisterForm
                palette={palette}
                form={registerForm}
                onChange={setRegisterForm}
                onSubmit={handleSignUp}
                onFocusScroll={scrollToFocusedInput}
              />
            ) : (
              <LoginForm
                palette={palette}
                form={loginForm}
                onChange={setLoginForm}
                onSubmit={handleLogin}
                onFocusScroll={scrollToFocusedInput}
              />
            )}

            {!!error && (
              <Text style={[styles.errorText, { color: palette.danger }]}>
                {error}
              </Text>
            )}

            <Pressable
              onPress={isRegister ? handleSignUp : handleLogin}
              disabled={authBusy}
              style={({ pressed }) => [
                styles.submitButton,
                { backgroundColor: palette.accent },
                authBusy && styles.submitButtonDisabled,
                pressed && styles.pressed,
              ]}
            >
              {authBusy ? (
                <ActivityIndicator color={palette.white} size="small" />
              ) : (
                <Text style={styles.submitButtonText}>
                  {isRegister ? "Crear cuenta" : "Entrar"}
                </Text>
              )}
            </Pressable>

            {!isRegister && (
              <View style={styles.secondaryLinks}>
                <Pressable
                  onPress={() =>
                    onNavigate?.("ForgotPasswordScreen", {
                      email: loginForm.email,
                    })
                  }
                  style={({ pressed }) => [
                    styles.linkButton,
                    pressed && styles.linkButtonPressed,
                  ]}
                >
                  <Text
                    style={[styles.linkButtonText, { color: palette.info }]}
                  >
                    Recuperar contrasena
                  </Text>
                </Pressable>
              </View>
            )}

            <Text style={[styles.securityHint, { color: palette.muted }]}>
              {isRegister
                ? "Si tu correo tiene una invitacion pendiente, la app la detectara despues del login para que aceptes el acceso desde tu estado de cuenta."
                : "Al continuar, tus datos locales se vinculan con tu espacio seguro en la nube."}
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  keyboardContainer: {
    flex: 1,
    padding: spacing.lg,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: "center",
    paddingBottom: vs(48),
    gap: vs(18),
  },
  formCard: {
    borderRadius: borderRadius.xl,
    borderCurve: "continuous",
    padding: spacing.lg,
    gap: vs(10),
    shadowOffset: { width: 0, height: s(8) },
    shadowOpacity: 0.08,
    shadowRadius: s(18),
    elevation: 8,
  },
  errorText: {
    fontSize: rf(13),
    fontWeight: "600",
    marginTop: vs(4),
  },
  submitButton: {
    marginTop: vs(12),
    borderRadius: borderRadius.md,
    borderCurve: "continuous",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: vs(15),
  },
  submitButtonDisabled: {
    opacity: 0.7,
  },
  submitButtonText: {
    color: "#ffffff",
    fontSize: rf(15),
    fontWeight: "800",
  },
  linkButton: {
    alignItems: "center",
    paddingTop: vs(8),
  },
  linkButtonPressed: {
    opacity: 0.75,
  },
  linkButtonText: {
    fontSize: rf(13),
    fontWeight: "700",
  },
  secondaryLinks: {
    gap: vs(4),
  },
  securityHint: {
    marginTop: vs(4),
    fontSize: rf(12),
    lineHeight: vs(18),
    textAlign: "center",
  },
  pressed: {
    opacity: 0.9,
    transform: [{ scale: 0.99 }],
  },
});
