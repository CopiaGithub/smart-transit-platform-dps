import { Feather } from "@expo/vector-icons";
import NetInfo from "@react-native-community/netinfo";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Avatar from "../../components/Avatar";
import FlashBar, { useFlash } from "../../components/FlashBar";
import { COLORS, RADIUS, SHADOW, SPACING, TINT } from "../../constants/theme";
import {
  attendanceApi,
  type ClassRow,
  type Roster,
  type SaveAttendanceRequest,
} from "../../src/api/attendance.api";
import { ApiError, NetworkError } from "../../src/api/types";
import { drop, flush, pendingFor, stash } from "../../src/services/attendanceQueue";
import { formatShortDate } from "../../navigation/HeaderTitle";

/**
 * Class attendance: pick a standard, pick a division, mark who is missing.
 *
 * Everyone starts present and the teacher taps only the absentees — in a class
 * of thirty-four that is three taps rather than thirty-four. The cost of that
 * default is that saving an untouched class marks it all present, which is why
 * the bar says how many are still unmarked and the button says what it will do.
 *
 * State is local. Nothing else in the app reads attendance, so there is nothing
 * for a slice to share — but it is not thrown away either: every tap goes to
 * the phone through `attendanceQueue`, so a network that dies halfway through
 * a class of thirty-four never costs the teacher a second pass. Saving with no
 * signal parks the class on the device and it goes up by itself later.
 */
