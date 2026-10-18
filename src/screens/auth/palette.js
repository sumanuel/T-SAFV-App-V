export function buildAuthPalette(colors, isDarkMode) {
  return {
    page: colors.background,
    surface: colors.cardBackground,
    surfaceAlt: colors.cardMuted,
    // Mismo azul que el header (WorkshopScreenHeader) para mantener
    // consistencia visual entre pantallas.
    accent: isDarkMode ? "#1350a7" : "#0f5fd2",
    accentStrong: colors.primaryStrong,
    accentSoft: isDarkMode
      ? "rgba(255,255,255,0.12)"
      : "rgba(255,255,255,0.16)",
    text: colors.text,
    muted: colors.textSecondary,
    placeholder: colors.textTertiary,
    border: colors.border,
    borderStrong: colors.borderStrong,
    danger: colors.danger,
    info: colors.primaryStrong,
    white: colors.white,
    shadow: colors.shadow,
  };
}
