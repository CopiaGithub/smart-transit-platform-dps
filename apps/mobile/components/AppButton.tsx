import { LinearGradient } from "expo-linear-gradient";
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";
import { COLORS, GRADIENT, RADIUS, SPACING } from "../constants/theme";

type Props = {
  title: string;
  onPress: () => void;
  variant?: "primary" | "outline";
  loading?: boolean;
  disabled?: boolean;
};

export default function AppButton({
  title,
  onPress,
  variant = "primary",
  loading = false,
  disabled = false,
}: Props) {
  const outline = variant === "outline";
  const off = disabled || loading;

  const label = loading ? (
    <ActivityIndicator color={outline ? COLORS.primary : COLORS.white} />
  ) : (
    <Text style={[styles.text, outline && styles.textOutline]}>{title}</Text>
  );

  return (
    <View style={[styles.shell, off && styles.shellOff]}>
      <Pressable
        onPress={onPress}
        disabled={off}
        android_ripple={{ color: "#FFFFFF33", borderless: false }}
        style={({ pressed }) => [
          styles.press,
          outline && styles.outline,
          // Instant, GPU-cheap press feedback — no animation driver needed.
          pressed && !off && styles.pressed,
        ]}
      >
        {outline ? (
          label
        ) : (
          <LinearGradient
            colors={GRADIENT.brand}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.fill}
          >
            {label}
          </LinearGradient>
        )}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  // Shadow lives on an opaque wrapper so Android never paints it as a block.
  shell: {
    borderRadius: RADIUS.md + 2,
    backgroundColor: COLORS.surface,
    shadowColor: GRADIENT.brand[0],
    shadowOpacity: 0.28,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
    elevation: 4,
  },
  shellOff: { shadowOpacity: 0, elevation: 0, opacity: 0.45 },
  press: {
    height: 54,
    borderRadius: RADIUS.md + 2,
    overflow: "hidden",
    justifyContent: "center",
  },
  pressed: { transform: [{ scale: 0.985 }], opacity: 0.92 },
  fill: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: SPACING.lg,
  },
  outline: {
    borderWidth: 1.5,
    borderColor: COLORS.primary,
    alignItems: "center",
    backgroundColor: COLORS.surface,
  },
  text: { color: COLORS.white, fontWeight: "800", fontSize: 16, letterSpacing: 0.3 },
  textOutline: { color: COLORS.primary },
});
