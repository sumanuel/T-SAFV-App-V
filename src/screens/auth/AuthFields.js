import { Ionicons } from "@expo/vector-icons";
import { forwardRef } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { borderRadius, hs, rf, s, vs } from "../../utils/responsive";

export const TextField = forwardRef(function TextField(
  { palette, label, ...inputProps },
  ref,
) {
  return (
    <>
      <Text style={[styles.label, { color: palette.text }]}>{label}</Text>
      <TextInput
        ref={ref}
        style={[
          styles.input,
          {
            borderColor: palette.border,
            backgroundColor: palette.surfaceAlt,
            color: palette.text,
          },
        ]}
        placeholderTextColor={palette.placeholder}
        {...inputProps}
      />
    </>
  );
});

export const PasswordField = forwardRef(function PasswordField(
  { palette, label, visible, onToggleVisible, ...inputProps },
  ref,
) {
  return (
    <>
      <Text style={[styles.label, { color: palette.text }]}>{label}</Text>
      <View
        style={[
          styles.passwordField,
          {
            borderColor: palette.border,
            backgroundColor: palette.surfaceAlt,
          },
        ]}
      >
        <TextInput
          ref={ref}
          style={[styles.passwordInput, { color: palette.text }]}
          placeholderTextColor={palette.placeholder}
          secureTextEntry={!visible}
          autoCapitalize="none"
          {...inputProps}
        />
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={
            visible ? "Ocultar contraseña" : "Mostrar contraseña"
          }
          onPress={onToggleVisible}
          style={({ pressed }) => [
            styles.passwordEyeButton,
            pressed && styles.linkButtonPressed,
          ]}
        >
          <Ionicons
            color={palette.muted}
            name={visible ? "eye-off-outline" : "eye-outline"}
            size={rf(19)}
          />
        </Pressable>
      </View>
    </>
  );
});

const styles = StyleSheet.create({
  label: {
    fontSize: rf(13),
    fontWeight: "700",
    marginTop: vs(4),
  },
  input: {
    borderWidth: 1,
    borderRadius: borderRadius.md,
    borderCurve: "continuous",
    paddingHorizontal: hs(14),
    paddingVertical: vs(14),
    fontSize: rf(15),
  },
  passwordField: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: borderRadius.md,
    borderCurve: "continuous",
    paddingLeft: hs(14),
    paddingRight: hs(6),
  },
  passwordInput: {
    flex: 1,
    paddingVertical: vs(14),
    fontSize: rf(15),
  },
  passwordEyeButton: {
    width: s(38),
    height: s(38),
    borderRadius: s(19),
    alignItems: "center",
    justifyContent: "center",
  },
  linkButtonPressed: {
    opacity: 0.75,
  },
});
