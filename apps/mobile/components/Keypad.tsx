import { Feather } from "@expo/vector-icons";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { COLORS, RADIUS, SPACING } from "../constants/theme";

/**
 * Big number pad for the gate screens. A guard is standing in the sun with a
 * bus rolling towards him — no soft keyboard, no small targets, two keys of
 * chrome at most.
 */
export default function Keypad({
  value,
  onChange,
  maxLength = 2,
}: {
  value: string;
  onChange: (next: string) => void;
  maxLength?: number;
}) {
  const press = (key: string) => {
    if (key === "clear") return onChange("");
    if (key === "back") return onChange(value.slice(0, -1));
    if (value.length >= maxLength) return;
    onChange(value + key);
  };

  return (
    <View style={styles.pad}>
      {[
        ["1", "2", "3"],
        ["4", "5", "6"],
        ["7", "8", "9"],
        ["clear", "0", "back"],
      ].map((row) => (
        <View key={row.join()} style={styles.row}>
          {row.map((key) => (
            <Pressable
              key={key}
              style={({ pressed }) => [
                styles.key,
                key !== "0" && key.length > 1 && styles.keyAlt,
                pressed && styles.keyPressed,
              ]}
              onPress={() => press(key)}
            >
              {key === "back" ? (
                <Feather name="delete" size={24} color={COLORS.danger} />
              ) : key === "clear" ? (
                <Text style={styles.clearText}>C</Text>
              ) : (
                <Text style={styles.keyText}>{key}</Text>
              )}
            </Pressable>
          ))}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  pad: { gap: SPACING.sm },
  row: { flexDirection: "row", gap: SPACING.sm },
  key: {
    flex: 1,
    height: 58,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: "center",
    justifyContent: "center",
  },
  keyAlt: { backgroundColor: COLORS.surfaceAlt },
  keyPressed: { backgroundColor: COLORS.primary + "1A", borderColor: COLORS.primary },
  keyText: { fontSize: 26, fontWeight: "800", color: COLORS.text },
  clearText: { fontSize: 20, fontWeight: "900", color: COLORS.textMuted },
});
