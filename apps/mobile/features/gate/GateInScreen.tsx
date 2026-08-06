import { Feather } from "@expo/vector-icons";
import { useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import FlashBar, { useFlash } from "../../components/FlashBar";
import Keypad from "../../components/Keypad";
import { findGate, LABELS, SLOT_COUNT, STATUS } from "../../constants/domain";
import { COLORS, RADIUS, SHADOW, SPACING } from "../../constants/theme";
import { findByNo } from "../../src/domain/allocation";
import {
  gateIn,
  selectNextSlot,
  selectStats,
  undoLast,
} from "../../src/store/operations.slice";
import { useAppDispatch, useAppSelector } from "../../src/store";

/**
 * Entry gate. Two digits and one press — 45 buses have to clear in a quarter
 * of an hour, so there is nothing else on this screen. The station is
 * allocated by the platform, not chosen by the guard.
 */
export default function GateInScreen() {
  const insets = useSafeAreaInsets();
  const dispatch = useAppDispatch();
  const fleet = useAppSelector((s) => s.ops.fleet);
  const nextSlot = useAppSelector(selectNextSlot);
  const stats = useAppSelector(selectStats);
  const user = useAppSelector((s) => s.auth.user);
  const gate = findGate(user?.gateId);

  const [typed, setTyped] = useState("");
  const { flash, show, clear } = useFlash();

  const bus = useMemo(() => findByNo(fleet, typed), [fleet, typed]);
  const problem = check(typed, bus, nextSlot);
  const ready = !!bus && !problem;

  const submit = () => {
    if (!bus || problem || nextSlot === null) return;
    dispatch(gateIn(bus.id));
    show(`${LABELS.vehicle} ${bus.no} in · ${LABELS.slot} ${pad(nextSlot)} allocated`);
    setTyped("");
  };

  return (
    // The CTA sits at the very bottom, so it has to clear the gesture bar.
    <View style={[styles.root, { paddingBottom: SPACING.md + insets.bottom }]}>
      <View style={styles.post}>
        <Feather name="log-in" size={16} color={COLORS.white} />
        <Text style={styles.postText}>{gate?.label ?? "Entry gate"} · Entry</Text>
        <View style={{ flex: 1 }} />
        <Text style={styles.postCount}>{stats.awaited} left to come in</Text>
      </View>

      {!!flash && (
        <FlashBar
          text={flash}
          onUndo={() => {
            dispatch(undoLast());
            clear();
          }}
        />
      )}

      <View style={styles.display}>
        <Text style={styles.cap}>{LABELS.vehicleNo.toUpperCase()}</Text>
        <Text style={[styles.typed, !typed && styles.typedEmpty]}>{typed || "––"}</Text>
        <Text
          style={[styles.sub, problem ? styles.subBad : bus && styles.subOk]}
          numberOfLines={2}
        >
          {problem ?? bus?.route ?? "Type the number painted on the bus"}
        </Text>
      </View>

      {/* The allocated station is announced in the success bar instead of
          being previewed here — the guard has no decision to make about it,
          and the Live Board is where anyone can look it up afterwards. */}
      <View style={{ flex: 1, justifyContent: "flex-end", gap: SPACING.md }}>
        <Keypad value={typed} onChange={setTyped} />

        <Pressable
          style={[styles.cta, !ready && styles.ctaOff]}
          disabled={!ready}
          onPress={submit}
        >
          <Feather name="log-in" size={24} color={COLORS.white} />
          <Text style={styles.ctaText}>{LABELS.gateIn.toUpperCase()}</Text>
        </Pressable>
      </View>
    </View>
  );
}

/** Everything that can be wrong, in the order the guard would notice it. */
function check(
  typed: string,
  bus: { no: string; status: string | null; slot: number | null } | null,
  nextSlot: number | null,
): string | null {
  if (!typed) return null;
  if (!bus) return `No ${LABELS.vehicle.toLowerCase()} ${typed} in today's list`;
  if (bus.status === STATUS.departed) return `${LABELS.vehicle} ${bus.no} has already left today`;
  if (bus.status !== null)
    return `${LABELS.vehicle} ${bus.no} is already at ${LABELS.slot.toLowerCase()} ${pad(bus.slot)}`;
  if (nextSlot === null)
    return `All ${SLOT_COUNT} ${LABELS.slotPlural.toLowerCase()} are full — hold at the gate`;
  return null;
}

const pad = (n: number | null) => (n === null ? "––" : String(n).padStart(2, "0"));

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: COLORS.screenBg,
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.md,
    gap: SPACING.sm,
  },

  post: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.sm,
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.md,
    paddingVertical: 10,
  },
  postText: { color: COLORS.white, fontWeight: "800", fontSize: 14 },
  postCount: { color: COLORS.white, opacity: 0.85, fontSize: 12, fontWeight: "700" },

  display: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingVertical: SPACING.sm,
    alignItems: "center",
    ...SHADOW.card,
  },
  cap: { fontSize: 10, fontWeight: "900", letterSpacing: 1.3, color: COLORS.textMuted },
  typed: { fontSize: 60, fontWeight: "900", color: COLORS.text, lineHeight: 68 },
  typedEmpty: { color: COLORS.border },
  sub: { fontSize: 13, color: COLORS.textMuted, textAlign: "center", paddingHorizontal: SPACING.md },
  subOk: { color: COLORS.text, fontWeight: "700" },
  subBad: { color: COLORS.danger, fontWeight: "700" },

  slotStrip: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: COLORS.primary + "0F",
    borderWidth: 1,
    borderColor: COLORS.primary + "33",
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
  },
  slotCap: { fontSize: 9, fontWeight: "900", letterSpacing: 1, color: COLORS.textMuted },
  slotNo: { fontSize: 26, fontWeight: "900", color: COLORS.primary },

  cta: {
    height: 68,
    borderRadius: RADIUS.lg,
    backgroundColor: COLORS.primary,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: SPACING.sm,
    ...SHADOW.lifted,
  },
  ctaOff: { backgroundColor: COLORS.textMuted, opacity: 0.35 },
  ctaText: { color: COLORS.white, fontSize: 21, fontWeight: "900", letterSpacing: 1 },
});
