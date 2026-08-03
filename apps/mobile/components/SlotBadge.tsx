import { StyleSheet, Text, View } from "react-native";
import { LABELS } from "../constants/domain";
import { COLORS, RADIUS } from "../constants/theme";

/** The station number is what a student reads off the board — make it big. */
export default function SlotBadge({
  slot,
  size = "md",
  tone = "light",
}: {
  slot: number | null;
  size?: "sm" | "md" | "lg";
  tone?: "light" | "solid";
}) {
  const dim = { sm: 34, md: 46, lg: 60 }[size];
  const font = { sm: 15, md: 21, lg: 28 }[size];
  const solid = tone === "solid";

  return (
    <View
      style={[
        styles.box,
        {
          width: dim,
          height: dim,
          backgroundColor: solid ? COLORS.primary : COLORS.surfaceAlt,
          borderColor: solid ? COLORS.primary : COLORS.border,
        },
      ]}
    >
      <Text
        style={[
          styles.num,
          { fontSize: font, color: solid ? COLORS.white : COLORS.primary },
        ]}
      >
        {slot ?? "–"}
      </Text>
      {size !== "sm" && (
        <Text style={[styles.cap, { color: solid ? COLORS.white : COLORS.textMuted }]}>
          {LABELS.slot.toUpperCase()}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    borderRadius: RADIUS.md,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  num: { fontWeight: "900", lineHeight: undefined },
  cap: { fontSize: 7, fontWeight: "800", letterSpacing: 0.8, opacity: 0.8 },
});
