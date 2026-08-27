import { Feather } from "@expo/vector-icons";
import { useCallback, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import FlashBar, { useFlash } from "../../components/FlashBar";
import SlotBadge from "../../components/SlotBadge";
import { LABELS } from "../../constants/domain";
import { COLORS, RADIUS, SHADOW, SPACING, TINT } from "../../constants/theme";
import { usePolling } from "../../src/hooks/usePolling";
import {
  fetchQueue,
  replaceBus,
  replaceByBus,
  selectAvailableBuses,
  selectAvailableReserves,
  selectWaiting,
  selectYard,
} from "../../src/store/operations.slice";
import { useAppDispatch, useAppSelector } from "../../src/store";

/**
 * Breakdown handling. The reserve inherits the failed bus's route and its
 * platform — deliberately, so students already told 'platform 4' keep walking
 * to platform 4 and nothing has to be re-announced (§5.6).
 *
 * A bus can fail anywhere, not just at a platform: on the road before it ever
 * reaches the gate too. So the "going out" list is every bus that could still
 * run today — in the yard, waiting inside, or yet to arrive — not only the ones
 * already parked. A bus with no event is replaced by number; the reserve enters
 * on its route and a Replaced marker keeps the failed bus on the board.
 */
type OutItem = {
  /** Unique across the list — a bus is in exactly one of these states. */
  busId: number;
  /** The event to replace, or null when the bus has not entered yet. */
  eventId: number | null;
  busNumber: string;
  routeName: string | null;
  platformNumber: number | null;
  /** Shown to the operator: Arrived / Boarding / Waiting / Yet to arrive. */
  status: string;
};

export default function ReplaceScreen() {
  const dispatch = useAppDispatch();
  const yard = useAppSelector(selectYard);
  const waiting = useAppSelector(selectWaiting);
  const availableBuses = useAppSelector(selectAvailableBuses);
  const reserves = useAppSelector(selectAvailableReserves);
  const submitting = useAppSelector((s) => s.ops.submitting);
  const opsError = useAppSelector((s) => s.ops.error);
  const { flash, show } = useFlash();

  const [outBusId, setOutBusId] = useState<number | null>(null);
  const [inBusId, setInBusId] = useState<number | null>(null);
  const [reason, setReason] = useState("");

  usePolling(useCallback(() => void dispatch(fetchQueue()), [dispatch]));

  // In the yard first, then waiting inside, then the fleet still to arrive.
  const outItems: OutItem[] = [
    ...yard.map((b) => ({
      busId: b.BusId,
      eventId: b.EventId,
      busNumber: b.BusNumber,
      routeName: b.RouteName,
      platformNumber: b.PlatformNumber,
      status: b.Status,
    })),
    ...waiting.map((b) => ({
      busId: b.BusId,
      eventId: b.EventId,
      busNumber: b.BusNumber,
      routeName: b.RouteName,
      platformNumber: b.PlatformNumber,
      status: b.Status,
    })),
    ...availableBuses.map((b) => ({
      busId: b.BusId,
      eventId: null,
      busNumber: b.BusNumber,
      routeName: b.RouteName,
      platformNumber: null,
      status: "Yet to arrive",
    })),
  ];

  const failed = outItems.find((b) => b.busId === outBusId) ?? null;
  const reserve = reserves.find((r) => r.BusId === inBusId) ?? null;
  const ready = !!failed && !!reserve && reason.trim().length > 0 && !submitting;

  const swap = async () => {
    if (!failed || !reserve || !ready) return;
    const done = (message: string) => {
      show(message);
      setOutBusId(null);
      setInBusId(null);
      setReason("");
    };
    // A bus already inside is replaced by its event so it keeps its platform; a
    // bus not yet in has no event, so it is replaced by number. Dispatched on
    // separate branches: the two thunks take different args, so a single dispatch
    // of their union does not resolve.
    if (failed.eventId != null) {
      const result = await dispatch(
        replaceBus({
          eventId: failed.eventId,
          reserveBusId: reserve.BusId,
          reserveBusNumber: reserve.BusNumber,
          reason: reason.trim(),
        }),
      );
      if (replaceBus.fulfilled.match(result)) done(String(result.payload));
    } else {
      const result = await dispatch(
        replaceByBus({
          failedBusId: failed.busId,
          reserveBusId: reserve.BusId,
          reserveBusNumber: reserve.BusNumber,
          reason: reason.trim(),
        }),
      );
      if (replaceByBus.fulfilled.match(result)) done(String(result.payload));
    }
  };

  return (
    <ScrollView style={styles.root} contentContainerStyle={styles.content}>
      <View style={styles.notice}>
        <Feather name="alert-triangle" size={16} color={COLORS.warning} />
        <Text style={styles.noticeText}>
          The reserve keeps the same {LABELS.route.toLowerCase()} and{" "}
          {LABELS.slot.toLowerCase()}, so nothing changes for students already waiting. A
          one-day allocation is written for the route, and reverts tomorrow on its own.
        </Text>
      </View>

      {!!flash && <FlashBar text={flash} />}

      {!flash && !!opsError && (
        <View style={styles.alert}>
          <Feather name="alert-circle" size={16} color={COLORS.danger} />
          <Text style={styles.alertText}>{opsError}</Text>
        </View>
      )}

      <Text style={styles.cap}>1 · {LABELS.vehicle.toUpperCase()} GOING OUT OF SERVICE</Text>
      {outItems.length === 0 ? (
        <Text style={styles.empty}>
          No {LABELS.vehiclePlural.toLowerCase()} available to replace
        </Text>
      ) : (
        <View style={styles.list}>
          {outItems.map((b) => (
            <Pressable
              key={b.busId}
              style={[styles.row, outBusId === b.busId && styles.rowOn]}
              onPress={() => setOutBusId(outBusId === b.busId ? null : b.busId)}
            >
              {b.platformNumber != null ? (
                <SlotBadge slot={b.platformNumber} size="sm" />
              ) : (
                // No platform: it is waiting inside, or has not arrived at all.
                <View style={styles.noSlot}>
                  <Feather name="clock" size={16} color={COLORS.textMuted} />
                </View>
              )}
              <View style={{ flex: 1 }}>
                <Text style={styles.no}>
                  {LABELS.vehicle} {b.busNumber}
                </Text>
                <Text style={styles.route} numberOfLines={1}>
                  {b.routeName ?? "No route allocated"} · {b.status}
                </Text>
              </View>
              <Feather
                name={outBusId === b.busId ? "check-circle" : "circle"}
                size={20}
                color={outBusId === b.busId ? COLORS.danger : COLORS.border}
              />
            </Pressable>
          ))}
        </View>
      )}

      <Text style={styles.cap}>2 · RESERVE TAKING OVER</Text>
      {reserves.length === 0 ? (
        <Text style={styles.empty}>No reserve {LABELS.vehiclePlural.toLowerCase()} available</Text>
      ) : (
        <View style={styles.list}>
          {reserves.map((r) => (
            <Pressable
              key={r.BusId}
              style={[styles.row, inBusId === r.BusId && styles.rowOn]}
              onPress={() => setInBusId(inBusId === r.BusId ? null : r.BusId)}
            >
              <View style={styles.reserveTag}>
                <Text style={styles.reserveTagText}>{r.BusNumber}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.no}>Reserve {r.BusNumber}</Text>
                <Text style={styles.route}>
                  {failed ? `Will run ${failed.routeName ?? "the same route"}` : "Awaiting selection"}
                </Text>
              </View>
              <Feather
                name={inBusId === r.BusId ? "check-circle" : "circle"}
                size={20}
                color={inBusId === r.BusId ? COLORS.success : COLORS.border}
              />
            </Pressable>
          ))}
        </View>
      )}

      <Text style={styles.cap}>3 · REASON</Text>
      {/* Required: this is what appears in the day's report (§5.6). */}
      <TextInput
        style={styles.input}
        value={reason}
        onChangeText={setReason}
        placeholder="Breakdown at platform 4"
        placeholderTextColor={COLORS.textMuted}
      />

      <Pressable style={[styles.cta, !ready && styles.ctaOff]} disabled={!ready} onPress={swap}>
        <Feather name="repeat" size={18} color={COLORS.white} />
        <Text style={styles.ctaText}>
          {submitting ? "Recording…" : "Confirm replacement"}
        </Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.screenBg },
  content: { padding: SPACING.md, gap: SPACING.md, paddingBottom: SPACING.xl },

  notice: {
    flexDirection: "row",
    gap: SPACING.sm,
    backgroundColor: TINT.warning,
    borderWidth: 1,
    borderColor: COLORS.warning + "44",
    borderRadius: RADIUS.md,
    padding: SPACING.md,
  },
  noticeText: { flex: 1, fontSize: 12, color: COLORS.text, lineHeight: 18 },

  alert: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.sm,
    backgroundColor: TINT.danger,
    borderWidth: 1,
    borderColor: COLORS.danger + "44",
    borderRadius: RADIUS.md,
    padding: SPACING.md,
  },
  alertText: { flex: 1, color: COLORS.danger, fontSize: 13, fontWeight: "600" },

  cap: {
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 1.1,
    color: COLORS.textMuted,
    marginTop: SPACING.xs,
  },
  list: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: "hidden",
    ...SHADOW.card,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.md,
    padding: SPACING.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: COLORS.border,
  },
  rowOn: { backgroundColor: COLORS.surfaceAlt },
  // Stand-in for the platform badge when a bus holds none (waiting or not in yet).
  noSlot: {
    width: 34,
    height: 34,
    borderRadius: RADIUS.sm,
    backgroundColor: COLORS.surfaceAlt,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: "center",
    justifyContent: "center",
  },
  no: { fontSize: 15, fontWeight: "800", color: COLORS.text },
  route: { fontSize: 11, color: COLORS.textMuted, marginTop: 1 },
  reserveTag: {
    width: 34,
    height: 34,
    borderRadius: RADIUS.sm,
    backgroundColor: TINT.warning,
    borderWidth: 1,
    borderColor: COLORS.accent,
    alignItems: "center",
    justifyContent: "center",
  },
  reserveTagText: { fontSize: 12, fontWeight: "900", color: COLORS.accent },

  input: {
    height: 52,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.md,
    fontSize: 15,
    color: COLORS.text,
    backgroundColor: COLORS.surface,
  },

  empty: {
    color: COLORS.textMuted,
    fontSize: 13,
    padding: SPACING.md,
    textAlign: "center",
  },
  cta: {
    height: 54,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.primary,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: SPACING.sm,
    marginTop: SPACING.sm,
  },
  ctaOff: { backgroundColor: COLORS.textMuted, opacity: 0.4 },
  ctaText: { color: COLORS.white, fontWeight: "800", fontSize: 15 },
});
