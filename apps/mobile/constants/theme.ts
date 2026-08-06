// Single source of truth for colours/spacing. Screens must not hardcode hex.
export const COLORS = {
  primary: "#1E5F9E",
  primaryDark: "#154878",
  accent: "#F2A93B",
  statusBar: "#0F3557",
  screenBg: "#F4F6FB",
  surface: "#FFFFFF",
  surfaceAlt: "#EEF2F9",
  border: "#E2E8F0",
  text: "#1A202C",
  textMuted: "#6B7280",
  success: "#2E9E5B",
  warning: "#E6A700",
  danger: "#D64545",
  white: "#FFFFFF",
};

// Separate palette for the LED board mirror — it mimics a real departure
// board, so it stays dark regardless of the rest of the app.
export const BOARD = {
  bg: "#070B14",
  header: "#0E1626",
  row: "#0C1322",
  rowAlt: "#111B2E",
  grid: "#1C2942",
  amber: "#FFB020",
  cyan: "#38BDF8",
  dim: "#64748B",
  text: "#E8EEF9",
};

/**
 * Opaque status tints. Android paints an elevation shadow as a solid grey
 * block behind a translucent background, so anything carrying SHADOW must
 * tint itself from here instead of appending an alpha suffix to a colour.
 * Same rule for `opacity` on an elevated view — dim the text, not the card.
 */
export const TINT = {
  primary: "#EEF4FC",
  success: "#EFF8F2",
  warning: "#FFF8E7",
  danger: "#FDF2F2",
};

export const SPACING = { xs: 4, sm: 8, md: 16, lg: 24, xl: 32 };

export const RADIUS = { sm: 6, md: 10, lg: 16, xl: 22 };

export const SHADOW = {
  card: {
    shadowColor: "#0F172A",
    shadowOpacity: 0.06,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  lifted: {
    shadowColor: "#0F172A",
    shadowOpacity: 0.14,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 8 },
    elevation: 6,
  },
};
