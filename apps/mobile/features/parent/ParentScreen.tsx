import { Feather } from "@expo/vector-icons";
import { useCallback, useEffect } from "react";
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from "react-native";
import Avatar from "../../components/Avatar";
import { LABELS, STATUS, STATUS_COLOR } from "../../constants/domain";
import { COLORS, RADIUS, SHADOW, SPACING, TINT } from "../../constants/theme";
import type { BoardRow } from "../../src/api/operations.api";
import type { ParentChild } from "../../src/api/people.api";
import { usePolling } from "../../src/hooks/usePolling";
import { formatTime } from "../../src/services/time";
import { fetchBoard, selectBoardRows } from "../../src/store/operations.slice";
import { fetchMyChildren, selectMyChildren } from "../../src/store/parent.slice";
import { useAppDispatch, useAppSelector } from "../../src/store";
import { useViewer } from "../auth/useViewer";

/**
 * The parent's whole app: their own children, the bus each one rides and where
 * that bus is right now. Strictly read-only — a parent watches, never marks.
 */
export default function ParentScreen() {
  const dispatch = useAppDispatch();
  const viewer = useViewer();
  const children = useAppSelector(selectMyChildren);
  const rows = useAppSelector(selectBoardRows);
  const board = useAppSelector((s) => s.ops.board);
  const { loading, loaded, error } = useAppSelector((s) => s.parent);

  // Who the children are changes at most once a term; where their bus is
  // changes every minute. So one is fetched, the other polled.
  useEffect(() => {
    if (viewer.userId) dispatch(fetchMyChildren(viewer.userId));
  }, [dispatch, viewer.userId]);

  usePolling(useCallback(() => void dispatch(fetchBoard(undefined)), [dispatch]));

  return (
    <ScrollView style={styles.root} contentContainerStyle={styles.content}>
      <View>
        <Text style={styles.hello}>Hello, {viewer.name || "there"}</Text>
        <Text style={styles.title}>
          {children.length === 1 ? "Your child today" : "Your children today"}
        </Text>
      </View>

      {!loaded && loading ? (
        <View style={styles.centre}>
          <ActivityIndicator color={COLORS.primary} />
        </View>
      ) : error ? (
        <View style={styles.emptyCard}>
          <Feather name="wifi-off" size={28} color={COLORS.danger} />
          <Text style={styles.emptyTitle}>Cannot load right now</Text>
          <Text style={styles.emptySub}>{error}</Text>
        </View>
      ) : children.length === 0 ? (
        <View style={styles.emptyCard}>
          <Feather name="user-x" size={30} color={COLORS.textMuted} />
          <Text style={styles.emptyTitle}>No child linked yet</Text>
          <Text style={styles.emptySub}>
            Ask the school office to link your child to this account.
          </Text>
        </View>
      ) : (
        children.map((child) => (
          <ChildCard
            key={child.StudentId}
            child={child}
            // The board is the only place a bus's live position exists, and it
            // is keyed by bus number — the same number printed on the vehicle.
            live={
              child.BusNumber
                ? (rows.find((r) => r.BusNumber === child.BusNumber) ?? null)
                : null
            }
          />
        ))
      )}

      <Text style={styles.footnote}>
        This screen updates on its own as security and the class teacher mark the
        {" "}{LABELS.vehicle.toLowerCase()}. Nothing here can be changed from your side.
        {board?.GeneratedAt ? `\nLast updated ${atTime(board.GeneratedAt)}.` : ""}
      </Text>
    </ScrollView>
  );
}

function ChildCard({ child, live }: { child: ParentChild; live: BoardRow | null }) {
  const tone = statusTone(live);

  return (
    <View style={styles.card}>
      {/* A thin band of the status colour along the top: on a screen a parent
          checks in a hurry, the state should register before any reading. */}
      <View style={[styles.stripe, { backgroundColor: tone.color }]} />

      <View style={styles.cardBody}>
        <View style={styles.childRow}>
          {/* The child's face when the school has one, their initials when it
              does not — a parent picks their own child out by the picture. */}
          <Avatar name={child.StudentName} uri={child.PhotoUrl} size={46} />
          <View style={{ flex: 1 }}>
            <Text style={styles.childName}>{child.StudentName}</Text>
            <Text style={styles.childClass}>
              Class {child.Class} · {child.AdmissionNumber}
            </Text>
          </View>
        </View>

        {child.BusNumber ? (
          <View style={styles.facts}>
            {/* The station number is what the child is told to walk to, so it
                is the one thing on this card sized to be read across a room. */}
            <View style={styles.stationBox}>
              <Text style={styles.stationCap}>{LABELS.slot.toUpperCase()}</Text>
              <Text style={styles.stationNo}>
                {live?.PlatformNumber == null
                  ? "—"
                  : String(live.PlatformNumber).padStart(2, "0")}
              </Text>
            </View>

            <View style={{ flex: 1, gap: SPACING.sm }}>
              {/* The state sits on the bus line rather than beside the name:
                  what a parent is checking is the bus, not the child. */}
              <Fact
                label={LABELS.vehicleNo}
                value={child.BusNumber}
                strong
                trailing={
                  <View style={[styles.pill, { backgroundColor: tone.bg, borderColor: tone.color }]}>
                    <View style={[styles.pillDot, { backgroundColor: tone.color }]} />
                    <Text style={[styles.pillText, { color: tone.color }]} numberOfLines={1}>
                      {tone.label}
                    </Text>
                  </View>
                }
              />
              <Fact label={LABELS.route} value={live?.RouteName ?? child.RouteName ?? "—"} />
              {/* Whichever timestamp belongs to the state now showing — a
                  departure time under "Boarding" would be a different bus. */}
              <Fact label="Time" value={tone.at ?? "—"} />
              {/* Hidden on request — the exit gate ("School Building Exit 1")
                  is not something a parent needs. The field still arrives on
                  ParentChild, so putting this line back is all it takes.
              {!!child.ExitGateName && <Fact label="Exit" value={child.ExitGateName} />} */}
            </View>
          </View>
        ) : (
          <View style={styles.noBus}>
            <Feather name="slash" size={14} color={COLORS.textMuted} />
            <Text style={styles.missing}>
              Not a transport user — no {LABELS.vehicle.toLowerCase()} assigned
            </Text>
          </View>
        )}
      </View>
    </View>
  );
}

