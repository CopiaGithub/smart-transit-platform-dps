import { Feather } from "@expo/vector-icons";
import { useState } from "react";
import { Modal, Pressable, StyleSheet, Text, View } from "react-native";
import { COLORS, RADIUS, SHADOW, SPACING } from "../constants/theme";

export type PickerOption = {
  /** Stable identity — what `selected` is compared against. */
  key: string;
  label: string;
  /** Second line in the open list, for anything the label cannot carry. */
  hint?: string;
};

/**
 * A chip on a coloured strip that opens a short list.
 *
 * Built for the gate header, where a guard covering someone else's post has to
 * change what the screen does with one thumb, without a keyboard and without
 * leaving the screen. Deliberately not a generic form control: the list is
 * short enough to show whole, so there is no search and no scrolling to build.
 */
export default function PickerChip({
  title,
  selected,
  options,
  onSelect,
  icon,
  disabled,
}: {
  /** Heading above the open list — says what is being chosen. */
  title: string;
  selected: string;
  options: PickerOption[];
  onSelect: (key: string) => void;
  icon?: React.ComponentProps<typeof Feather>["name"];
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const current = options.find((o) => o.key === selected);

  // One option is not a choice. Still shown, so the strip reads the same
  // wherever the guard is standing, but it does not pretend to be tappable.
  const inert = disabled || options.length < 2;

  return (
    <>
      <Pressable
        style={({ pressed }) => [styles.chip, pressed && !inert && styles.chipPressed]}
        onPress={() => !inert && setOpen(true)}
        disabled={inert}
        accessibilityRole="button"
        accessibilityLabel={`${title}: ${current?.label ?? selected}`}
      >
        {!!icon && <Feather name={icon} size={14} color={COLORS.white} />}
        <Text style={styles.chipText}>{current?.label ?? selected}</Text>
        {!inert && <Feather name="chevron-down" size={15} color={COLORS.white} />}
      </Pressable>

      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        {/* The backdrop dismisses. A guard who opened this by accident with a
            bus rolling up must not have to aim at anything to get out. */}
        <Pressable style={styles.backdrop} onPress={() => setOpen(false)}>
          <Pressable style={styles.sheet} onPress={() => {}}>
            <Text style={styles.sheetTitle}>{title}</Text>

            {options.map((option) => {
              const on = option.key === selected;
              return (
                <Pressable
                  key={option.key}
                  style={({ pressed }) => [
                    styles.option,
                    on && styles.optionOn,
                    pressed && styles.optionPressed,
                  ]}
                  onPress={() => {
                    onSelect(option.key);
                    setOpen(false);
                  }}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.optionText, on && styles.optionTextOn]}>
                      {option.label}
                    </Text>
                    {!!option.hint && <Text style={styles.optionHint}>{option.hint}</Text>}
                  </View>
                  {on && <Feather name="check" size={20} color={COLORS.primary} />}
                </Pressable>
              );
            })}
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.xs,
    // Translucent white so the chip works on any strip colour — and it carries
    // no shadow, so the Android elevation-tint rule does not apply here.
    backgroundColor: "#FFFFFF2E",
    borderRadius: RADIUS.sm,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 6,
  },
  chipPressed: { backgroundColor: "#FFFFFF52" },
  chipText: { color: COLORS.white, fontWeight: "800", fontSize: 14 },

  backdrop: {
    flex: 1,
    backgroundColor: "#0F172A99",
    justifyContent: "center",
    padding: SPACING.lg,
  },
  sheet: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    gap: SPACING.xs,
    ...SHADOW.lifted,
  },
  sheetTitle: {
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 1.2,
    color: COLORS.textMuted,
    marginBottom: SPACING.xs,
  },

  option: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.sm,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: SPACING.md,
    paddingVertical: 14,
  },
  optionOn: { borderColor: COLORS.primary, backgroundColor: COLORS.surfaceAlt },
  optionPressed: { backgroundColor: COLORS.surfaceAlt },
  optionText: { fontSize: 17, fontWeight: "800", color: COLORS.text },
  optionTextOn: { color: COLORS.primary },
  optionHint: { fontSize: 12, color: COLORS.textMuted, marginTop: 2 },
});
