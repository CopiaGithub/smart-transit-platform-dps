import { Feather } from "@expo/vector-icons";
import { useCallback, useEffect, useMemo, useState } from "react";
import { StyleSheet, Text, View, type LayoutChangeEvent } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LABELS, STATUS, STATUS_COLOR, type Status } from "../../constants/domain";
import { COLORS, RADIUS, SHADOW, SPACING } from "../../constants/theme";
import type { PlatformSlot } from "../../src/api/operations.api";
import type { GateMaster, PlatformMaster } from "../../src/api/masters.api";
import { GATE_TYPE } from "../../src/api/masters.api";
import { usePolling } from "../../src/hooks/usePolling";
import {
  fetchGates,
  fetchPlatforms,
  selectGateRows,
  selectPlatforms,
} from "../../src/store/masters.slice";
import { fetchPlatformStatus, selectPlatformStatus } from "../../src/store/operations.slice";
import { useAppDispatch, useAppSelector } from "../../src/store";

/**
 * The yard, drawn as it is on the ground.
 *
 * Everything here is read, nothing is written: an admin uses it to see where the
 * afternoon has got to, which is a question the numbers on the Home screen
 * cannot answer — "9 of 23 in use" does not say whether the free ones are the
 * next nine or scattered behind a bus that will not move.
 */

/** A platform, whatever the yard knows about it. */
type Tile = {
  number: number;
  name: string | null;
  /** False for one closed for repair — allocation skips it and so does the map. */
  active: boolean;
  /** Null when no session is open, or when the platform is simply free. */
  slot: PlatformSlot | null;
  nearestGateId: number | null;
};

/**
 * Folds the platforms into the U they are painted in.
 *
 * The compound is a single one-way lane: a bus comes in at the entry gate, drives
 * up one arm, along the top and down the other to the exit, and the platforms are
 * numbered along that path. So the U is not extra information — it is that one
 * line drawn in three pieces, and the pieces are measured from how many platforms
 * there are rather than written down. Add a platform and the fold follows.
 */
function foldIntoU<T>(all: T[]) {
  const n = all.length;
  if (n < 3) return { right: all, top: [] as T[], left: [] as T[] };

  const arm = Math.ceil(n / 3);
  return {
    right: all.slice(0, arm),
    top: all.slice(arm, n - arm),
    left: all.slice(n - arm),
  };
}

const GAP = 4;

/**
 * Colours for the student exits, taken in order.
 *
 * Indexed rather than keyed by gate id: a school with a third door gets a third
 * colour without anyone editing this, and nothing here has to know that Exit 1
 * happens to be id 3 in this database.
 */
const EXIT_COLOURS = [COLORS.primary, COLORS.accent, COLORS.success, COLORS.danger];
/** Below this a platform number stops being readable, so the yard may overflow instead. */
const MIN_TILE = 26;
const MAX_TILE = 64;

/**
 * The largest tile that still lets the whole yard sit on one screen.
 *
 * Measured rather than assumed: the yard is given the space left over after the
 * summary, the gates and the key, and the tile is whatever divides into it. The
 * two arms and the top row are counted from the fold, so a school with a
 * different number of platforms gets a size that fits it, not one tuned here.
 */
function tileSizeFor(box: { width: number; height: number }, armLen: number, topLen: number) {
  if (box.width === 0 || box.height === 0) return 0;

  // Across: the top row is the widest thing in the yard.
  const byWidth = topLen > 0 ? (box.width - GAP * (topLen - 1)) / topLen : MAX_TILE;
  // Down: one row of the top, then a whole arm beneath it.
  const byHeight = (box.height - GAP * armLen) / (armLen + 1);

  return Math.max(MIN_TILE, Math.min(MAX_TILE, Math.floor(Math.min(byWidth, byHeight))));
}

