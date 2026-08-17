import { Feather } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { useCallback, useMemo, useState } from "react";
import { FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import { askConfirm } from "../../components/ConfirmHost";
import FlashBar, { useFlash } from "../../components/FlashBar";
import SlotBadge from "../../components/SlotBadge";
import { LABELS, STATUS, STATUS_COLOR, type Status } from "../../constants/domain";
import { COLORS, RADIUS, SHADOW, SPACING, TINT } from "../../constants/theme";
import { attendanceApi, type BusRollCall } from "../../src/api/attendance.api";
import { usePolling } from "../../src/hooks/usePolling";
import {
  fetchQueue,
  selectOpsStats,
  selectWaiting,
  selectYard,
  startBoarding,
} from "../../src/store/operations.slice";
import { useAppDispatch, useAppSelector } from "../../src/store";

/**
 * The teacher's whole app. A bus appears the instant security lets it in and
 * the Mark boarding button sits on that same row — no dashboard, no drill-in,
 * nothing between the arrival and the tap.
 */
export default function BoardingScreen() {
  const dispatch = useAppDispatch();
  const yard = useAppSelector(selectYard);
  const waiting = useAppSelector(selectWaiting);
  const stats = useAppSelector(selectOpsStats);
  const submitting = useAppSelector((s) => s.ops.submitting);
  const opsError = useAppSelector((s) => s.ops.error);
  const loading = useAppSelector((s) => s.ops.loading);
  const { flash, show } = useFlash();

  /** Today's roll per bus, keyed by BusId. Empty until it arrives, or if it fails. */
  const [roll, setRoll] = useState<Record<number, BusRollCall>>({});
  /** Which buses have their absentee names open. Collapsed is the normal state. */
  const [openRolls, setOpenRolls] = useState<Record<number, boolean>>({});

  usePolling(useCallback(() => void dispatch(fetchQueue()), [dispatch]));

  // Not polled with the queue: a class is marked in the morning and does not
  // change while the yard empties. Re-read on focus so a teacher who marks a
  // late arrival and comes back sees it, without a request every few seconds.
  useFocusEffect(
    useCallback(() => {
      let live = true;
      attendanceApi
        .byBus()
        .then((rows) => {
          if (!live) return;
          setRoll(Object.fromEntries(rows.map((r) => [r.BusId, r])));
        })
        // A missing roll is not worth an error on this screen — the buses still
        // have to be boarded, and the counts are an aid, not the job.
        .catch(() => {});
      return () => {
        live = false;
      };
    }, []),
  );

  // Buses still to board rise to the top: those are the ones needing a tap.
  // Waiting buses are shown last — they have no platform for students to walk
  // to, so boarding cannot start on them (§5.4).
  // Stable sort: only "not yet boarding" is lifted to the top, everything else
  // keeps the server's platform order. QueueOrder is entry order, not display
  // order, so using it as a tiebreak would scramble the list.
  const rows = useMemo(
    () => [
      ...[...yard].sort(
        (a, z) =>
          Number(a.Status === STATUS.boarding) - Number(z.Status === STATUS.boarding),
      ),
      ...waiting,
    ],
    [yard, waiting],
  );

  const board = async (eventId: number, busNumber: string) => {
    const result = await dispatch(startBoarding({ eventId, busNumber }));
    if (startBoarding.fulfilled.match(result)) show(String(result.payload));
  };

  /**
   * Boarding is the point of no return for a child left in a classroom: once the
   * bus is called, the teacher's attention moves to the next one. So a bus whose
   * riders were never marked present or absent asks first.
   *
   * A warning, not a block — the register being unmarked is the office's
   * omission, and holding a bus in the yard over it would punish the wrong
   * people. The teacher is told what is missing and decides.
   */
  const confirmBoard = (eventId: number, busNumber: string, bus?: BusRollCall) => {
    const unmarked = bus?.UnmarkedCount ?? 0;
    if (unmarked === 0) {
      void board(eventId, busNumber);
      return;
    }

    askConfirm({
      title: `${LABELS.vehicle} ${busNumber} — attendance not marked`,
      highlight: `${unmarked === bus!.TotalStudents ? "All " : ""}${unmarked} of ${
        bus!.TotalStudents
      } ${unmarked === 1 ? "student" : "students"}`,
      message:
        "No class attendance has been marked for them today, so nobody has confirmed they are " +
        `in school. Check the register before you call this ${LABELS.vehicle.toLowerCase()}.`,
      confirmText: "Board anyway",
      icon: "user-x",
      onConfirm: () => void board(eventId, busNumber),
    });
  };

  return (
    <View style={styles.root}>
      <View style={styles.post}>
        <Feather name="users" size={16} color={COLORS.white} />
        <Text style={styles.postText}>{stats.arrived} waiting to board</Text>
        <View style={{ flex: 1 }} />
        <Text style={styles.postCount}>{stats.boarding} boarding now</Text>
      </View>

      {!!flash && <FlashBar text={flash} />}

      {!flash && !!opsError && (
        <View style={styles.alert}>
          <Feather name="alert-circle" size={16} color={COLORS.danger} />
          <Text style={styles.alertText}>{opsError}</Text>
        </View>
      )}

      <FlatList
        data={rows}
        keyExtractor={(r) => String(r.EventId)}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Feather name="clock" size={38} color={COLORS.textMuted} />
            <Text style={styles.emptyTitle}>
              {loading
                ? "Loading…"
                : `No ${LABELS.vehiclePlural.toLowerCase()} on campus`}
            </Text>
            {!loading && (
              <Text style={styles.emptySub}>
                They appear here the moment security lets them in
              </Text>
            )}
          </View>
        }
        renderItem={({ item }) => {
          const boarding = item.Status === STATUS.boarding;
          const noPlatform = item.Status === STATUS.waiting;
          const bus = roll[item.BusId];
          const open = !!openRolls[item.BusId];
          return (
            <View style={[styles.row, boarding && styles.rowDone]}>
              <View style={styles.rowMain}>
                <SlotBadge
                  slot={item.PlatformNumber}
                  size="md"
                  tone={boarding ? "solid" : "light"}
                />

                <View style={{ flex: 1 }}>
                  <Text style={styles.no}>
                    {LABELS.vehicle} {item.BusNumber}
                  </Text>
                  <Text style={styles.route} numberOfLines={1}>
                    {item.RouteName ?? "No route allocated"}
                  </Text>
                  <Text style={[styles.status, { color: STATUS_COLOR[item.Status as Status] }]}>
                    {item.Status}
                  </Text>
                </View>

                {boarding ? (
                  <View style={styles.doneMark}>
                    <Feather name="check" size={22} color={COLORS.warning} />
                    <Text style={styles.doneText}>DONE</Text>
                  </View>
                ) : noPlatform ? (
                  <View style={styles.doneMark}>
                    <Feather name="clock" size={20} color={COLORS.textMuted} />
                    <Text style={styles.waitText}>NO{"\n"}PLATFORM</Text>
                  </View>
                ) : (
                  <Pressable
                    style={({ pressed }) => [
                      styles.btn,
                      (pressed || submitting) && styles.btnPressed,
                    ]}
                    disabled={submitting}
                    onPress={() => confirmBoard(item.EventId, item.BusNumber, bus)}
                  >
                    <Feather name="users" size={17} color={COLORS.white} />
                    <Text style={styles.btnText}>MARK{"\n"}BOARDING</Text>
                  </Pressable>
                )}
              </View>

              {/* The roll, one line. Nothing here is shown for a bus with nobody
                  allocated to it — a reserve, usually — because "0 riding" reads
                  like a fault rather than like the empty fact it is. */}
              {!!bus && bus.TotalStudents > 0 && (
                <RollLine
                  bus={bus}
                  open={open}
                  onToggle={() =>
                    setOpenRolls((o) => ({ ...o, [item.BusId]: !o[item.BusId] }))
                  }
                />
              )}
            </View>
          );
        }}
      />

    </View>
  );
}

