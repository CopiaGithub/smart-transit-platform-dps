import { Feather } from "@expo/vector-icons";
import { useCallback, useEffect } from "react";
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from "react-native";
import { LABELS, STATUS, STATUS_COLOR } from "../../constants/domain";
import { COLORS, RADIUS, SHADOW, SPACING, TINT } from "../../constants/theme";
import type { BoardRow } from "../../src/api/operations.api";
import type { ParentChild } from "../../src/api/people.api";
import { usePolling } from "../../src/hooks/usePolling";
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
      </Text>
    </ScrollView>
  );
}

function ChildCard({ child, live }: { child: ParentChild; live: BoardRow | null }) {
  const tone = statusTone(live);

  return (
    <View style={styles.card}>
      <View style={styles.childRow}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{child.StudentName.charAt(0).toUpperCase()}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.childName}>{child.StudentName}</Text>
          <Text style={styles.childClass}>
            Class {child.Class} · {child.AdmissionNumber}
          </Text>
        </View>
      </View>

      <View style={[styles.statusBox, { backgroundColor: tone.bg, borderColor: tone.color }]}>
        <View style={[styles.statusDot, { backgroundColor: tone.color }]} />
        <View style={{ flex: 1 }}>
          <Text style={[styles.statusLabel, { color: tone.color }]}>{tone.label}</Text>
          <Text style={styles.statusHint}>{tone.hint}</Text>
        </View>
      </View>

      <Section title={LABELS.vehicle.toUpperCase()}>
        {child.BusNumber ? (
          <>
            <Row label={LABELS.vehicleNo} value={child.BusNumber} strong />
            <Row label={LABELS.route} value={live?.RouteName ?? child.RouteName ?? "—"} />
            <Row
              label={LABELS.slot}
              value={
                live?.PlatformNumber == null
                  ? "Not allocated yet"
                  : String(live.PlatformNumber).padStart(2, "0")
              }
            />
          </>
        ) : (
          <Text style={styles.missing}>
            Not a transport user — no {LABELS.vehicle.toLowerCase()} assigned
          </Text>
        )}
      </Section>

      {!!child.ExitGateName && (
        <Section title="EXIT">
          <Row label="Leaves from" value={child.ExitGateName} />
        </Section>
      )}
    </View>
  );
}

/** What each status means to a parent, in their words rather than the guard's. */
function statusTone(live: BoardRow | null) {
  const platform =
    live?.PlatformNumber == null ? null : String(live.PlatformNumber).padStart(2, "0");

  switch (live?.Status) {
    case STATUS.arrived:
      return {
        label: "At school",
        color: STATUS_COLOR.Arrived,
        bg: TINT.primary,
        hint: `Waiting at ${LABELS.slot.toLowerCase()} ${platform} — students are walking to it.`,
      };
    case STATUS.boarding:
      return {
        label: "Boarding now",
        color: STATUS_COLOR.Boarding,
        bg: TINT.warning,
        hint: `Children are getting in at ${LABELS.slot.toLowerCase()} ${platform}.`,
      };
    case STATUS.waiting:
      return {
        label: "Inside, holding",
        color: STATUS_COLOR.Waiting,
        bg: COLORS.surfaceAlt,
        hint: "In the compound but every station is occupied. It gets the next one that frees.",
      };
    case STATUS.departed:
      return {
        label: "Left school",
        color: STATUS_COLOR.Departed,
        bg: TINT.success,
        hint: live?.DepartedAt
          ? `Departed at ${new Date(live.DepartedAt).toLocaleTimeString("en-IN", {
              hour: "2-digit",
              minute: "2-digit",
            })}.`
          : "The bus has left the school gate.",
      };
    case STATUS.replaced:
      return {
        label: "Replaced by a reserve",
        color: STATUS_COLOR.Replaced,
        bg: COLORS.surfaceAlt,
        hint: live?.ReplacedByBusNumber
          ? `${LABELS.vehicle} ${live.ReplacedByBusNumber} is running this service today, from the same station.`
          : "A reserve bus is running this service today.",
      };
    default:
      return {
        label: "Not reached school yet",
        color: COLORS.textMuted,
        bg: COLORS.surfaceAlt,
        hint: `You will see the ${LABELS.slot.toLowerCase()} here the moment it enters the gate.`,
      };
  }
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionCap}>{title}</Text>
      {children}
    </View>
  );
}

function Row({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={[styles.rowValue, strong && styles.rowValueStrong]} numberOfLines={2}>
        {value}
      </Text>
    </View>
  );
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
    padding: SPACING.md,
    gap: SPACING.md,
    ...SHADOW.card,
  },

  childRow: { flexDirection: "row", alignItems: "center", gap: SPACING.md },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: COLORS.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: { color: COLORS.white, fontSize: 20, fontWeight: "900" },
  childName: { fontSize: 18, fontWeight: "900", color: COLORS.text },
  childClass: { fontSize: 12, color: COLORS.textMuted, marginTop: 2 },

  statusBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.sm,
    borderWidth: 1,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
  },
  statusDot: { width: 10, height: 10, borderRadius: 5 },
  statusLabel: { fontSize: 15, fontWeight: "900" },
  statusHint: { fontSize: 12, color: COLORS.textMuted, marginTop: 2, lineHeight: 17 },

  section: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: COLORS.border,
    paddingTop: SPACING.sm,
    gap: 4,
  },
  sectionCap: {
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 1.2,
    color: COLORS.textMuted,
    marginBottom: 2,
  },
  row: { flexDirection: "row", alignItems: "flex-start", gap: SPACING.md },
  rowLabel: { width: 78, fontSize: 12, color: COLORS.textMuted },
  rowValue: { flex: 1, fontSize: 13, color: COLORS.text, textAlign: "right" },
  rowValueStrong: { fontWeight: "800" },
  missing: { fontSize: 12, color: COLORS.textMuted, fontStyle: "italic" },

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
