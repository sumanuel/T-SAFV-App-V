import { Ionicons } from "@expo/vector-icons";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "../../context/ThemeContext";
import { borderRadius, rf, spacing } from "../../utils/responsive";

const tabConfig = [
  { key: "home", label: "Inicio", icon: "home-outline", activeIcon: "home" },
  {
    key: "clients",
    label: "Clientes",
    icon: "people-outline",
    activeIcon: "people",
  },
  {
    key: "diagnostics",
    label: "Diag.",
    icon: "pulse-outline",
    activeIcon: "pulse",
  },
  {
    key: "work-orders",
    label: "Ordenes",
    icon: "clipboard-outline",
    activeIcon: "clipboard",
  },
  {
    key: "more",
    label: "Mas",
    icon: "ellipsis-horizontal-circle-outline",
    activeIcon: "ellipsis-horizontal-circle",
  },
];

export default function WorkshopTabBar({ activeTab, onChange, visibleTabs }) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const renderedTabs = Array.isArray(visibleTabs)
    ? tabConfig.filter((tab) => visibleTabs.includes(tab.key))
    : tabConfig;

  return (
    <View
      style={[
        styles.shell,
        {
          backgroundColor: colors.background,
          borderTopColor: colors.border,
          paddingBottom: Math.max(insets.bottom, spacing.xs),
        },
      ]}
    >
      <View
        style={[
          styles.container,
          {
            backgroundColor: colors.cardBackground,
            borderColor: colors.border,
          },
        ]}
      >
        {renderedTabs.map((tab) => {
          const selected = activeTab === tab.key;
          return (
            <Pressable
              key={tab.key}
              onPress={() => onChange?.(tab.key)}
              style={styles.tabButton}
            >
              <View
                style={[
                  styles.iconWrap,
                  {
                    backgroundColor: selected ? colors.primary : "transparent",
                  },
                ]}
              >
                <Ionicons
                  color={selected ? colors.white : colors.textTertiary}
                  name={selected ? tab.activeIcon : tab.icon}
                  size={rf(19)}
                />
              </View>
              <Text
                style={[
                  styles.tabLabel,
                  { color: selected ? colors.primary : colors.textTertiary },
                ]}
              >
                {tab.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  shell: {
    borderTopWidth: 1,
    paddingTop: spacing.xs,
    paddingHorizontal: spacing.md,
  },
  container: {
    flexDirection: "row",
    borderWidth: 1,
    borderRadius: borderRadius.xl,
    overflow: "hidden",
  },
  tabButton: {
    flex: 1,
    alignItems: "center",
    paddingVertical: spacing.sm,
    gap: spacing.xs / 2,
  },
  iconWrap: {
    width: rf(36),
    height: rf(36),
    borderRadius: borderRadius.pill,
    alignItems: "center",
    justifyContent: "center",
  },
  tabLabel: {
    fontSize: rf(10),
    fontWeight: "700",
    letterSpacing: 0.2,
  },
});