/**
 * How many children this bus is waiting for, and who is not coming.
 *
 * The count leads and the names hide behind a tap. A teacher has a bus in front
 * of them and minutes to clear the yard: the number answers "is anything wrong",
 * and only when something is do the names matter. Showing thirty names by
 * default would be the same as showing nothing.
 */
function RollLine({
  bus,
  open,
  onToggle,
}: {
  bus: BusRollCall;
  open: boolean;
  onToggle: () => void;
}) {
  const away = bus.AbsentCount > 0;

  return (
    <View style={styles.roll}>
      <Pressable
        style={styles.rollHead}
        onPress={onToggle}
        // Nothing to expand when everyone is accounted for.
        disabled={!away}
        hitSlop={6}
      >
        <Feather
          name={away ? "user-x" : "users"}
          size={13}
          color={away ? COLORS.danger : COLORS.textMuted}
        />
        <Text style={styles.rollText}>
          {/* "On the roll", not "riding". The number is who the records put on
              this bus, which is not the same as who is getting on it — and a
              teacher reading "3 riding · 3 class not marked" quite reasonably
              asked how both could be true of the same three children. */}
          <Text style={styles.rollStrong}>{bus.TotalStudents}</Text> on the roll
          {away && (
            <Text style={styles.rollAway}>
              {"  ·  "}
              {bus.AbsentCount} not in school
            </Text>
          )}
          {/* Not folded into the roll: nobody has said whether these children
              came in, and guessing on a teacher's behalf is how a child gets
              left behind. Named as students rather than as classes — the count
              is children, and the register is only where it is missing from. */}
          {bus.UnmarkedCount > 0 && (
            <Text style={styles.rollUnmarked}>
              {"  ·  "}
              {bus.UnmarkedCount} not marked present
            </Text>
          )}
        </Text>
        {away && (
          <Feather
            name={open ? "chevron-up" : "chevron-down"}
            size={15}
            color={COLORS.danger}
          />
        )}
      </Pressable>

      {open &&
        bus.Absentees.map((a) => (
          <Text key={a.StudentId} style={styles.rollName}>
            {a.Name} · {a.Class}
          </Text>
        ))}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.screenBg, padding: SPACING.md, gap: SPACING.sm },

  post: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.sm,
    backgroundColor: COLORS.warning,
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.md,
    paddingVertical: 10,
  },
  postText: { color: COLORS.white, fontWeight: "800", fontSize: 14 },
  postCount: { color: COLORS.white, opacity: 0.9, fontSize: 12, fontWeight: "700" },

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

  list: { gap: SPACING.sm, paddingBottom: SPACING.lg },
  row: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.md,
    ...SHADOW.card,
  },
  /** The bus line itself. The roll, when there is one, sits under it. */
  rowMain: { flexDirection: "row", alignItems: "center", gap: SPACING.md },

  roll: {
    marginTop: SPACING.sm,
    paddingTop: SPACING.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: COLORS.border,
    gap: 3,
  },
  rollHead: { flexDirection: "row", alignItems: "center", gap: SPACING.xs },
  rollText: { flex: 1, fontSize: 12, color: COLORS.textMuted },
  rollStrong: { fontWeight: "900", color: COLORS.text },
  rollAway: { color: COLORS.danger, fontWeight: "800" },
  // Amber, not muted grey: this is the one thing on the row a teacher may still
  // need to act on, and grey filed it away as a footnote.
  rollUnmarked: { color: COLORS.warning, fontWeight: "800" },
  rollName: { fontSize: 12, color: COLORS.danger, marginLeft: 19, fontWeight: "600" },
  // Opaque tint, not an alpha suffix — see TINT in constants/theme.
  rowDone: { borderColor: COLORS.warning, backgroundColor: TINT.warning },
  no: { fontSize: 17, fontWeight: "900", color: COLORS.text },
  route: { fontSize: 12, color: COLORS.textMuted, marginTop: 1 },
  status: { fontSize: 11, fontWeight: "900", letterSpacing: 0.4, marginTop: 4 },

  btn: {
    minWidth: 92,
    paddingHorizontal: SPACING.sm,
    height: 62,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.warning,
    alignItems: "center",
    justifyContent: "center",
    gap: 2,
  },
  btnPressed: { opacity: 0.75, transform: [{ scale: 0.97 }] },
  btnText: {
    color: COLORS.white,
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 0.5,
    textAlign: "center",
    lineHeight: 12,
  },

  doneMark: { minWidth: 92, alignItems: "center", gap: 2 },
  doneText: { fontSize: 10, fontWeight: "900", letterSpacing: 1, color: COLORS.warning },
  waitText: {
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 0.5,
    color: COLORS.textMuted,
    textAlign: "center",
    lineHeight: 11,
  },

  empty: { alignItems: "center", marginTop: SPACING.xl * 2, gap: SPACING.xs },
  emptyTitle: { fontSize: 17, fontWeight: "800", color: COLORS.text },
  emptySub: { fontSize: 13, color: COLORS.textMuted, textAlign: "center" },
});
