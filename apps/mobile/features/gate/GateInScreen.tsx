import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import { useCallback, useMemo, useState } from "react";
import { FlatList, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import FlashBar, { useFlash } from "../../components/FlashBar";
import SlotBadge from "../../components/SlotBadge";
import { LABELS, STATUS_COLOR, type Status } from "../../constants/domain";
import { COLORS, RADIUS, SHADOW, SPACING, TINT } from "../../constants/theme";
import { findByNo } from "../../src/domain/allocation";
import { usePolling } from "../../src/hooks/usePolling";
import { formatTime } from "../../src/services/time";
import type { AvailableBus } from "../../src/api/operations.api";
import {
  fetchQueue,
  gateIn,
  selectAvailableBuses,
  selectAvailableReserves,
  selectOpsStats,
  selectRecordedIn,
  selectUndoableEventId,
  undoLast,
} from "../../src/store/operations.slice";
import { useAppDispatch, useAppSelector } from "../../src/store";

/**
 * Entry gate. Two digits and one press — 45 buses have to clear in a quarter of
 * an hour — with the buses already recorded filling the rest of the screen, so
 * a guard can see their own work without going anywhere. The platform is
 * allocated by the server, never chosen by the guard (§2.4).
 *
 * The post header lives in GateScreen, which is also what decides this body is
 * the one to show.
 */
export default function GateInScreen() {
  const dispatch = useAppDispatch();

  const available = useAppSelector(selectAvailableBuses);
  const reserves = useAppSelector(selectAvailableReserves);
  const recorded = useAppSelector(selectRecordedIn);
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

  // A reserve chosen from the strip shows in the field, so there is one place
  // to read the answer whichever way it was chosen. Typing over it drops the
  // chip — the last thing touched is the one that counts.
  const value = picked?.BusNumber ?? typed;

  const type = (next: string) => {
    setTyped(next);
    setPicked(null);
  };

  const submit = async () => {
    if (!bus || !ready) return;
    const result = await dispatch(gateIn({ busId: bus.BusId, busNumber: bus.BusNumber }));
    if (gateIn.fulfilled.match(result)) show(String(result.payload));
    setTyped("");
    setPicked(null);
  };

  const undo = () => {
    dispatch(undoLast());
    clear();
  };

  return (
    <View style={styles.root}>
      {!!flash && <FlashBar text={flash} onUndo={undoableEventId ? undo : undefined} />}

      {!flash && !!opsError && (
        <View style={styles.alert}>
          <Feather name="alert-circle" size={16} color={COLORS.danger} />
          <Text style={styles.alertText}>{opsError}</Text>
        </View>
      )}

      {/* The number and the button that acts on it, side by side: the guard
          reads back what they typed and commits it without their eyes — or
          their thumb — travelling to the bottom of the screen.

          The field is the display. There is no on-screen number pad: it stood
          between the guard and the list of what they had just recorded, which
          is the half of the screen worth having. The phone's own keyboard
          covers the list too, but only while a number is actually being typed,
          and it leaves when the thumb does. */}
      <View style={styles.display}>
        <View style={styles.readout}>
          <Text style={styles.cap}>{LABELS.vehicleNo.toUpperCase()}</Text>
          <TextInput
            style={[styles.typed, !value && styles.typedEmpty]}
            value={value}
            onChangeText={type}
            // Not autoFocused: arriving at the screen should show the list, not
            // a keyboard on top of it.
            keyboardType="number-pad"
            returnKeyType="done"
            // Every code in the fleet is two characters, reserves included, so
            // a third keystroke can only ever be a mistake.
            maxLength={2}
            placeholder="––"
            placeholderTextColor={COLORS.border}
            selectTextOnFocus
            // Enter records the bus and leaves the keyboard up for the next one
            // — 45 buses clear in a quarter of an hour and every tap counts.
            blurOnSubmit={false}
            onSubmitEditing={submit}
            accessibilityLabel={LABELS.vehicleNo}
          />
          <Text
            style={[styles.sub, problem ? styles.subBad : bus && styles.subOk]}
            numberOfLines={2}
          >
            {problem ?? bus?.RouteName ?? "Tap the number to type it"}
          </Text>
        </View>

        <Pressable
          style={({ pressed }) => [styles.go, !ready && styles.goOff, pressed && styles.goPressed]}
          disabled={!ready}
          onPress={submit}
          accessibilityRole="button"
          accessibilityLabel={`Record ${LABELS.vehicle} ${bus?.BusNumber ?? ""} in`}
        >
          <Feather name="log-in" size={26} color={COLORS.white} />
          <Text style={styles.goText}>{submitting ? "…" : LABELS.recordIn.toUpperCase()}</Text>
        </Pressable>
      </View>

      {reserves.length > 0 && (
        <View style={{ gap: SPACING.xs }}>
          {/* Reserves carry letter codes (R1, R2), which the number keyboard
              cannot type — and §5.3 asks for them listed separately anyway. */}
          <Text style={styles.stripCap}>RESERVES — TAP TO SELECT</Text>
          <FlatList
            horizontal
            showsHorizontalScrollIndicator={false}
            data={reserves}
            keyExtractor={(r) => String(r.BusId)}
            contentContainerStyle={{ gap: SPACING.sm }}
            renderItem={({ item }) => (
              <Pressable
                style={[styles.chip, picked?.BusId === item.BusId && styles.chipOn]}
                onPress={() => {
                  setPicked(picked?.BusId === item.BusId ? null : item);
                  setTyped("");
                }}
              >
                <Text style={[styles.chipNo, picked?.BusId === item.BusId && styles.chipTextOn]}>
                  {item.BusNumber}
                </Text>
              </Pressable>
            )}
          />
        </View>
      )}

      <View style={styles.listHead}>
        <MaterialCommunityIcons name="bus-school" size={15} color={COLORS.textMuted} />
        <Text style={styles.stripCap}>RECORDED IN</Text>
        <View style={{ flex: 1 }} />
        <Text style={styles.listCount}>{recorded.length}</Text>
      </View>

      <FlatList
        style={styles.list}
        data={recorded}
        keyExtractor={(r) => String(r.EventId)}
        contentContainerStyle={styles.listContent}
        keyboardShouldPersistTaps="handled"
        ListEmptyComponent={
          <Text style={styles.empty}>
            No {LABELS.vehiclePlural.toLowerCase()} recorded in yet
          </Text>
        }
        renderItem={({ item }) => (
          <View style={styles.row}>
            <SlotBadge slot={item.PlatformNumber} size="sm" tone="light" />

            <View style={{ flex: 1 }}>
              <Text style={styles.rowNo} numberOfLines={1}>
                {LABELS.vehicle} {item.BusNumber}
                {item.RouteName ? <Text style={styles.rowRoute}> · {item.RouteName}</Text> : null}
              </Text>
              <Text style={[styles.rowStatus, { color: STATUS_COLOR[item.Status as Status] }]}>
                {item.Status}
                {formatTime(item.EnteredAt) ? ` · ${formatTime(item.EnteredAt)}` : ""}
              </Text>
            </View>

            {/* The server undoes one step and only the newest (§5.7), so the
                control appears on the row it can actually act on rather than
                on every row where it would be refused. */}
            {item.EventId === undoableEventId && (
              <Pressable
                style={({ pressed }) => [styles.undo, pressed && styles.undoPressed]}
                disabled={submitting}
                onPress={undo}
                accessibilityRole="button"
                accessibilityLabel={`Undo ${LABELS.vehicle} ${item.BusNumber}`}
              >
                <Feather name="rotate-ccw" size={15} color={COLORS.danger} />
                <Text style={styles.undoText}>UNDO</Text>
              </Pressable>
            )}
          </View>
        )}
      />
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
  root: { flex: 1, gap: SPACING.sm },

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
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.sm,
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.sm,
    ...SHADOW.card,
  },
  readout: { flex: 1, alignItems: "center" },
  cap: { fontSize: 10, fontWeight: "900", letterSpacing: 1.3, color: COLORS.textMuted },
  typed: {
    fontSize: 52,
    fontWeight: "900",
    color: COLORS.text,
    // The field is the whole readout, so it has to be wide enough to hit with
    // a thumb rather than only where the digits happen to sit.
    alignSelf: "stretch",
    textAlign: "center",
    // Android gives a TextInput its own padding and an underline; both fight a
    // 52pt number sitting on a card.
    paddingVertical: 2,
    marginVertical: 2,
    // Reads as somewhere to type without becoming a second box inside the card.
    borderBottomWidth: 2,
    borderBottomColor: COLORS.border,
  },
  typedEmpty: { color: COLORS.border },
  sub: { fontSize: 13, color: COLORS.textMuted, textAlign: "center" },
  subOk: { color: COLORS.text, fontWeight: "700" },
  subBad: { color: COLORS.danger, fontWeight: "700" },

  go: {
    width: 104,
    height: 88,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.primary,
    alignItems: "center",
    justifyContent: "center",
    gap: 2,
  },
  // An opaque grey rather than opacity — this button sits on a card that
  // carries a shadow, and Android paints elevation behind translucency.
  goOff: { backgroundColor: COLORS.border },
  goPressed: { backgroundColor: COLORS.primaryDark },
  goText: { color: COLORS.white, fontSize: 15, fontWeight: "900", letterSpacing: 1 },

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

  listHead: { flexDirection: "row", alignItems: "center", gap: SPACING.xs },
  listCount: { fontSize: 11, fontWeight: "900", color: COLORS.textMuted },
  // The rest of the screen. Dropping the on-screen number pad gave this back
  // roughly 260pt — the difference between one visible row and the afternoon.
  list: { flex: 1 },
  listContent: { gap: SPACING.xs, paddingBottom: SPACING.sm },

  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.sm,
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.sm,
  },
  rowNo: { fontSize: 15, fontWeight: "800", color: COLORS.text },
  rowRoute: { fontSize: 12, fontWeight: "600", color: COLORS.textMuted },
  rowStatus: { fontSize: 11, fontWeight: "800", letterSpacing: 0.3, marginTop: 1 },

  undo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    borderRadius: RADIUS.sm,
    borderWidth: 1,
    borderColor: COLORS.danger + "55",
    backgroundColor: TINT.danger,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 8,
  },
  undoPressed: { backgroundColor: COLORS.danger + "22" },
  undoText: { fontSize: 11, fontWeight: "900", color: COLORS.danger, letterSpacing: 0.5 },

  empty: {
    fontSize: 13,
    color: COLORS.textMuted,
    textAlign: "center",
    paddingVertical: SPACING.md,
  },
});
