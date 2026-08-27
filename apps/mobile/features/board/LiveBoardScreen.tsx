import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Animated,
  Easing,
  FlatList,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { LABELS, STATUS, STATUS_COLOR, STATUS_RANK, type Status } from "../../constants/domain";
import { BOARD, SPACING } from "../../constants/theme";
import type { BoardRow } from "../../src/api/operations.api";
import { usePolling } from "../../src/hooks/usePolling";
import { fetchDisplays, selectDisplays } from "../../src/store/masters.slice";
import { fetchBoard, selectBoardRows, selectOpsStats } from "../../src/store/operations.slice";
import { useAppDispatch, useAppSelector } from "../../src/store";

const MONO = Platform.select({ ios: "Menlo", android: "monospace", default: "monospace" });

/**
 * Near-black or near-white, whichever reads on a given chip fill. A selected chip
 * takes its status's own colour, and those range from a light amber to a dark
 * blue — one fixed text colour vanished on half of them (dark text on the blue
 * "Arrived" chip was the bug: it disappeared the moment the filter was picked).
 */
function readableText(hex: string): string {
  const h = hex.replace("#", "");
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.6 ? "#0B1220" : "#FFFFFF";
}

/**
 * The status chips, in the order the board itself ranks them (§5.9) rather than
 * the order the constant happens to declare — the strip and the rows under it
 * then read the same way down the screen.
 *
 * Every status is always offered, including one with no buses today. A chip that
 * came and went as the yard filled would move the others under a thumb that had
 * already learned where they sit.
 */
const STATUS_FILTERS = (Object.keys(STATUS_RANK) as Status[]).sort(
  (a, z) => STATUS_RANK[a] - STATUS_RANK[z],
);

/**
 * Mirror of what the LED walls show. Deliberately dark and dense — this is the
 * screen the operator glances at to confirm the boards are correct, and it
 * doubles as the layout reference for the real LED renderer.
 */
