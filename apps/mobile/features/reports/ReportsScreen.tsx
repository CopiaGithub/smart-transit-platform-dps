import { Feather } from "@expo/vector-icons";
import { useCallback, useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { LABELS, STATUS, STATUS_COLOR, type Status } from "../../constants/domain";
import { COLORS, RADIUS, SHADOW, SPACING } from "../../constants/theme";
import type { BoardRow } from "../../src/api/operations.api";
import { usePolling } from "../../src/hooks/usePolling";
import { fetchBoard, selectBoardRows } from "../../src/store/operations.slice";
import { useAppDispatch, useAppSelector } from "../../src/store";

type Filter = "all" | "departed" | "onCampus" | "replaced";

const FILTERS: { key: Filter; label: string }[] = [
  { key: "all", label: "All" },
  { key: "departed", label: "Departed" },
  { key: "onCampus", label: "On campus" },
  { key: "replaced", label: "Replaced" },
];

/**
 * The day's log. Every row is a boarding event the server recorded, so the
 * times are the moment a guard actually tapped — this is the audit trail, not
 * a summary the app computed.
 */
export default function ReportsScreen() {
  const dispatch = useAppDispatch();
  const rows = useAppSelector(selectBoardRows);
  const session = useAppSelector((s) => s.session.current);
  const [filter, setFilter] = useState<Filter>("all");

  usePolling(useCallback(() => void dispatch(fetchBoard(undefined)), [dispatch]));

  const shown = useMemo(() => {
    const byFilter: Record<Filter, BoardRow[]> = {
      all: rows,
      departed: rows.filter((r) => r.Status === STATUS.departed),
      onCampus: rows.filter((r) => r.Status === STATUS.arrived || r.Status === STATUS.boarding),
      replaced: rows.filter((r) => r.Status === STATUS.replaced),
    };
    // Oldest first: a log reads forwards, unlike the board.
    return [...byFilter[filter]].sort((a, z) => a.EnteredAt.localeCompare(z.EnteredAt));
  }, [rows, filter]);

  // Turnaround only means anything for buses that completed a run.
  const dwells = rows
    .filter((r) => r.Status === STATUS.departed && r.AssignedAt && r.DepartedAt)
    .map((r) => new Date(r.DepartedAt!).getTime() - new Date(r.AssignedAt!).getTime());
  const avgMins = dwells.length ? dwells.reduce((a, b) => a + b, 0) / dwells.length / 60000 : 0;

  return (
    <ScrollView style={styles.root} contentContainerStyle={styles.content}>
      {!!session && (
        <Text style={styles.sessionLine}>
          {session.SessionDate}
          {session.ShiftName ? ` · ${session.ShiftName}` : ""}
        </Text>
      )}

      <View style={styles.kpiRow}>
        <Kpi icon="log-in" value={rows.length} label="Recorded in" color={COLORS.primary} />
        <Kpi
          icon="log-out"
          value={rows.filter((r) => r.Status === STATUS.departed).length}
          label="Departed"
          color={COLORS.success}
        />
        <Kpi
          icon="clock"
          value={avgMins ? `${avgMins.toFixed(1)}m` : "—"}
          label="Avg dwell"
          color={COLORS.accent}
        />
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.chips}
      >
        {FILTERS.map((f) => (
          <Pressable
            key={f.key}
            style={[styles.chip, filter === f.key && styles.chipOn]}
            onPress={() => setFilter(f.key)}
          >
            <Text style={[styles.chipText, filter === f.key && styles.chipTextOn]}>
              {f.label}
            </Text>
          </Pressable>
        ))}
      </ScrollView>

      <View style={styles.table}>
        <View style={styles.thead}>
          <Text style={[styles.th, styles.cBus]}>{LABELS.vehicleNo.toUpperCase()}</Text>
          <Text style={[styles.th, styles.cSlot]}>STN</Text>
          <Text style={[styles.th, styles.cTime]}>IN</Text>
          <Text style={[styles.th, styles.cTime]}>OUT</Text>
        </View>

        {shown.length === 0 && (
          <Text style={styles.empty}>Nothing logged yet for this filter</Text>
        )}

        {shown.map((row, i) => (
          <View key={row.EventId} style={[styles.tr, i % 2 === 1 && styles.trAlt]}>
            <View style={styles.cBus}>
              <Text style={styles.busNo}>{row.BusNumber}</Text>
              <Text style={styles.route} numberOfLines={1}>
                {row.RouteName ?? "No route"}
              </Text>
              <Text style={[styles.status, { color: STATUS_COLOR[row.Status as Status] }]}>
                {row.Status}
              </Text>
              {!!row.ReplacedByBusNumber && (
                <Text style={styles.replaced}>→ replaced by {row.ReplacedByBusNumber}</Text>
              )}
            </View>
            <Text style={[styles.td, styles.cSlot, styles.slot]}>
              {row.PlatformNumber ?? "—"}
            </Text>
            <Text style={[styles.td, styles.cTime]}>{hhmm(row.EnteredAt)}</Text>
            <Text style={[styles.td, styles.cTime]}>{hhmm(row.DepartedAt)}</Text>
          </View>
        ))}
      </View>

      <Text style={styles.footnote}>
        Times are captured the moment the guard taps, so this log is the audit trail for the
        day's boarding.
      </Text>
    </ScrollView>
  );
}