export default function YardMapScreen() {
  const dispatch = useAppDispatch();
  const insets = useSafeAreaInsets();
  const status = useAppSelector(selectPlatformStatus);
  const master = useAppSelector(selectPlatforms);
  const gateRows = useAppSelector(selectGateRows);

  /** Whatever room is left for the yard once everything fixed has been laid out. */
  const [box, setBox] = useState({ width: 0, height: 0 });
  const onYardLayout = (e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout;
    setBox((b) => (b.width === width && b.height === height ? b : { width, height }));
  };

  // The master list is read once — platforms do not appear mid-afternoon. It is
  // needed alongside the live status because the status only carries platforms
  // that are open, and a map that silently drops number 7 reads as a bug rather
  // than as "7 is closed today".
  useEffect(() => {
    dispatch(fetchPlatforms());
    dispatch(fetchGates());
  }, [dispatch]);

  usePolling(useCallback(() => void dispatch(fetchPlatformStatus()), [dispatch]));

  const tiles = useMemo<Tile[]>(() => {
    const live = new Map((status?.Platforms ?? []).map((p) => [p.PlatformNumber, p]));

    const rows: PlatformMaster[] = master.length
      ? master
      : // Before the master list lands, draw what the live call gave us.
        (status?.Platforms ?? []).map((p) => ({
          Id: p.PlatformId,
          PlatformNumber: p.PlatformNumber,
          PlatformName: p.PlatformName,
          SortOrder: 0,
          Side: null,
          IsActive: true,
        }));

    return (
      rows
        .map((r) => ({
          number: r.PlatformNumber,
          name: r.PlatformName,
          active: r.IsActive,
          slot: live.get(r.PlatformNumber) ?? null,
          nearestGateId: live.get(r.PlatformNumber)?.NearestGateId ?? null,
        }))
        // Drawn in platform order — the order they are painted in, which is the
        // order a bus drives past them. NOT SortOrder: that is the order they are
        // handed out (23 first) and using it here would draw the yard backwards.
        .sort((a, z) => a.number - z.number)
    );
  }, [master, status]);

  const { right, top, left } = foldIntoU(tiles);
  const tile = tileSizeFor(box, Math.max(left.length, right.length), top.length);

  /**
   * Each student door, with the platforms it serves and the arm they sit on.
   *
   * The side is counted, not assumed: a door is drawn on the edge of the building
   * its own platforms run along, which is the only placement that means anything
   * to somebody reading the map. Change which platforms point at which gate in
   * Platform Master and the door moves with them.
   */
  const exitBars = useMemo(() => {
    const rightNums = new Set(right.map((t) => t.number));
    const leftNums = new Set(left.map((t) => t.number));

    return gateRows
      .filter((g) => g.GateType === GATE_TYPE.studentExit && g.IsActive)
      .map((gate, i) => {
        const mine = tiles.filter((t) => t.nearestGateId === gate.Id).map((t) => t.number);
        const onRight = mine.filter((n) => rightNums.has(n)).length;
        const onLeft = mine.filter((n) => leftNums.has(n)).length;
        return {
          gate,
          colour: EXIT_COLOURS[i % EXIT_COLOURS.length],
          side: onRight >= onLeft ? ("right" as const) : ("left" as const),
          span:
            mine.length === 0
              ? "—"
              : mine.length === 1
                ? String(mine[0])
                : `${Math.min(...mine)}–${Math.max(...mine)}`,
        };
      });
  }, [gateRows, tiles, right, left]);

  const leftExits = exitBars.filter((e) => e.side === "left");
  const rightExits = exitBars.filter((e) => e.side === "right");

  const entry = gateRows.find((g) => g.GateType === GATE_TYPE.busEntry && g.IsActive);
  const exitGate = gateRows.find((g) => g.GateType === GATE_TYPE.busExit && g.IsActive);

  const next = status?.NextFreePlatformNumber ?? null;
  const occupied = status?.OccupiedCount ?? 0;
  const total = status?.PlatformCount ?? tiles.filter((t) => t.active).length;

  return (
    <View style={[styles.root, { paddingBottom: SPACING.sm + insets.bottom }]}>
      <View style={styles.summary}>
        <Stat value={`${occupied}/${total}`} label={`${LABELS.slotPlural} in use`} />
        <Stat
          value={next === null ? "—" : String(next).padStart(2, "0")}
          label="Next to fill"
          tone={COLORS.primary}
        />
        <Stat
          value={status?.YardFull ? "FULL" : "OK"}
          label="Yard"
          tone={status?.YardFull ? COLORS.danger : COLORS.success}
        />
      </View>

      {!status && (
        <Text style={styles.noteText}>
          No session is open — nothing is standing in the yard. The layout is still the real one.
        </Text>
      )}

      {/* The compound. One-way: in at the entry gate, up the right arm, across
          the top, down the left arm, out at the exit. */}
      <View style={styles.compound}>
        <Text style={styles.compoundCap}>School compound · one-way, no overtaking</Text>

        {/* Takes whatever height is left, and reports it back so the tiles can be
            cut to fit. Nothing here scrolls — a map you have to scroll is not a
            map, it is a list. */}
        <View style={styles.yard} onLayout={onYardLayout}>
          {tile > 0 && (
            <>
              <View style={styles.topRow}>
                {/* Reversed so the lowest number sits nearest the arm it continues
                    from, which is how the numbers run round the building. */}
                {[...top].reverse().map((t) => (
                  <PlatformTile key={t.number} tile={t} next={next} size={tile} />
                ))}
              </View>

              <View style={styles.middle}>
                <View style={styles.arm}>
                  {left.map((t) => (
                    <PlatformTile key={t.number} tile={t} next={next} size={tile} />
                  ))}
                </View>

                <View style={styles.building}>
                  {/* The doors sit on the wall their own platforms run along, so
                      the eye goes from a platform straight to the door serving it. */}
                  <View style={styles.buildingTop}>
                    <View style={styles.exitColumn}>
                      {leftExits.map((e) => (
                        <ExitBar key={e.gate.Id} {...e} />
                      ))}
                    </View>
                    <View style={styles.exitColumn}>
                      {rightExits.map((e) => (
                        <ExitBar key={e.gate.Id} {...e} align="right" />
                      ))}
                    </View>
                  </View>

                  <View style={styles.buildingBody}>
                    <Text style={styles.buildingText}>School building</Text>
                    <Text style={styles.buildingSub}>students come out here</Text>
                  </View>
                </View>

                <View style={styles.arm}>
                  {[...right].reverse().map((t) => (
                    <PlatformTile key={t.number} tile={t} next={next} size={tile} />
                  ))}
                </View>
              </View>
            </>
          )}
        </View>

        <View style={styles.gates}>
          <GateChip gate={exitGate} fallback="Bus exit" caption="buses leave" tone={COLORS.success} />
          <GateChip gate={entry} fallback="Bus entry" caption="buses come in" tone={COLORS.primary} />
        </View>
      </View>

      <View style={styles.legend}>
        <Key colour={COLORS.border} label="Free" />
        <Key colour={STATUS_COLOR.Arrived} label={STATUS.arrived} />
        <Key colour={STATUS_COLOR.Boarding} label={STATUS.boarding} />
        <Key colour={COLORS.primary} label="Next" outline />
        <Key colour={COLORS.textMuted} label="Closed" />
      </View>
    </View>
  );
}