export default function LiveBoardScreen() {
  const dispatch = useAppDispatch();
  const rows = useAppSelector(selectBoardRows);
  const stats = useAppSelector(selectOpsStats);
  const displays = useAppSelector(selectDisplays);
  const board = useAppSelector((s) => s.ops.board);
  const clock = useClock();

  // Which wall this screen is mirroring. Undefined = the outdoor wall's view,
  // every bus; a code scopes it to one indoor panel's own student exit (§5.9).
  const [displayCode, setDisplayCode] = useState<string | undefined>(undefined);
  /** Null = every status. Filtered here, not on the server — see STATUS_FILTERS. */
  const [status, setStatus] = useState<Status | null>(null);

  useEffect(() => {
    dispatch(fetchDisplays());
  }, [dispatch]);

  // The panels poll continuously (§5.9); the app mirrors them the same way.
  usePolling(useCallback(() => void dispatch(fetchBoard(displayCode)), [dispatch, displayCode]));

  // The wall chip is a different request; the status chip is not. Every row of
  // the session is already in hand and the server has no status parameter, so
  // asking again would cost a round trip to hide rows we are holding.
  const shown = useMemo(
    () => (status ? rows.filter((r) => r.Status === status) : rows),
    [rows, status],
  );
  const counts = useMemo(() => {
    const tally: Partial<Record<Status, number>> = {};
    for (const r of rows) tally[r.Status as Status] = (tally[r.Status as Status] ?? 0) + 1;
    return tally;
  }, [rows]);

  return (
    <View style={styles.root}>
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <Text style={styles.brand}>{LABELS.school.toUpperCase()} — BUS BOARDING</Text>
          <Text style={styles.sub}>
            {board?.FilteredByGateName
              ? `${board.DisplayName} · ${board.FilteredByGateName}`
              : `${stats.arrived} arrived · ${stats.boarding} boarding · ${stats.departed} departed`}
          </Text>
        </View>
        <View style={{ alignItems: "flex-end" }}>
          <Text style={styles.clock}>{clock}</Text>
          <LiveDot />
        </View>
      </View>

      {displays.length > 0 && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.wallStripBar}
          contentContainerStyle={styles.wallStrip}
        >
          {[{ DisplayCode: undefined, DisplayName: "ALL BUSES" }, ...displays].map((d) => {
            const on = displayCode === d.DisplayCode;
            const fill = on ? BOARD.amber : BOARD.rowAlt;
            return (
              <Pressable
                key={d.DisplayCode ?? "all"}
                style={[styles.wall, { backgroundColor: fill, borderColor: on ? fill : BOARD.grid }]}
                onPress={() => setDisplayCode(d.DisplayCode)}
              >
                <Text style={[styles.wallText, { color: on ? readableText(fill) : BOARD.text }]}>
                  {d.DisplayName.toUpperCase()}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      )}

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.wallStripBar}
        contentContainerStyle={styles.wallStrip}
      >
        {[null, ...STATUS_FILTERS].map((s) => {
          const on = status === s;
          // Selected: lit in the status's own colour (amber for ALL), matching the
          // STATUS column below. Text colour is chosen for that fill so it never
          // vanishes — a fixed dark text disappeared on the darker status colours.
          const fill = on ? (s ? STATUS_COLOR[s] : BOARD.amber) : BOARD.rowAlt;
          return (
            <Pressable
              key={s ?? "all"}
              style={[styles.wall, { backgroundColor: fill, borderColor: on ? fill : BOARD.grid }]}
              onPress={() => setStatus(s)}
              accessibilityRole="button"
              accessibilityState={{ selected: on }}
            >
              <Text style={[styles.wallText, { color: on ? readableText(fill) : BOARD.text }]}>
                {(s ?? "ALL").toUpperCase()} {s ? (counts[s] ?? 0) : rows.length}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      <View style={styles.colHead}>
        <Text style={[styles.col, styles.colBus]}>{LABELS.vehicleNo.toUpperCase()}</Text>
        <Text style={[styles.col, styles.colRoute]}>{LABELS.route.toUpperCase()}</Text>
        <Text style={[styles.col, styles.colSlot]}>STN</Text>
        <Text style={[styles.col, styles.colStatus]}>STATUS</Text>
      </View>

      <FlatList
        data={shown}
        keyExtractor={(b) => String(b.EventId)}
        renderItem={({ item, index }) => <Row bus={item} index={index} />}
        ListEmptyComponent={
          // Three different empties, and the board used to show the last one for
          // all three: the first read of the day arrives a moment after the
          // screen does, and "awaiting first arrival" is a statement about the
          // yard that nobody had checked yet.
          <Text style={styles.empty}>
            {!board
              ? "READING THE BOARD…"
              : status
                ? `NO BUSES ARE ${status.toUpperCase()}`
                : "NO BUSES ON CAMPUS — AWAITING FIRST ARRIVAL"}
          </Text>
        }
      />

      <View style={styles.ticker}>
        <Text style={styles.tickerText} numberOfLines={1}>
          ▸ Board only from your station number ▸ ARRIVED = wait at the station ▸ BOARDING =
          get in now ▸ Reserve buses keep the station of the bus they replace
        </Text>
      </View>
    </View>
  );
}

function Row({ bus, index }: { bus: BoardRow; index: number }) {
  const color = STATUS_COLOR[bus.Status as Status];
  const gone = bus.Status === STATUS.departed || bus.Status === STATUS.replaced;

  // Boarding rows are deliberately static — the spec asks for no blinking, so
  // the amber STATUS text alone carries the "get in now" signal.
  return (
    <View
      style={[
        styles.row,
        { backgroundColor: index % 2 ? BOARD.rowAlt : BOARD.row },
        gone && { opacity: 0.45 },
      ]}
    >
      <Text style={[styles.cell, styles.colBus, styles.busNo]}>{bus.BusNumber}</Text>
      <Text style={[styles.cell, styles.colRoute, styles.route]} numberOfLines={1}>
        {bus.LedDisplayName ?? bus.RouteName ?? "—"}
      </Text>
      <Text style={[styles.cell, styles.colSlot, styles.slot]}>
        {bus.PlatformNumber ?? "—"}
      </Text>
      <View style={styles.colStatus}>
        <Text style={[styles.status, { color }]}>{bus.Status?.toUpperCase()}</Text>
        {/* Which reserve took the run over — the point of the replace flow, so it
            reads on the board next to the pulled bus. */}
        {bus.Status === STATUS.replaced && !!bus.ReplacedByBusNumber && (
          <Text style={styles.replacedBy}>→ {bus.ReplacedByBusNumber}</Text>
        )}
      </View>
    </View>
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
  // 12-hour with AM/PM, matching every other clock in the product. Note this
  // string is two characters longer than the 24-hour form it replaced, on a
  // panel whose header has a fixed slot for it.
  return now.toLocaleTimeString("en-US", { hour12: true });
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

  // Horizontal scroll strip with an explicit height. Without a fixed height the
  // strip and its chips collapsed on the first layout pass — the labels only
  // appeared after a re-render (e.g. tapping a filter). A set height lays them
  // out correctly the moment the board opens.
  // marginVertical separates the two strips from each other and from the header
  // above and the column head below — without it the fixed-height strips sat flush.
  wallStripBar: { height: 34, flexGrow: 0, marginVertical: SPACING.xs },
  wallStrip: {
    gap: SPACING.sm,
    paddingHorizontal: SPACING.md,
    alignItems: "center",
  },
  // Fixed height + centred content so a chip can never collapse to nothing on the
  // first render; fill and text colours are set inline per chip (selected takes
  // the status colour, unselected a solid dark fill) so the label always reads.
  wall: {
    height: 32,
    justifyContent: "center",
    paddingHorizontal: SPACING.md,
    borderRadius: 6,
    borderWidth: 1,
  },
  wallText: { fontSize: 11, fontWeight: "900", letterSpacing: 0.5, fontFamily: MONO },

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
  // Carries both alignments because the same style dresses the header, which is
  // a Text, and the cell, which is a View wrapping one. React Native ignores
  // textAlign on a View and alignItems on a Text, so each takes the one it can
  // use and the column finally lines up.
  colStatus: { width: 82, textAlign: "right", alignItems: "flex-end" },
  replacedBy: {
    fontFamily: MONO,
    fontSize: 10,
    fontWeight: "900",
    color: STATUS_COLOR.Replaced,
    marginTop: 2,
  },

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
  // textAlign right so a two-line status ("YET TO ARRIVE") stays under the STATUS
  // heading instead of the wrapped lines drifting left.
  status: { fontSize: 11, fontWeight: "900", letterSpacing: 0.6, fontFamily: MONO, textAlign: "right" },

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
