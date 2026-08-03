import { Feather } from "@expo/vector-icons";
import { useEffect, useState } from "react";
import { FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import SlotBadge from "../../components/SlotBadge";
import StatusPill from "../../components/StatusPill";
import { LABELS, STATUS } from "../../constants/domain";
import { COLORS, RADIUS, SHADOW, SPACING } from "../../constants/theme";
import type { Bus } from "../../src/data/seed";
import {
  markDeparted,
  selectYard,
  startBoarding,
} from "../../src/store/operations.slice";
import { useAppDispatch, useAppSelector } from "../../src/store";

/** Gate 1: everything currently inside, ordered by station, one tap to release. */
export default function GateOutScreen() {
  const dispatch = useAppDispatch();
  const yard = useAppSelector(selectYard);
  const tick = useTick();

  return (
    <FlatList
      style={styles.root}
      contentContainerStyle={styles.content}
      data={yard}
      extraData={tick}
      keyExtractor={(b) => b.id}
      ListHeaderComponent={
        <View style={styles.head}>
          <Text style={styles.headTitle}>Inside the compound</Text>
          <Text style={styles.headSub}>
            {yard.length} {yard.length === 1 ? LABELS.vehicle : LABELS.vehiclePlural} ·
            releasing a {LABELS.slot.toLowerCase()} frees it for the next arrival
          </Text>
        </View>
      }
      ListEmptyComponent={
        <View style={styles.emptyWrap}>
          <Feather name="check-circle" size={40} color={COLORS.success} />
          <Text style={styles.empty}>Compound clear</Text>
          <Text style={styles.emptySub}>Every bus has departed</Text>
        </View>
      }
      renderItem={({ item }) => (
        <YardCard
          bus={item}
          onBoarding={() => dispatch(startBoarding(item.id))}
          onDepart={() => dispatch(markDeparted(item.id))}
        />
      )}
    />
  );
}

function YardCard({
  bus,
  onBoarding,
  onDepart,
}: {
  bus: Bus;
  onBoarding: () => void;
  onDepart: () => void;
}) {
  const arrived = bus.status === STATUS.arrived;

  return (
    <View style={styles.card}>
      <SlotBadge slot={bus.slot} size="md" />
      <View style={{ flex: 1 }}>
        <Text style={styles.busNo}>
          {LABELS.vehicle} {bus.no}
        </Text>
        <Text style={styles.route} numberOfLines={1}>
          {bus.route}
        </Text>
        <View style={styles.metaRow}>
          <StatusPill status={bus.status} />
          <Text style={styles.dwell}>
            <Feather name="clock" size={11} color={COLORS.textMuted} /> {dwell(bus)}
          </Text>
        </View>
      </View>

      {arrived ? (
        <Pressable style={[styles.action, styles.actionBoard]} onPress={onBoarding}>
          <Feather name="users" size={16} color={COLORS.warning} />
          <Text style={[styles.actionText, { color: COLORS.warning }]}>Board</Text>
        </Pressable>
      ) : (
        <Pressable style={[styles.action, styles.actionOut]} onPress={onDepart}>
          <Feather name="log-out" size={16} color={COLORS.white} />
          <Text style={[styles.actionText, { color: COLORS.white }]}>Out</Text>
        </Pressable>
      )}
    </View>
  );
}

function dwell(bus: Bus) {
  if (!bus.arrivedAt) return "—";
  const mins = Math.floor((Date.now() - bus.arrivedAt) / 60000);
  const secs = Math.floor(((Date.now() - bus.arrivedAt) % 60000) / 1000);
  return mins > 0 ? `${mins}m in yard` : `${secs}s in yard`;
}

/** Re-renders once a second so the dwell timers stay honest. */
function useTick() {
  const [n, setN] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setN((x) => x + 1), 1000);
    return () => clearInterval(t);
  }, []);
  return n;
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.screenBg },
  content: { padding: SPACING.md, gap: SPACING.sm },
  head: { marginBottom: SPACING.sm },
  headTitle: { fontSize: 18, fontWeight: "800", color: COLORS.text },
  headSub: { fontSize: 12, color: COLORS.textMuted, marginTop: 2, lineHeight: 17 },

  card: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.md,
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.md,
    ...SHADOW.card,
  },
  busNo: { fontSize: 16, fontWeight: "800", color: COLORS.text },
  route: { fontSize: 12, color: COLORS.textMuted, marginTop: 1 },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.sm,
    marginTop: SPACING.sm,
  },
  dwell: { fontSize: 11, color: COLORS.textMuted },

  action: {
    minWidth: 66,
    height: 46,
    borderRadius: RADIUS.md,
    alignItems: "center",
    justifyContent: "center",
    gap: 2,
  },
  actionBoard: { borderWidth: 1.5, borderColor: COLORS.warning },
  actionOut: { backgroundColor: COLORS.success },
  actionText: { fontSize: 11, fontWeight: "900", letterSpacing: 0.4 },

  emptyWrap: { alignItems: "center", marginTop: SPACING.xl * 2, gap: SPACING.xs },
  empty: { fontSize: 17, fontWeight: "800", color: COLORS.text },
  emptySub: { fontSize: 13, color: COLORS.textMuted },
});
