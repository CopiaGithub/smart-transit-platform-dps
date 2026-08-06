import { Feather } from "@expo/vector-icons";
import { useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import StatusPill from "../../components/StatusPill";
import { LABELS, STATUS } from "../../constants/domain";
import { COLORS, RADIUS, SHADOW, SPACING } from "../../constants/theme";
import { useAppSelector } from "../../src/store";

type Filter = "all" | "departed" | "onCampus" | "replaced";

const FILTERS: { key: Filter; label: string }[] = [
  { key: "all", label: "All" },
  { key: "departed", label: "Departed" },
  { key: "onCampus", label: "On campus" },
  { key: "replaced", label: "Replaced" },
];

/** Scope 6: station allocation, departure time and bus details in one place. */
export default function ReportsScreen() {
  const fleet = useAppSelector((s) => s.ops.fleet);
  const [filter, setFilter] = useState<Filter>("all");

  const rows = useMemo(() => {
    // Anything that has a status has been through a gate today.
    const logged = fleet.filter((b) => b.status !== null);
    const byFilter = {
      all: logged,
      departed: logged.filter((b) => b.status === STATUS.departed),
      onCampus: logged.filter(
        (b) => b.status === STATUS.arrived || b.status === STATUS.boarding,
      ),
      replaced: logged.filter((b) => !!b.replacedByNo),
    }[filter];
    return [...byFilter].sort((a, z) => (a.arrivedAt ?? 0) - (z.arrivedAt ?? 0));
  }, [fleet, filter]);

  const turnarounds = fleet
    .filter((b) => b.arrivedAt && b.departedAt && b.status === STATUS.departed)
    .map((b) => b.departedAt! - b.arrivedAt!);
  const avgMins = turnarounds.length
    ? turnarounds.reduce((a, b) => a + b, 0) / turnarounds.length / 60000
    : 0;

  return (
    <ScrollView style={styles.root} contentContainerStyle={styles.content}>
      <View style={styles.kpiRow}>
        <Kpi
          icon="log-in"
          value={fleet.filter((b) => b.arrivedAt).length}
          label="Allocated"
          color={COLORS.primary}
        />
        <Kpi
          icon="log-out"
          value={fleet.filter((b) => b.status === STATUS.departed).length}
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

        {rows.length === 0 && (
          <Text style={styles.empty}>Nothing logged yet for this filter</Text>
        )}

        {rows.map((bus, i) => (
          <View key={bus.id} style={[styles.tr, i % 2 === 1 && styles.trAlt]}>
            <View style={styles.cBus}>
              <Text style={styles.busNo}>{bus.no}</Text>
              <Text style={styles.route} numberOfLines={1}>
                {bus.route}
              </Text>
              <View style={{ marginTop: 5 }}>
                <StatusPill status={bus.status!} />
              </View>
              {!!bus.replacedByNo && (
                <Text style={styles.replaced}>→ replaced by {bus.replacedByNo}</Text>
              )}
            </View>
            <Text style={[styles.td, styles.cSlot, styles.slot]}>{bus.slot ?? "—"}</Text>
            <Text style={[styles.td, styles.cTime]}>{hhmm(bus.arrivedAt)}</Text>
            <Text style={[styles.td, styles.cTime]}>{hhmm(bus.departedAt)}</Text>
          </View>
        ))}
      </View>

      <Text style={styles.footnote}>
        Times are captured the moment the guard taps, so the log is the audit trail for
        the day's boarding.
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

const hhmm = (t: number | null) =>
  t ? new Date(t).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" }) : "—";

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.screenBg },
  content: { padding: SPACING.md, gap: SPACING.md, paddingBottom: SPACING.xl },

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
  slot: { fontWeight: "900", color: COLORS.primary, fontSize: 16 },
  replaced: { fontSize: 10, color: COLORS.accent, marginTop: 3, fontWeight: "700" },
  empty: { textAlign: "center", color: COLORS.textMuted, padding: SPACING.lg, fontSize: 13 },
  footnote: { fontSize: 11, color: COLORS.textMuted, lineHeight: 16 },
});
