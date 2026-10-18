import { Pressable, StyleSheet, Text, View } from "react-native";
import { borderRadius, rf, s, vs } from "../../utils/responsive";

const OPTIONS = [
  { mode: "login", label: "Iniciar sesion" },
  { mode: "register", label: "Registrarme" },
];

export default function ModeSwitch({ mode, palette, onChange }) {
  return (
    <View style={[styles.modeSwitch, { backgroundColor: palette.surfaceAlt }]}>
      {OPTIONS.map((option) => {
        const active = mode === option.mode;
        return (
          <Pressable
            key={option.mode}
            accessibilityRole="tab"
            accessibilityState={{ selected: active }}
            onPress={() => onChange(option.mode)}
            style={({ pressed }) => [
              styles.modeButton,
              active && [
                styles.modeButtonActive,
                { backgroundColor: palette.accent },
              ],
              pressed && styles.pressed,
            ]}
          >
            <Text
              style={[
                styles.modeButtonText,
                { color: palette.muted },
                active && [
                  styles.modeButtonTextActive,
                  { color: palette.white },
                ],
              ]}
            >
              {option.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  modeSwitch: {
    flexDirection: "row",
    borderRadius: borderRadius.lg,
    borderCurve: "continuous",
    padding: s(4),
    marginBottom: vs(8),
  },
  modeButton: {
    flex: 1,
    borderRadius: borderRadius.md,
    borderCurve: "continuous",
    paddingVertical: vs(12),
    alignItems: "center",
  },
  modeButtonActive: {
    backgroundColor: "#000000",
  },
  modeButtonText: {
    fontSize: rf(14),
    fontWeight: "700",
  },
  modeButtonTextActive: {
    color: "#ffffff",
  },
  pressed: {
    opacity: 0.9,
    transform: [{ scale: 0.99 }],
  },
});