function Kpi({
  icon,
  value,
  label,
  color,
}: {
  icon: React.ComponentProps<typeof Feather>["name"];
  value: number | string;
  label: string;
  color: string;
}) {
  return (
    <View style={styles.kpi}>
      <View style={[styles.kpiIcon, { backgroundColor: color + "1A" }]}>
        <Feather name={icon} size={15} color={color} />
      </View>
      <Text style={styles.kpiVal}>{value}</Text>
      <Text style={styles.kpiLabel}>{label}</Text>
    </View>
  );
}

const hhmm = (t: string | null) =>
  t ? new Date(t).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" }) : "—";

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.screenBg },
  content: { padding: SPACING.md, gap: SPACING.md, paddingBottom: SPACING.xl },
  sessionLine: { fontSize: 12, color: COLORS.textMuted, fontWeight: "600" },

  kpiRow: { flexDirection: "row", gap: SPACING.sm },
  kpi: {
    flex: 1,
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.md,
    gap: 2,
    ...SHADOW.card,
  },
  kpiIcon: {
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: SPACING.xs,
  },
  kpiVal: { fontSize: 22, fontWeight: "900", color: COLORS.text },
  kpiLabel: { fontSize: 10, color: COLORS.textMuted, letterSpacing: 0.5 },

  chips: { gap: SPACING.sm, paddingRight: SPACING.md },
  chip: {
    paddingHorizontal: SPACING.md,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surface,
  },
  chipOn: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  chipText: { fontSize: 13, fontWeight: "700", color: COLORS.textMuted },
  chipTextOn: { color: COLORS.white },

  table: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: "hidden",
    ...SHADOW.card,
  },
  thead: {
    flexDirection: "row",
    backgroundColor: COLORS.surfaceAlt,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
  },
  th: { fontSize: 9, fontWeight: "900", color: COLORS.textMuted, letterSpacing: 1 },
  tr: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: COLORS.border,
  },
  trAlt: { backgroundColor: "#FAFBFE" },
  td: { fontSize: 13, color: COLORS.text },
  cBus: { flex: 1, paddingRight: SPACING.sm },
  cSlot: { width: 40, textAlign: "center" },
  cTime: { width: 52, textAlign: "center" },
  busNo: { fontSize: 15, fontWeight: "900", color: COLORS.text },
  route: { fontSize: 11, color: COLORS.textMuted, marginTop: 1 },
  status: { fontSize: 10, fontWeight: "900", letterSpacing: 0.4, marginTop: 3 },
  slot: { fontWeight: "900", color: COLORS.primary, fontSize: 16 },
  replaced: { fontSize: 10, color: COLORS.accent, marginTop: 3, fontWeight: "700" },
  empty: { textAlign: "center", color: COLORS.textMuted, padding: SPACING.lg, fontSize: 13 },
  footnote: { fontSize: 11, color: COLORS.textMuted, lineHeight: 16 },
});
