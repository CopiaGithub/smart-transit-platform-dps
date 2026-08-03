import { Feather } from "@expo/vector-icons";
import { useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import SlotBadge from "../../components/SlotBadge";
import { LABELS } from "../../constants/domain";
import { COLORS, RADIUS, SHADOW, SPACING } from "../../constants/theme";
import {
  replaceBus,
  selectReserves,
  selectWaiting,
  selectYard,
} from "../../src/store/operations.slice";
import { useAppDispatch, useAppSelector } from "../../src/store";

/**
 * Breakdown / late-substitution flow. The school flags these at the last hour,
 * so it is two taps: pick who is out, pick who covers. The reserve inherits the
 * route and station number, which is what students are already watching for.
 */
export default function ReplaceScreen() {
  const dispatch = useAppDispatch();
  const yard = useAppSelector(selectYard);
  const waiting = useAppSelector(selectWaiting);
  const reserves = useAppSelector(selectReserves);

  const [outId, setOutId] = useState<string | null>(null);
  const [inId, setInId] = useState<string | null>(null);

  const candidates = [...yard, ...waiting];
  const out = candidates.find((b) => b.id === outId);
  const ready = outId && inId;

  const swap = () => {
    if (!outId || !inId) return;
    dispatch(replaceBus({ originalId: outId, reserveId: inId }));
    setOutId(null);
    setInId(null);
  };

  return (
    <ScrollView style={styles.root} contentContainerStyle={styles.content}>
      <View style={styles.notice}>
        <Feather name="alert-triangle" size={16} color={COLORS.warning} />
        <Text style={styles.noticeText}>
          The reserve keeps the same {LABELS.route.toLowerCase()} and{" "}
          {LABELS.slot.toLowerCase()}, so nothing changes for students already waiting.
        </Text>
      </View>

      <Text style={styles.cap}>1 · {LABELS.vehicle.toUpperCase()} GOING OUT OF SERVICE</Text>
      {candidates.length === 0 ? (
        <Text style={styles.empty}>No buses to replace yet</Text>
      ) : (
        <View style={styles.list}>
          {candidates.map((b) => (
            <Pressable
              key={b.id}
              style={[styles.row, outId === b.id && styles.rowOn]}
              onPress={() => setOutId(outId === b.id ? null : b.id)}
            >
              <SlotBadge slot={b.slot} size="sm" />
              <View style={{ flex: 1 }}>
                <Text style={styles.no}>
                  {LABELS.vehicle} {b.no}
                </Text>
                <Text style={styles.route} numberOfLines={1}>
                  {b.route}
                </Text>
              </View>
              <Feather
                name={outId === b.id ? "check-circle" : "circle"}
                size={20}
                color={outId === b.id ? COLORS.danger : COLORS.border}
              />
            </Pressable>
          ))}
        </View>
      )}

      <Text style={styles.cap}>2 · RESERVE TAKING OVER</Text>
      {reserves.length === 0 ? (
        <Text style={styles.empty}>No reserve buses available</Text>
      ) : (
        <View style={styles.list}>
          {reserves.map((b) => (
            <Pressable
              key={b.id}
              style={[styles.row, inId === b.id && styles.rowOn]}
              onPress={() => setInId(inId === b.id ? null : b.id)}
            >
              <View style={styles.reserveTag}>
                <Text style={styles.reserveTagText}>{b.no}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.no}>Reserve {b.no}</Text>
                <Text style={styles.route}>
                  {out ? `Will run ${out.route}` : "Awaiting assignment"}
                </Text>
              </View>
              <Feather
                name={inId === b.id ? "check-circle" : "circle"}
                size={20}
                color={inId === b.id ? COLORS.success : COLORS.border}
              />
            </Pressable>
          ))}
        </View>
      )}

      <Pressable
        style={[styles.cta, !ready && styles.ctaOff]}
        disabled={!ready}
        onPress={swap}
      >
        <Feather name="repeat" size={18} color={COLORS.white} />
        <Text style={styles.ctaText}>Confirm replacement</Text>
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
    backgroundColor: COLORS.warning + "14",
    borderWidth: 1,
    borderColor: COLORS.warning + "44",
    borderRadius: RADIUS.md,
    padding: SPACING.md,
  },
  noticeText: { flex: 1, fontSize: 12, color: COLORS.text, lineHeight: 18 },

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
    backgroundColor: COLORS.accent + "22",
    borderWidth: 1,
    borderColor: COLORS.accent,
    alignItems: "center",
    justifyContent: "center",
  },
  reserveTagText: { fontSize: 12, fontWeight: "900", color: COLORS.accent },

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
  ctaOff: { opacity: 0.4 },
  ctaText: { color: COLORS.white, fontWeight: "800", fontSize: 15 },
});
