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
  selectAvailableReserves,
  selectYard,
} from "../../src/store/operations.slice";
import { useAppDispatch, useAppSelector } from "../../src/store";

/**
 * Breakdown handling. The reserve inherits the failed bus's route and its
 * platform — deliberately, so students already told 'platform 4' keep walking
 * to platform 4 and nothing has to be re-announced (§5.6).
 */
export default function ReplaceScreen() {
  const dispatch = useAppDispatch();
  const yard = useAppSelector(selectYard);
  const reserves = useAppSelector(selectAvailableReserves);
  const submitting = useAppSelector((s) => s.ops.submitting);
  const opsError = useAppSelector((s) => s.ops.error);
  const { flash, show } = useFlash();

  const [outEventId, setOutEventId] = useState<number | null>(null);
  const [inBusId, setInBusId] = useState<number | null>(null);
  const [reason, setReason] = useState("");

  usePolling(useCallback(() => void dispatch(fetchQueue()), [dispatch]));

  const failed = yard.find((b) => b.EventId === outEventId) ?? null;
  const reserve = reserves.find((r) => r.BusId === inBusId) ?? null;
  const ready = !!failed && !!reserve && reason.trim().length > 0 && !submitting;

  const swap = async () => {
    if (!failed || !reserve || !ready) return;
    const result = await dispatch(
      replaceBus({
        eventId: failed.EventId,
        reserveBusId: reserve.BusId,
        reserveBusNumber: reserve.BusNumber,
        reason: reason.trim(),
      }),
    );
    if (replaceBus.fulfilled.match(result)) {
      show(String(result.payload));
      setOutEventId(null);
      setInBusId(null);
      setReason("");
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
      {yard.length === 0 ? (
        <Text style={styles.empty}>
          No {LABELS.vehiclePlural.toLowerCase()} on campus to replace
        </Text>
      ) : (
        <View style={styles.list}>
          {yard.map((b) => (
            <Pressable
              key={b.EventId}
              style={[styles.row, outEventId === b.EventId && styles.rowOn]}
              onPress={() => setOutEventId(outEventId === b.EventId ? null : b.EventId)}
            >
              <SlotBadge slot={b.PlatformNumber} size="sm" />
              <View style={{ flex: 1 }}>
                <Text style={styles.no}>
                  {LABELS.vehicle} {b.BusNumber}
                </Text>
                <Text style={styles.route} numberOfLines={1}>
                  {b.RouteName ?? "No route allocated"}
                </Text>
              </View>
              <Feather
                name={outEventId === b.EventId ? "check-circle" : "circle"}
                size={20}
                color={outEventId === b.EventId ? COLORS.danger : COLORS.border}
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
                  {failed ? `Will run ${failed.RouteName ?? "the same route"}` : "Awaiting selection"}
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
