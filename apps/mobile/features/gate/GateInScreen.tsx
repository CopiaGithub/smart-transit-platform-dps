import { Feather } from "@expo/vector-icons";
import { useCallback, useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import FlashBar, { useFlash } from "../../components/FlashBar";
import Keypad from "../../components/Keypad";
import { LABELS } from "../../constants/domain";
import { COLORS, RADIUS, SHADOW, SPACING, TINT } from "../../constants/theme";
import { findByNo } from "../../src/domain/allocation";
import { usePolling } from "../../src/hooks/usePolling";
import type { AvailableBus } from "../../src/api/operations.api";
import {
  fetchQueue,
  gateIn,
  selectAvailableBuses,
  selectAvailableReserves,
  selectOpsStats,
  selectUndoableEventId,
  undoLast,
} from "../../src/store/operations.slice";
import { useAppDispatch, useAppSelector } from "../../src/store";
import { useViewer } from "../auth/useViewer";

/**
 * Entry gate. Two digits and one press — 45 buses have to clear in a quarter
 * of an hour, so there is nothing else on this screen. The platform is
 * allocated by the server, never chosen by the guard (§2.4).
 */
export default function GateInScreen() {
  const insets = useSafeAreaInsets();
  const dispatch = useAppDispatch();
  const gate = useViewer().gate;

  const available = useAppSelector(selectAvailableBuses);
  const reserves = useAppSelector(selectAvailableReserves);
  const stats = useAppSelector(selectOpsStats);
  const undoableEventId = useAppSelector(selectUndoableEventId);
  const submitting = useAppSelector((s) => s.ops.submitting);
  const opsError = useAppSelector((s) => s.ops.error);

  const [typed, setTyped] = useState("");
  const [picked, setPicked] = useState<AvailableBus | null>(null);
  const { flash, show, clear } = useFlash();

  usePolling(useCallback(() => void dispatch(fetchQueue()), [dispatch]));

  // The keypad matches the school's short bus code, not a registration plate.
  const typedBus = useMemo(() => findByNo(availableByNo(available), typed), [available, typed]);
  const bus = picked ?? (typedBus ? toBus(available, typedBus.no) : null);

  const problem = check(typed, picked, bus, available, reserves, stats.yardFull);
  const ready = !!bus && !problem && !submitting;

  const submit = async () => {
    if (!bus || !ready) return;
    const result = await dispatch(gateIn({ busId: bus.BusId, busNumber: bus.BusNumber }));
    if (gateIn.fulfilled.match(result)) show(String(result.payload));
    setTyped("");
    setPicked(null);
  };

  return (
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
          onUndo={
            undoableEventId
              ? () => {
                  dispatch(undoLast());
                  clear();
                }
              : undefined
          }
        />
      )}

      {!flash && !!opsError && (
        <View style={styles.alert}>
          <Feather name="alert-circle" size={16} color={COLORS.danger} />
          <Text style={styles.alertText}>{opsError}</Text>
        </View>
      )}

      <View style={styles.display}>
        <Text style={styles.cap}>{LABELS.vehicleNo.toUpperCase()}</Text>
        <Text style={[styles.typed, !bus && !typed && styles.typedEmpty]}>
          {bus?.BusNumber ?? typed ?? "––"}
          {!bus && !typed ? "––" : ""}
        </Text>
        <Text
          style={[styles.sub, problem ? styles.subBad : bus && styles.subOk]}
          numberOfLines={2}
        >
          {problem ?? bus?.RouteName ?? "Type the number painted on the bus"}
        </Text>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ gap: SPACING.md, justifyContent: "flex-end", flexGrow: 1 }}
        keyboardShouldPersistTaps="handled"
      >
        {reserves.length > 0 && (
          <View style={{ gap: SPACING.xs }}>
            {/* Reserves carry letter codes (R1, R2) that a number pad cannot
                reach, and §5.3 asks for them listed separately anyway. */}
            <Text style={styles.stripCap}>RESERVES — TAP TO SELECT</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={{ flexDirection: "row", gap: SPACING.sm }}>
                {reserves.map((r) => (
                  <Pressable
                    key={r.BusId}
                    style={[styles.chip, picked?.BusId === r.BusId && styles.chipOn]}
                    onPress={() => {
                      setPicked(picked?.BusId === r.BusId ? null : r);
                      setTyped("");
                    }}
                  >
                    <Text
                      style={[styles.chipNo, picked?.BusId === r.BusId && styles.chipTextOn]}
                    >
                      {r.BusNumber}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </ScrollView>
          </View>
        )}

        <Keypad
          value={typed}
          onChange={(next) => {
            setTyped(next);
            setPicked(null);
          }}
        />

        <Pressable
          style={[styles.cta, !ready && styles.ctaOff]}
          disabled={!ready}
          onPress={submit}
        >
          <Feather name="log-in" size={24} color={COLORS.white} />
          <Text style={styles.ctaText}>
            {submitting ? "RECORDING…" : LABELS.recordIn.toUpperCase()}
          </Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}

/** findByNo works on `{ no }`; the server calls it BusNumber. */
const availableByNo = (list: AvailableBus[]) => list.map((b) => ({ ...b, no: b.BusNumber }));
const toBus = (list: AvailableBus[], no: string) =>
  list.find((b) => b.BusNumber === no) ?? null;

/** Everything that can be wrong, in the order the guard would notice it. */
function check(
  typed: string,
  picked: AvailableBus | null,
  bus: AvailableBus | null,
  available: AvailableBus[],
  reserves: AvailableBus[],
  yardFull: boolean,
): string | null {
  if (picked) return null;
  if (!typed) return null;
  if (!bus) {
    // Distinguish "not on today's list" from "already inside" as far as the
    // queue lets us: a bus in the yard is simply absent from AvailableBuses.
    return available.length + reserves.length === 0
      ? "No buses are available to record in right now"
      : `Bus ${typed} is not available — already in, or out of service`;
  }
  // Not an error (§2.4): the bus is accepted and waits for the next platform.
  if (yardFull) return "Every platform is occupied — this bus will be recorded as waiting";
  return null;
}

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

  alert: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.sm,
    backgroundColor: TINT.danger,
    borderWidth: 1,
    borderColor: COLORS.danger + "44",
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.md,
    paddingVertical: 10,
  },
  alertText: { flex: 1, color: COLORS.danger, fontSize: 13, fontWeight: "600" },

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
  typed: { fontSize: 56, fontWeight: "900", color: COLORS.text, lineHeight: 64 },
  typedEmpty: { color: COLORS.border },
  sub: {
    fontSize: 13,
    color: COLORS.textMuted,
    textAlign: "center",
    paddingHorizontal: SPACING.md,
  },
  subOk: { color: COLORS.text, fontWeight: "700" },
  subBad: { color: COLORS.danger, fontWeight: "700" },

  stripCap: { fontSize: 9, fontWeight: "900", letterSpacing: 1, color: COLORS.textMuted },
  chip: {
    minWidth: 56,
    alignItems: "center",
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.md,
    borderWidth: 1.5,
    borderColor: COLORS.accent,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
  },
  chipOn: { backgroundColor: COLORS.accent },
  chipNo: { fontSize: 18, fontWeight: "900", color: COLORS.accent },
  chipTextOn: { color: COLORS.white },

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
