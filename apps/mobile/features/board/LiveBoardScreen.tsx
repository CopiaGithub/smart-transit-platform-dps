import { useEffect, useRef, useState } from "react";
import {
  Animated,
  Easing,
  FlatList,
  Platform,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { LABELS, STATUS, STATUS_COLOR } from "../../constants/domain";
import { BOARD, SPACING } from "../../constants/theme";
import type { Bus } from "../../src/data/seed";
import { selectBoard, selectStats } from "../../src/store/operations.slice";
import { useAppSelector } from "../../src/store";

const MONO = Platform.select({ ios: "Menlo", android: "monospace", default: "monospace" });

/**
 * Mirror of what the LED walls show. Deliberately dark and dense — this is the
 * screen the operator glances at to confirm the boards are correct, and it
 * doubles as the layout reference for the real LED renderer.
 */
export default function LiveBoardScreen() {
  const rows = useAppSelector(selectBoard);
  const stats = useAppSelector(selectStats);
  const clock = useClock();

  return (
    <View style={styles.root}>
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <Text style={styles.brand}>BUS BOARDING — GATE 6</Text>
          <Text style={styles.sub}>
            {stats.inYard} in yard · {stats.departed} departed · {stats.waiting} awaited
          </Text>
        </View>
        <View style={{ alignItems: "flex-end" }}>
          <Text style={styles.clock}>{clock}</Text>
          <LiveDot />
        </View>
      </View>

      <View style={styles.colHead}>
        <Text style={[styles.col, styles.colBus]}>{LABELS.vehicleNo.toUpperCase()}</Text>
        <Text style={[styles.col, styles.colRoute]}>{LABELS.route.toUpperCase()}</Text>
        <Text style={[styles.col, styles.colSlot]}>STN</Text>
        <Text style={[styles.col, styles.colStatus]}>STATUS</Text>
      </View>

      <FlatList
        data={rows}
        keyExtractor={(b) => b.id}
        renderItem={({ item, index }) => <Row bus={item} index={index} />}
        ListEmptyComponent={
          <Text style={styles.empty}>NO BUSES IN YARD — AWAITING FIRST ARRIVAL</Text>
        }
      />

      <View style={styles.ticker}>
        <Text style={styles.tickerText} numberOfLines={1}>
          ▸ Board only from your station number ▸ Keep the lane clear ▸ Reserve buses
          show the same station as the bus they replace
        </Text>
      </View>
    </View>
  );
}

function Row({ bus, index }: { bus: Bus; index: number }) {
  const boarding = bus.status === STATUS.boarding;
  const pulse = usePulse(boarding);
  const color = STATUS_COLOR[bus.status];
  const gone = bus.status === STATUS.departed || bus.status === STATUS.replaced;

  return (
    <Animated.View
      style={[
        styles.row,
        { backgroundColor: index % 2 ? BOARD.rowAlt : BOARD.row },
        boarding && { opacity: pulse },
        gone && { opacity: 0.45 },
      ]}
    >
      <Text style={[styles.cell, styles.colBus, styles.busNo]}>{bus.no}</Text>
      <Text style={[styles.cell, styles.colRoute, styles.route]} numberOfLines={1}>
        {bus.route}
      </Text>
      <Text style={[styles.cell, styles.colSlot, styles.slot]}>
        {bus.slot ?? "—"}
      </Text>
      <View style={[styles.colStatus, { alignItems: "flex-end" }]}>
        <Text style={[styles.status, { color }]}>{bus.status.toUpperCase()}</Text>
      </View>
    </Animated.View>
  );
}

function LiveDot() {
  const pulse = usePulse(true);
  return (
    <View style={styles.liveWrap}>
      <Animated.View style={[styles.liveDot, { opacity: pulse }]} />
      <Text style={styles.liveText}>LIVE</Text>
    </View>
  );
}

function useClock() {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);
  return now.toLocaleTimeString("en-GB", { hour12: false });
}

/** Slow fade loop. Stays parked at 1 when inactive so rows don't flicker. */
function usePulse(active: boolean) {
  const value = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    if (!active) {
      value.setValue(1);
      return;
    }
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(value, {
          toValue: 0.45,
          duration: 700,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(value, {
          toValue: 1,
          duration: 700,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [active, value]);
  return value;
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: BOARD.bg },
  header: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: BOARD.header,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    borderBottomWidth: 2,
    borderBottomColor: BOARD.amber,
  },
  brand: {
    color: BOARD.amber,
    fontSize: 15,
    fontWeight: "900",
    letterSpacing: 1.4,
    fontFamily: MONO,
  },
  sub: { color: BOARD.dim, fontSize: 11, marginTop: 3, fontFamily: MONO },
  clock: { color: BOARD.text, fontSize: 20, fontWeight: "900", fontFamily: MONO },
  liveWrap: { flexDirection: "row", alignItems: "center", gap: 5, marginTop: 3 },
  liveDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: "#22C55E" },
  liveText: { color: "#22C55E", fontSize: 10, fontWeight: "900", letterSpacing: 1 },

  colHead: {
    flexDirection: "row",
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: BOARD.grid,
  },
  col: { color: BOARD.dim, fontSize: 10, fontWeight: "900", letterSpacing: 1.1 },
  colBus: { width: 52 },
  colRoute: { flex: 1, paddingRight: SPACING.sm },
  colSlot: { width: 44, textAlign: "center" },
  colStatus: { width: 82 },

  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: SPACING.md,
    paddingVertical: 13,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: BOARD.grid,
  },
  cell: { fontFamily: MONO },
  busNo: { color: BOARD.amber, fontSize: 19, fontWeight: "900" },
  route: { color: BOARD.text, fontSize: 13 },
  slot: { color: BOARD.cyan, fontSize: 21, fontWeight: "900", textAlign: "center" },
  status: { fontSize: 11, fontWeight: "900", letterSpacing: 0.6, fontFamily: MONO },

  empty: {
    color: BOARD.dim,
    textAlign: "center",
    marginTop: SPACING.xl,
    fontSize: 12,
    letterSpacing: 1,
    fontFamily: MONO,
  },
  ticker: {
    backgroundColor: BOARD.header,
    borderTopWidth: 1,
    borderTopColor: BOARD.grid,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
  },
  tickerText: { color: BOARD.dim, fontSize: 11, fontFamily: MONO },
});
