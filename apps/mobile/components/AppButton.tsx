import { ActivityIndicator, Pressable, StyleSheet, Text } from "react-native";
import { COLORS, RADIUS, SPACING } from "../constants/theme";

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
  return (
    <Pressable
      onPress={onPress}
      disabled={off}
      style={({ pressed }) => [
        styles.base,
        outline ? styles.outline : styles.primary,
        (off || pressed) && { opacity: off ? 0.5 : 0.8 },
      ]}
    >
      {loading ? (
        <ActivityIndicator color={outline ? COLORS.primary : COLORS.white} />
      ) : (
        <Text style={[styles.text, outline && { color: COLORS.primary }]}>{title}</Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    // Matches the 52px input height so a form reads as one stack.
    height: 52,
    borderRadius: RADIUS.md,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: SPACING.lg,
  },
  primary: { backgroundColor: COLORS.primary },
  outline: { borderWidth: 1, borderColor: COLORS.primary },
  text: { color: COLORS.white, fontWeight: "800", fontSize: 16 },
});