/**
 * One painted platform.
 *
 * What it can say depends on how much room the yard had. The number always
 * survives — it is the thing a person is looking for — then the bus number, then
 * the word for the status. The colour carries the status at every size, which is
 * what the key at the bottom of the screen is for.
 */
function PlatformTile({
  tile,
  next,
  size,
}: {
  tile: Tile;
  next: number | null;
  size: number;
}) {
  const status = tile.slot?.Status as Status | undefined;
  const busy = !!tile.slot?.IsOccupied;
  const isNext = tile.active && !busy && tile.number === next;
  const colour = busy && status ? STATUS_COLOR[status] : null;

  const roomForBus = size >= 38;
  const roomForWord = size >= 52;

  return (
    <View
      style={[
        styles.tile,
        { width: size, height: size },
        !tile.active && styles.tileClosed,
        !!colour && { borderColor: colour, backgroundColor: colour + "14" },
        isNext && styles.tileNext,
      ]}
    >
      <Text
        style={[
          styles.tileNo,
          { fontSize: Math.round(size * 0.34) },
          !!colour && { color: colour },
          !tile.active && styles.tileNoOff,
        ]}
      >
        {String(tile.number).padStart(2, "0")}
      </Text>

      {busy && roomForBus && (
        <Text style={[styles.tileBus, { fontSize: Math.round(size * 0.2) }]} numberOfLines={1}>
          {tile.slot?.BusNumber}
        </Text>
      )}
      {busy && roomForWord && (
        <Text style={[styles.tileStatus, { color: colour ?? COLORS.textMuted }]} numberOfLines={1}>
          {status}
        </Text>
      )}
      {!busy && !tile.active && roomForBus && <Text style={styles.tileHint}>closed</Text>}
      {!busy && tile.active && isNext && roomForBus && (
        <Text style={[styles.tileHint, { color: COLORS.primary, fontWeight: "800" }]}>next</Text>
      )}
    </View>
  );
}

