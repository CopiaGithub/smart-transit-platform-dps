// Single source of truth for colours/spacing. Screens must not hardcode hex.
//
// The palette is the web's, ported token for token from
// `apps/frontend/src/theme/argon-tokens.css` so the two products read as one
// system. When a colour changes, change it there first and follow here — the
// web is the reference, this is the copy.
export const COLORS = {
  primary: "#12855C", // --argon-primary
  primaryDark: "#0D6B49", // --argon-primary-dark
  // Warm amber against the emerald: it marks reserve buses at the gate, which
  // must never be mistaken for a normal one. Green-on-green would do exactly that.
  accent: "#F2A93B",
  statusBar: "#0A3A2A", // --argon-tw-blue-900, the darkest step of the brand scale
  screenBg: "#F8F9FE", // --argon-body-bg
  surface: "#FFFFFF",
  surfaceAlt: "#F6F9FC", // --argon-gray-100
  border: "#E9ECEF", // --argon-border-color
  text: "#32325D", // --argon-heading-color
  textMuted: "#525F7F", // --argon-body-color
  // These three deliberately keep their own values instead of --argon-success /
  // --argon-danger. On the web those are badge *fills* with their own text on
  // top; here the same tokens are used as text colours on white, and the web
  // pair does not survive that: #2dce89 reads ~2:1 and #f5365c ~3.8:1, both
  // under the 4.5:1 a 12px label needs. These stay legible. `success` is told
  // apart from `primary` by lightness rather than hue.
  success: "#2E9E5B",
  warning: "#E6A700",
  danger: "#D64545",
  white: "#FFFFFF",
};

/**
 * Brand gradient, deep emerald -> mid green. Used by the sign-in hero and the
 * primary CTA so the two read as one surface. Mirrors the web's
 * --argon-gradient-primary (#12855c -> #1aa06b).
 */
export const GRADIENT = {
  brand: ["#12855C", "#1AA06B"] as const,
  brandWide: ["#0C6043", "#12855C", "#1AA06B"] as const,
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
  primary: "#E7F6EF", // --argon-primary-muted
  success: "#EFF8F2",
  warning: "#FFF8E7",
  danger: "#FDF2F2",
  // Not a brand tint. Once `primary` went green, "Arrived" and "Departed" on the
  // parent's card were both pale green — two states of one card that a parent
  // reads at a glance. Arrived keeps this blue, which also matches its own
  // STATUS_COLOR.Arrived label rather than fighting it.
  info: "#EEF4FC",
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