function Fact({
  label,
  value,
  strong,
  trailing,
}: {
  label: string;
  value: string;
  strong?: boolean;
  trailing?: React.ReactNode;
}) {
  return (
    <View style={styles.fact}>
      <Text style={styles.factLabel}>{label}</Text>
      <Text style={[styles.factValue, strong && styles.factValueStrong]} numberOfLines={1}>
        {value}
      </Text>
      {trailing}
    </View>
  );
}


// Through formatTime, never `new Date` — the server's timestamps are UTC with
// no marker on them, so a raw parse puts a parent's bus five and a half hours
// out. See src/services/time.ts.
const atTime = (iso: string | null | undefined) => formatTime(iso);

/**
 * A parent is answering two questions and no others: has the bus come, and has
 * it gone. So the board's five operating states collapse to two here.
 *
 * Boarding, Waiting and Replaced are the school's own business — a parent
 * cannot act on any of them, and "Inside, holding" only reads as something
 * being wrong. All three mean the bus is at the school, which is what Arrived
 * says. The board and the gate screens keep the full set; this is the only
 * place it is narrowed.
 *
 * `at` is per-state: a bus that has left is timed by its departure, one still
 * here by when it took its station. A single "the time" would otherwise mean a
 * different thing on each card.
 */
function statusTone(live: BoardRow | null) {
  if (live?.Status === STATUS.departed) {
    return {
      label: "Departed",
      color: STATUS_COLOR.Departed,
      bg: TINT.success,
      at: atTime(live?.DepartedAt),
    };
  }

  if (
    live?.Status === STATUS.arrived ||
    live?.Status === STATUS.boarding ||
    live?.Status === STATUS.waiting
  ) {
    return {
      label: "Arrived",
      color: STATUS_COLOR.Arrived,
      bg: TINT.info,
      // A holding bus has no station yet, so it is timed by the gate instead.
      at: atTime(live.Status === STATUS.waiting ? live.EnteredAt : live.AssignedAt),
    };
  }

  // Nothing on the board yet, or the service was handed to a reserve — either
  // way this bus has not arrived. Deliberately not a third coloured state.
  return {
    label: "Not arrived yet",
    color: COLORS.textMuted,
    bg: COLORS.surfaceAlt,
    at: null,
  };
}



const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.screenBg },
  content: { padding: SPACING.md, gap: SPACING.md, paddingBottom: SPACING.xl },
  centre: { paddingVertical: SPACING.xl },

  hello: { fontSize: 13, color: COLORS.textMuted },
  title: { fontSize: 24, fontWeight: "900", color: COLORS.text },

  card: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.xl,
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: "hidden",
    ...SHADOW.card,
  },
  stripe: { height: 4 },
  cardBody: { padding: SPACING.md, gap: SPACING.md },

  childRow: { flexDirection: "row", alignItems: "center", gap: SPACING.sm + 4 },
  childName: { fontSize: 17, fontWeight: "900", color: COLORS.text, letterSpacing: -0.2 },
  childClass: { fontSize: 12, color: COLORS.textMuted, marginTop: 2 },

  pill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 9,
    paddingVertical: 5,
  },
  pillDot: { width: 7, height: 7, borderRadius: 4 },
  pillText: { fontSize: 10, fontWeight: "900", letterSpacing: 0.3 },

  facts: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: COLORS.border,
    paddingTop: SPACING.md,
  },
  stationBox: {
    width: 66,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.md,
    backgroundColor: TINT.primary,
    alignItems: "center",
  },
  stationCap: {
    fontSize: 8,
    fontWeight: "900",
    letterSpacing: 1,
    color: COLORS.textMuted,
  },
  stationNo: { fontSize: 28, fontWeight: "900", color: COLORS.primary, lineHeight: 32 },

  fact: { flexDirection: "row", alignItems: "center", gap: SPACING.sm },
  factLabel: { width: 62, fontSize: 11, color: COLORS.textMuted, fontWeight: "600" },
  factValue: { flex: 1, fontSize: 13, color: COLORS.text },
  factValueStrong: { fontWeight: "900", fontSize: 15 },

  noBus: { flexDirection: "row", alignItems: "center", gap: SPACING.sm },
  missing: { flex: 1, fontSize: 12, color: COLORS.textMuted, fontStyle: "italic" },

  emptyCard: {
    alignItems: "center",
    gap: SPACING.xs,
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: COLORS.border,
    padding: SPACING.lg,
  },
  emptyTitle: { fontSize: 16, fontWeight: "800", color: COLORS.text },
  emptySub: { fontSize: 13, color: COLORS.textMuted, textAlign: "center" },

  footnote: { fontSize: 11, color: COLORS.textMuted, lineHeight: 16, textAlign: "center" },
});