/**
 * A student door, drawn as the coloured strip it is on the building's wall.
 *
 * The strip is on the outside edge and the writing faces inwards, so the two
 * doors read outward from the middle of the building the way they are actually
 * arranged — the same as standing in the compound and looking at the wall.
 */
function ExitBar({
  gate,
  colour,
  span,
  align = "left",
}: {
  gate: GateMaster;
  colour: string;
  span: string;
  align?: "left" | "right";
}) {
  const strip = <View style={[styles.exitStrip, { backgroundColor: colour }]} />;

  return (
    <View style={[styles.exitBar, align === "right" && styles.exitBarRight]}>
      {align === "left" && strip}
      <View style={styles.exitText}>
        <Text style={[styles.exitName, { color: colour, textAlign: align }]} numberOfLines={1}>
          {gate.GateName}
        </Text>
        <Text style={[styles.exitMeta, { textAlign: align }]} numberOfLines={1}>
          {gate.GateCode} · id {gate.Id}
        </Text>
        <Text style={[styles.exitSpan, { textAlign: align }]} numberOfLines={1}>
          {LABELS.slotPlural} {span}
        </Text>
      </View>
      {align === "right" && strip}
    </View>
  );
}

function GateChip({
  gate,
  fallback,
  caption,
  tone,
}: {
  gate: GateMaster | undefined;
  fallback: string;
  caption: string;
  tone: string;
}) {
  return (
    <View style={[styles.gateChip, { backgroundColor: tone }]}>
      <Text style={styles.gateName} numberOfLines={1}>
        {gate?.GateName ?? fallback}
      </Text>
      <Text style={styles.gateCaption}>{caption}</Text>
    </View>
  );
}