export default function AttendanceScreen() {
  const insets = useSafeAreaInsets();
  const { flash, show } = useFlash();

  const [classes, setClasses] = useState<ClassRow[]>([]);
  const [grade, setGrade] = useState<string | null>(null);
  const [division, setDivision] = useState<string | null>(null);

  const [roster, setRoster] = useState<Roster | null>(null);
  /** studentId -> present. Seeded from the roster, then the teacher's edits. */
  const [marks, setMarks] = useState<Record<number, boolean>>({});

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  /** This class is saved on the phone and still waiting for a network. */
  const [held, setHeld] = useState(false);

  const grades = useMemo(
    // The server hands classes back in school order; keep it, do not re-sort.
    () => classes.map((c) => c.Grade).filter((g, i, all) => all.indexOf(g) === i),
    [classes],
  );
  const divisions = useMemo(
    () => classes.filter((c) => c.Grade === grade).map((c) => c.Division),
    [classes, grade],
  );

  useEffect(() => {
    let live = true;
    attendanceApi
      .classes()
      .then((rows) => {
        if (!live) return;
        setClasses(rows);
        setGrade(rows[0]?.Grade ?? null);
      })
      .catch((e) => live && setError(messageFor(e)))
      .finally(() => live && setLoading(false));
    return () => {
      live = false;
    };
  }, []);

  // A division from the previous standard would ask for a class that does not
  // exist, so it follows the standard rather than surviving it.
  useEffect(() => {
    setDivision((current) => (current && divisions.includes(current) ? current : divisions[0] ?? null));
  }, [divisions]);

  /** Sends anything held back, and says so when it finally lands. */
  const sync = useCallback(async () => {
    const { sent, refused } = await flush();
    if (sent > 0) {
      setHeld(false);
      show(sent === 1 ? "Held attendance sent" : `${sent} held classes sent`);
    }
    if (refused.length > 0) setError(refused.join("\n"));
    return sent;
  }, [show]);

  const loadRoster = useCallback(async () => {
    if (!grade || !division) return;
    setLoading(true);
    setError(null);
    try {
      // Anything held from an earlier session goes up before the class is
      // read, so what comes back already includes it rather than contradicting
      // what the teacher last saw.
      await sync();

      const next = await attendanceApi.roster(grade, division);
      const local = await pendingFor(grade, division, next.AttendanceDate);
      setRoster(next);
      // Local taps win over the server's answer: they are the newer of the two
      // and losing them is the whole thing this avoids.
      setMarks({ ...seed(next), ...(local ? marksOf(local.save) : {}) });
      setHeld(local?.filed ?? false);
    } catch (e) {
      // No network: fall back to this class as it was last seen, so the
      // teacher can keep marking through the outage instead of staring at an
      // error. Any other failure is the server talking, and it gets shown.
      const local = e instanceof NetworkError ? await pendingFor(grade, division) : null;
      if (local) {
        setRoster(local.roster);
        setMarks(marksOf(local.save));
        setHeld(local.filed);
        setError(null);
      } else {
        setRoster(null);
        setError(messageFor(e));
      }
    } finally {
      setLoading(false);
    }
  }, [grade, division, sync]);

  useEffect(() => {
    void loadRoster();
  }, [loadRoster]);

  // The moment the network comes back, send what is waiting — a teacher should
  // not have to remember to reopen a screen for their morning to be recorded.
  const wasOnline = useRef(true);
  useEffect(
    () =>
      NetInfo.addEventListener((state) => {
        const online = state.isConnected === true && state.isInternetReachable !== false;
        if (online && !wasOnline.current) void sync();
        wasOnline.current = online;
      }),
    [sync],
  );

  const present = roster?.Students.filter((s) => marks[s.StudentId] !== false).length ?? 0;
  const absent = (roster?.Students.length ?? 0) - present;

  /**
   * Every tap is written to the phone, not just held in memory — that is what
   * makes a dropped network cost nothing. Not filed, so it is never sent on
   * its own: a half-marked class would file the untouched children as present.
   */
  const setMark = (studentId: number, isPresent: boolean) => {
    const next = { ...marks, [studentId]: isPresent };
    setMarks(next);
    if (roster) void stash(payloadFor(roster, next), roster, false);
  };

  const save = async () => {
    if (!roster || saving) return;
    setSaving(true);
    setError(null);

    const payload = payloadFor(roster, marks);
    // Filed before the wire, so a save that dies mid-flight is already the
    // teacher's recorded intent rather than something to redo.
    await stash(payload, roster, true);

    try {
      const saved = await attendanceApi.save(payload);
      await drop(payload);
      setRoster(saved);
      setMarks(seed(saved));
      setHeld(false);
      show(
        saved.AbsentCount === 0
          ? `${saved.Grade}-${saved.Division} — everyone present`
          : `${saved.Grade}-${saved.Division} — ${saved.AbsentCount} absent`,
      );
    } catch (e) {
      if (e instanceof NetworkError) {
        setHeld(true);
        // FlashBar is one line — the standing banner below carries the detail.
        show(`${roster.Grade}-${roster.Division} saved on this phone`);
      } else {
        // The server refused it. Replaying that would fail identically, so it
        // stops being queued — but the taps stay on the phone and on screen.
        await stash(payload, roster, false);
        setHeld(false);
        setError(messageFor(e));
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={[styles.root, { paddingBottom: SPACING.md + insets.bottom }]}>
      <View style={styles.pickers}>
        <ChipRow
          label="STANDARD"
          options={grades}
          selected={grade}
          onSelect={(g) => setGrade(g)}
        />
        <ChipRow
          label="DIVISION"
          options={divisions}
          selected={division}
          onSelect={(d) => setDivision(d)}
        />
      </View>

      {!!flash && <FlashBar text={flash} />}

      {!flash && !!error && (
        <View style={styles.alert}>
          <Feather name="alert-circle" size={16} color={COLORS.danger} />
          <Text style={styles.alertText}>{error}</Text>
        </View>
      )}

      {/* Standing reassurance, not a one-off toast: the teacher may leave and
          come back, and until it lands they need to see it is still safe. */}
      {!flash && held && (
        <View style={styles.holding}>
          <Feather name="clock" size={16} color={COLORS.warning} />
          <Text style={styles.holdingText}>
            Saved on this phone. It will go to the school on its own once there is a network —
            you do not have to mark this class again.
          </Text>
        </View>
      )}

      {!!roster && (
        <View style={styles.summary}>
          <View style={{ flex: 1 }}>
            <Text style={styles.summaryClass}>
              {roster.Grade}-{roster.Division} · {roster.TotalStudents} students
            </Text>
            <Text style={styles.summaryCounts}>
              <Text style={styles.present}>{present} present</Text>
              {"   "}
              <Text style={styles.absent}>{absent} absent</Text>
              {"   "}
              <Text style={styles.summaryDate}>{formatShortDate(roster.AttendanceDate)}</Text>
            </Text>
            <Text style={styles.summaryState} numberOfLines={1}>
              {roster.IsMarked
                ? `Marked${roster.LastMarkedBy ? ` by ${roster.LastMarkedBy}` : ""}`
                : "Not marked yet — everyone counts as present until you save"}
            </Text>
          </View>

          <Pressable
            style={({ pressed }) => [styles.save, (pressed || saving) && styles.savePressed]}
            disabled={saving}
            onPress={save}
            accessibilityRole="button"
            accessibilityLabel={`Save attendance for ${roster.Grade}-${roster.Division}`}
          >
            <Feather name={saving ? "loader" : "check"} size={18} color={COLORS.white} />
            <Text style={styles.saveText}>{saving ? "SAVING" : "SAVE"}</Text>
          </Pressable>
        </View>
      )}

      {loading && !roster ? (
        <View style={styles.centre}>
          <ActivityIndicator color={COLORS.primary} />
        </View>
      ) : (
        <FlatList
          data={roster?.Students ?? []}
          keyExtractor={(s) => String(s.StudentId)}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            !error ? <Text style={styles.empty}>No students on this roll</Text> : null
          }
          renderItem={({ item }) => {
            const here = marks[item.StudentId] !== false;
            return (
              <View style={[styles.row, !here && styles.rowAbsent]}>
                {/* The ring says present or absent at the same place the eye
                    already is — the face — rather than at the far end of the
                    row where the buttons live. */}
                <Avatar
                  name={item.Name}
                  uri={item.PhotoUrl}
                  size={40}
                  ring={here ? COLORS.success : COLORS.danger}
                />

                <View style={{ flex: 1 }}>
                  <Text style={styles.name} numberOfLines={1}>
                    {item.Name}
                  </Text>
                  <Text style={styles.admission}>#{item.AdmissionNumber}</Text>
                </View>

                {/* Two explicit buttons rather than one toggle: a teacher
                    scanning a row has to see which way it is set without
                    working out what a single control would do next. */}
                <View style={styles.toggle}>
                  <Pressable
                    style={[styles.half, styles.halfLeft, here && styles.halfPresent]}
                    onPress={() => setMark(item.StudentId, true)}
                    accessibilityRole="button"
                    accessibilityLabel={`${item.Name} present`}
                  >
                    <Feather name="check" size={18} color={here ? COLORS.white : COLORS.textMuted} />
                  </Pressable>
                  <Pressable
                    style={[styles.half, styles.halfRight, !here && styles.halfAbsent]}
                    onPress={() => setMark(item.StudentId, false)}
                    accessibilityRole="button"
                    accessibilityLabel={`${item.Name} absent`}
                  >
                    <Feather name="x" size={18} color={!here ? COLORS.white : COLORS.textMuted} />
                  </Pressable>
                </View>
              </View>
            );
          }}
        />
      )}
    </View>
  );
}

/** Unmarked children start present — the teacher taps only the absentees. */
const seed = (roster: Roster): Record<number, boolean> =>
  Object.fromEntries(roster.Students.map((s) => [s.StudentId, s.IsPresent ?? true]));

/**
 * What would be sent for this class right now. The date is always spelled out:
 * a class held overnight must file under the day it was taken, not the day the
 * network came back.
 */
const payloadFor = (roster: Roster, marks: Record<number, boolean>): SaveAttendanceRequest => ({
  grade: roster.Grade,
  division: roster.Division,
  attendanceDate: roster.AttendanceDate,
  marks: roster.Students.map((s) => ({
    studentId: s.StudentId,
    isPresent: marks[s.StudentId] !== false,
  })),
});

/** The stored payload back in the shape the screen holds it. */
const marksOf = (save: SaveAttendanceRequest): Record<number, boolean> =>
  Object.fromEntries(save.marks.map((m) => [m.studentId, m.isPresent]));

const messageFor = (error: unknown) =>
  error instanceof ApiError || error instanceof NetworkError
    ? error.message
    : "Something went wrong. Please try again.";

function ChipRow({
  label,
  options,
  selected,
  onSelect,
}: {
  label: string;
  options: string[];
  selected: string | null;
  onSelect: (value: string) => void;
}) {
  return (
    <View style={styles.chipRow}>
      <Text style={styles.chipLabel}>{label}</Text>
      <FlatList
        horizontal
        showsHorizontalScrollIndicator={false}
        data={options}
        keyExtractor={(o) => o}
        contentContainerStyle={{ gap: SPACING.xs }}
        renderItem={({ item }) => (
          <Pressable
            style={[styles.chip, item === selected && styles.chipOn]}
            onPress={() => onSelect(item)}
          >
            <Text style={[styles.chipText, item === selected && styles.chipTextOn]}>{item}</Text>
          </Pressable>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: COLORS.screenBg,
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.md,
    gap: SPACING.sm,
  },
  centre: { flex: 1, alignItems: "center", justifyContent: "center" },

  pickers: { gap: SPACING.xs },
  chipRow: { flexDirection: "row", alignItems: "center", gap: SPACING.sm },
  chipLabel: {
    width: 62,
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 0.8,
    color: COLORS.textMuted,
  },
  chip: {
    minWidth: 40,
    alignItems: "center",
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingVertical: 7,
    paddingHorizontal: SPACING.sm,
  },
  chipOn: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  chipText: { fontSize: 14, fontWeight: "800", color: COLORS.text },
  chipTextOn: { color: COLORS.white },

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

  holding: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.sm,
    backgroundColor: TINT.warning,
    borderWidth: 1,
    borderColor: COLORS.warning + "55",
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.md,
    paddingVertical: 10,
  },
  holdingText: { flex: 1, color: COLORS.text, fontSize: 12, lineHeight: 17 },

  summary: {
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
  summaryClass: { fontSize: 16, fontWeight: "900", color: COLORS.text },
  summaryCounts: { fontSize: 13, fontWeight: "800", marginTop: 2 },
  present: { color: COLORS.success },
  absent: { color: COLORS.danger },
  summaryDate: { color: COLORS.textMuted, fontWeight: "700" },
  summaryState: { fontSize: 11, color: COLORS.textMuted, marginTop: 3 },

  save: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    height: 52,
    paddingHorizontal: SPACING.md,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.primary,
  },
  savePressed: { backgroundColor: COLORS.primaryDark },
  saveText: { color: COLORS.white, fontSize: 14, fontWeight: "900", letterSpacing: 1 },

  list: { gap: SPACING.xs, paddingBottom: SPACING.md },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.sm,
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
  },
  // Opaque, not translucent — an absent row has to be obvious at a glance
  // down a list of thirty.
  rowAbsent: { backgroundColor: TINT.danger, borderColor: COLORS.danger + "44" },
  name: { fontSize: 15, fontWeight: "800", color: COLORS.text },
  admission: { fontSize: 11, color: COLORS.textMuted, marginTop: 1 },

  toggle: { flexDirection: "row", borderRadius: RADIUS.sm, overflow: "hidden" },
  half: {
    width: 46,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.surfaceAlt,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  halfLeft: { borderTopLeftRadius: RADIUS.sm, borderBottomLeftRadius: RADIUS.sm },
  halfRight: { borderTopRightRadius: RADIUS.sm, borderBottomRightRadius: RADIUS.sm, marginLeft: -1 },
  halfPresent: { backgroundColor: COLORS.success, borderColor: COLORS.success },
  halfAbsent: { backgroundColor: COLORS.danger, borderColor: COLORS.danger },

  empty: {
    fontSize: 13,
    color: COLORS.textMuted,
    textAlign: "center",
    paddingVertical: SPACING.xl,
  },
});
