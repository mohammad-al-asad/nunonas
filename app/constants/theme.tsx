// @ts-nocheck
export const COLORS = {
  // Brand Colors
  primary: "#1e3a8a", // Dark Blue (Buttons)
  secondary: "#3b82f6", // Bright Blue (Forgot Password)
  accent: "#4f46e5", // Indigo (Pagination Dots)

  // Neutral Colors
  white: "#ffffff",
  black: "#000000",
  background: "#ffffff",
  surface: "#f8fafc", // Lightest Slate (Input Background)
  card: "#f1f5f9", // Light Slate (Container Background)

  // Text Colors
  textPrimary: "#0f172a", // Slate 900 (Titles)
  textSecondary: "#64748b", // Slate 500 (Subtitles/Labels)
  textPlaceholder: "#000000", // Black as requested
  textLink: "#1d4ed8", // Blue 700 (Footer links)
  textWhite: "#ffffff",

  // UI State Colors
  border: "#e2e8f0", // Slate 200
  divider: "#e2e8f0",
  error: "#ef4444",
  success: "#22c55e",
};

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 40,
  containerPadding: 25,
};

export const TYPOGRAPHY = {
  h1: {
    fontSize: 32,
    fontWeight: "800",
    lineHeight: 40,
  },
  h2: {
    fontSize: 28,
    fontWeight: "800",
    lineHeight: 34,
  },
  subtitle: {
    fontSize: 16,
    fontWeight: "400",
    lineHeight: 24,
  },
  label: {
    fontSize: 15,
    fontWeight: "600",
  },
  body: {
    fontSize: 16,
    fontWeight: "400",
  },
  button: {
    fontSize: 18,
    fontWeight: "700",
  },
  caption: {
    fontSize: 14,
    fontWeight: "600",
  },
};

export const SHADOWS = {
  primary: {
    shadowColor: "#1e3a8a",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 3,
  },
  card: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
};

const theme = {
  COLORS,
  SPACING,
  TYPOGRAPHY,
  SHADOWS,
};

export default theme;


