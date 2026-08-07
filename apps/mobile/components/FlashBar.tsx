import { Feather } from "@expo/vector-icons";
import { useCallback, useEffect, useRef, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { COLORS, RADIUS, SPACING } from "../constants/theme";

/** How long an undo stays offered. Long enough to notice, short enough that
 *  the next bus does not inherit somebody else's undo. */
const HOLD_MS = 5000;

export function useFlash() {
  const [flash, setFlash] = useState<string | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clear = useCallback(() => {
    if (timer.current) clearTimeout(timer.current);
    setFlash(null);
  }, []);

  const show = useCallback((text: string) => {
    if (timer.current) clearTimeout(timer.current);
    setFlash(text);
    timer.current = setTimeout(() => setFlash(null), HOLD_MS);
  }, []);

  // The timer must not outlive the screen.
  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);

  return { flash, show, clear };
}

export default function FlashBar({
  text,
  onUndo,
}: {
  text: string;
  /** Omitted when the server says nothing is undoable — no dead button. */
  onUndo?: () => void;
}) {
  return (
    <View style={styles.bar}>
      <Feather name="check-circle" size={20} color={COLORS.success} />
      <Text style={styles.text} numberOfLines={1}>
        {text}
      </Text>
      {!!onUndo && (
        <Pressable style={styles.undo} onPress={onUndo} hitSlop={8}>
          <Feather name="rotate-ccw" size={13} color={COLORS.danger} />
          <Text style={styles.undoText}>UNDO</Text>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.sm,
    backgroundColor: COLORS.success + "14",
    borderWidth: 1,
    borderColor: COLORS.success + "55",
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.md,
    paddingVertical: 10,
  },
  text: { flex: 1, fontSize: 15, fontWeight: "800", color: COLORS.text },
  undo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
  },
  undoText: { color: COLORS.danger, fontWeight: "900", fontSize: 11, letterSpacing: 1 },
});
