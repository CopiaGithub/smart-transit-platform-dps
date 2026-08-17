import { Feather } from "@expo/vector-icons";
import { Modal, Pressable, StyleSheet, Text, View } from "react-native";
import { COLORS, RADIUS, SHADOW, SPACING, TINT } from "../constants/theme";

type Tone = "warning" | "danger" | "primary";

const TONE: Record<Tone, { colour: string; tint: string }> = {
  warning: { colour: COLORS.warning, tint: TINT.warning },
  danger: { colour: COLORS.danger, tint: TINT.danger },
  primary: { colour: COLORS.primary, tint: TINT.primary },
};

/**
 * The app's own "are you sure", in place of the platform Alert.
 *
 * Alert is faster to write and it is what the gate screens still use, but it
 * cannot carry the one thing these questions turn on: *what* is about to
 * happen and to how many children. A grey system box with two identical blue
 * words reads the same whether it is asking about a typo or about a bus, and
 * on a phone held at arm's length in a yard that is the whole decision.
 *
 * So: the tone colours the icon and the confirm button, and `highlight` puts
 * the number that matters where the eye lands first.
 *
 * Built on the same Modal + backdrop as PickerChip, so it inherits that
 * screen's dismissal behaviour rather than inventing a second one.
 */
export default function ConfirmSheet({
  visible,
  title,
  message,
  highlight,
  confirmText,
  cancelText = "Cancel",
  tone = "warning",
  icon = "alert-triangle",
  onConfirm,
  onCancel,
}: {
  visible: boolean;
  title: string;
  message: string;
  /** The number the question turns on — "3 of 3 students". Optional. */
  highlight?: string;
  confirmText: string;
  cancelText?: string;
  tone?: Tone;
  icon?: React.ComponentProps<typeof Feather>["name"];
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const { colour, tint } = TONE[tone];

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      {/* The backdrop cancels. Same rule as PickerChip: a thumb that opened
          this by accident must not have to aim at anything to get out — and
          cancelling is always the safe half of these questions. */}
      <Pressable style={styles.backdrop} onPress={onCancel}>
        <Pressable style={styles.sheet} onPress={() => {}}>
          <View style={[styles.badge, { backgroundColor: tint }]}>
            <Feather name={icon} size={26} color={colour} />
          </View>

          <Text style={styles.title}>{title}</Text>

          {!!highlight && (
            <View style={[styles.highlight, { backgroundColor: tint, borderColor: colour + "55" }]}>
              <Text style={[styles.highlightText, { color: colour }]}>{highlight}</Text>
            </View>
          )}

          <Text style={styles.message}>{message}</Text>

          {/* Cancel first and full width apiece: the confirm is the one that
              cannot be taken back, so it does not get the corner a thumb rests
              on. Neither is styled as the obvious default. */}
          <View style={styles.actions}>
            <Pressable
              style={({ pressed }) => [styles.btn, styles.cancel, pressed && styles.cancelPressed]}
              onPress={onCancel}
              accessibilityRole="button"
            >
              <Text style={styles.cancelText}>{cancelText}</Text>
            </Pressable>

            <Pressable
              style={({ pressed }) => [
                styles.btn,
                { backgroundColor: colour },
                pressed && styles.confirmPressed,
              ]}
              onPress={onConfirm}
              accessibilityRole="button"
            >
              <Text style={styles.confirmText}>{confirmText}</Text>
            </Pressable>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "#0F172A99",
    justifyContent: "center",
    padding: SPACING.lg,
  },
  sheet: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    alignItems: "center",
    gap: SPACING.sm,
    ...SHADOW.lifted,
  },

  badge: {
    width: 58,
    height: 58,
    borderRadius: 29,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: SPACING.xs,
  },

  title: {
    fontSize: 18,
    fontWeight: "900",
    color: COLORS.text,
    textAlign: "center",
  },

  highlight: {
    borderRadius: RADIUS.md,
    borderWidth: 1,
    paddingHorizontal: SPACING.md,
    paddingVertical: 6,
  },
  highlightText: { fontSize: 14, fontWeight: "900", letterSpacing: 0.3 },

  message: {
    fontSize: 14,
    lineHeight: 21,
    color: COLORS.textMuted,
    textAlign: "center",
  },

  actions: {
    flexDirection: "row",
    gap: SPACING.sm,
    alignSelf: "stretch",
    marginTop: SPACING.sm,
  },
  btn: {
    flex: 1,
    height: 50,
    borderRadius: RADIUS.md,
    alignItems: "center",
    justifyContent: "center",
  },
  cancel: {
    backgroundColor: COLORS.surface,
    borderWidth: 1.5,
    borderColor: COLORS.border,
  },
  cancelPressed: { backgroundColor: COLORS.surfaceAlt },
  cancelText: { fontSize: 15, fontWeight: "800", color: COLORS.textMuted },
  confirmPressed: { opacity: 0.82 },
  confirmText: { fontSize: 15, fontWeight: "900", color: COLORS.white },
});