function Stat({ value, label, tone }: { value: string; label: string; tone?: string }) {
  return (
    <View style={styles.stat}>
      <Text style={[styles.statValue, !!tone && { color: tone }]}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function Key({ colour, label, outline }: { colour: string; label: string; outline?: boolean }) {
  return (
    <View style={styles.key}>
      <View
        style={[
          styles.keyDot,
          { borderColor: colour, backgroundColor: outline ? "transparent" : colour + "22" },
        ]}
      />
      <Text style={styles.keyLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  // Everything is laid out with flex and nothing scrolls: the yard takes what is
  // left after the fixed rows, and the tiles are cut to that.
  root: {
    flex: 1,
    backgroundColor: COLORS.screenBg,
    padding: SPACING.sm,
    gap: SPACING.sm,
  },

  summary: { flexDirection: "row", gap: SPACING.xs },
  stat: {
    flex: 1,
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 7,
    ...SHADOW.card,
  },
  statValue: { fontSize: 18, fontWeight: "900", color: COLORS.text },
  statLabel: { fontSize: 9, color: COLORS.textMuted, letterSpacing: 0.4 },

  noteText: { fontSize: 11, color: COLORS.textMuted, lineHeight: 15 },

  compound: {
    flex: 1,
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderStyle: "dashed",
    padding: SPACING.xs,
    gap: SPACING.xs,
    ...SHADOW.card,
  },
  /**
   * The measured area. Its height is what decides the tile size, and the yard is
   * centred in it — the top row is usually the binding constraint, so there is
   * spare height and the U should sit in the middle of it rather than clinging
   * to the top.
   */
  yard: { flex: 1, gap: GAP, justifyContent: "center" },
  compoundCap: {
    fontSize: 8,
    fontWeight: "900",
    letterSpacing: 0.6,
    color: COLORS.textMuted,
    textTransform: "uppercase",
  },

  // No wrapping: the top row is sized to fit on one line by tileSizeFor, and
  // letting it wrap would silently break the U instead of shrinking the tiles.
  topRow: { flexDirection: "row", gap: GAP, justifyContent: "center" },
  // Sized by the arms, not by the leftover space: stretching the row would leave
  // the building taller than the platforms flanking it, which is not the shape
  // of the real compound.
  middle: { flexDirection: "row", gap: GAP, alignItems: "stretch" },
  arm: { gap: GAP },

  building: {
    flex: 1,
    alignSelf: "stretch",
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surfaceAlt,
    overflow: "hidden",
  },
  // The doors live along the top of the wall; the name of the place sits under
  // them, which is the order you read a building from the yard.
  buildingTop: { flexDirection: "row", justifyContent: "space-between", gap: 2 },
  exitColumn: { flexShrink: 1, gap: 3 },
  buildingBody: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 2,
    padding: SPACING.xs,
  },
  buildingText: {
    fontSize: 12,
    fontWeight: "800",
    color: COLORS.text,
    textAlign: "center",
  },
  buildingSub: { fontSize: 9, color: COLORS.textMuted, textAlign: "center" },

  exitBar: { flexDirection: "row", alignItems: "stretch", gap: 4 },
  exitBarRight: { justifyContent: "flex-end" },
  /** The door itself: a band of colour flush against the outside wall. */
  exitStrip: { width: 6, borderRadius: 2, minHeight: 34 },
  exitText: { flexShrink: 1, paddingVertical: 3 },
  exitName: { fontSize: 9, fontWeight: "900" },
  exitMeta: { fontSize: 7, color: COLORS.textMuted },
  exitSpan: { fontSize: 8, color: COLORS.textMuted, fontWeight: "700" },

  // Width and height come from the measured fit, so they are set inline.
  tile: {
    borderRadius: RADIUS.sm,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surface,
    alignItems: "center",
    justifyContent: "center",
  },
  tileClosed: { backgroundColor: COLORS.surfaceAlt, borderStyle: "dashed" },
  tileNext: { borderColor: COLORS.primary, borderWidth: 2.5 },
  tileNo: { fontWeight: "900", color: COLORS.text },
  tileNoOff: { color: COLORS.textMuted },
  tileBus: { fontWeight: "800", color: COLORS.text },
  tileStatus: { fontSize: 7, fontWeight: "900", letterSpacing: 0.2 },
  tileHint: { fontSize: 7, color: COLORS.textMuted, letterSpacing: 0.2 },

  gates: { flexDirection: "row", justifyContent: "space-between", gap: SPACING.xs },
  gateChip: { flex: 1, borderRadius: RADIUS.sm, paddingHorizontal: SPACING.sm, paddingVertical: 5 },
  gateName: { color: COLORS.white, fontSize: 10, fontWeight: "900" },
  gateCaption: { color: COLORS.white, opacity: 0.85, fontSize: 8 },

  legend: { flexDirection: "row", flexWrap: "wrap", gap: SPACING.sm, justifyContent: "center" },
  key: { flexDirection: "row", alignItems: "center", gap: 4 },
  keyDot: { width: 11, height: 11, borderRadius: 3, borderWidth: 2 },
  keyLabel: { fontSize: 10, color: COLORS.textMuted },
});
