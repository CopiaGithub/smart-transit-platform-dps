import { Feather } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { useCallback } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { LABELS, STATUS, STATUS_COLOR, type Status } from "../../constants/domain";
import { COLORS, RADIUS, SHADOW, SPACING } from "../../constants/theme";
import { usePolling } from "../../src/hooks/usePolling";
import {
  fetchBoard,
  fetchQueue,
  selectBoardRows,
  selectOpsStats,
} from "../../src/store/operations.slice";
import { useAppDispatch, useAppSelector } from "../../src/store";
import { useViewer } from "../auth/useViewer";
import SessionCard from "../session/SessionCard";

/**
 * Home for teachers and admins: three numbers and the same table the LED wall
 * shows. Deliberately the school's own spreadsheet — Bus, Route, Station,
 * Status — so nobody has to learn a new layout.
 */
export default function DashboardScreen() {
  const navigation = useNavigation();
  const dispatch = useAppDispatch();
  const viewer = useViewer();
  const stats = useAppSelector(selectOpsStats);
  const rows = useAppSelector(selectBoardRows);

  usePolling(
    useCallback(() => {
      dispatch(fetchBoard(undefined));
      dispatch(fetchQueue());
    }, [dispatch]),
  );

  // Every bus that has been through the gate today, plus those still to come.
  // The board only holds buses that entered, so the yet-to-arrive count is
  // what makes the progress bar mean "how much of the afternoon is done".
  const seenToday = rows.length + stats.awaited;

  return (
    <ScrollView style={styles.root} contentContainerStyle={styles.content}>
      <View>
        <Text style={styles.hello}>Hello, {viewer.name || "there"}</Text>
        <Text style={styles.title}>Today's dispersal</Text>
      </View>

      <SessionCard />

      <View style={styles.tiles}>
        <Tile
          value={stats.arrived}
          label={STATUS.arrived}
          color={STATUS_COLOR.Arrived}
          icon="log-in"
        />
        <Tile
          value={stats.boarding}
          label={STATUS.boarding}
          color={STATUS_COLOR.Boarding}
          icon="users"
        />
        <Tile
          value={stats.departed}
          label={STATUS.departed}
          color={STATUS_COLOR.Departed}
          icon="log-out"
        />
      </View>

      <View style={styles.progressCard}>
        <View style={styles.progressHead}>
          <Text style={styles.progressTitle}>
            {stats.departed} of {seenToday} {LABELS.vehiclePlural.toLowerCase()} sent off
          </Text>
          <Text style={styles.progressSub}>
            {stats.onCampus}/{stats.platformCount} {LABELS.slotPlural.toLowerCase()} in use
            {stats.waiting > 0 ? ` · ${stats.waiting} waiting` : ""}
          </Text>
        </View>
        <View style={styles.track}>
          <View
            style={[
              styles.fill,
              { width: `${seenToday ? (stats.departed / seenToday) * 100 : 0}%` },
            ]}
          />
        </View>
      </View>

      <View style={styles.sectionHead}>
        <Text style={styles.section}>Live boarding</Text>
        <Pressable onPress={() => navigation.navigate("LiveBoard" as never)}>
          <Text style={styles.link}>Open LED board</Text>
        </Pressable>
      </View>

      <View style={styles.table}>
        <View style={styles.thead}>
          <Text style={[styles.th, styles.cBus]}>BUS</Text>
          <Text style={[styles.th, styles.cRoute]}>ROUTE</Text>
          <Text style={[styles.th, styles.cSlot]}>STATION</Text>
          <Text style={[styles.th, styles.cStatus]}>STATUS</Text>
        </View>

        {rows.length === 0 ? (
          <Text style={styles.empty}>
            Nothing yet — the first {LABELS.vehicle.toLowerCase()} through the gate shows here
          </Text>
        ) : (
          rows.map((bus, i) => (
            <View key={bus.EventId} style={[styles.tr, i % 2 === 1 && styles.trAlt]}>
              <Text style={[styles.td, styles.cBus, styles.busNo]}>{bus.BusNumber}</Text>
              <Text style={[styles.td, styles.cRoute]} numberOfLines={1}>
                {bus.RouteName ?? "—"}
              </Text>
              <Text style={[styles.td, styles.cSlot, styles.slot]}>
                {bus.PlatformNumber === null
                  ? "—"
                  : String(bus.PlatformNumber).padStart(2, "0")}
              </Text>
              <View style={styles.cStatus}>
                <Text style={[styles.status, { color: STATUS_COLOR[bus.Status as Status] }]}>
                  {bus.Status}
                </Text>
              </View>
            </View>
          ))
        )}
      </View>

      {/* Ending the day is a session action now — see SessionCard above. */}
    </ScrollView>
  );
}

function Tile({
  value,
  label,
  color,
  icon,
}: {
  value: number;
  label: string;
  color: string;
  icon: React.ComponentProps<typeof Feather>["name"];
}) {
  return (
    <View style={styles.tile}>
      <View style={[styles.tileIcon, { backgroundColor: color + "1A" }]}>
        <Feather name={icon} size={15} color={color} />
      </View>
      <Text style={[styles.tileVal, { color }]}>{value}</Text>
      <Text style={styles.tileLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.screenBg },
  content: { padding: SPACING.md, gap: SPACING.md, paddingBottom: SPACING.xl },

  hello: { fontSize: 13, color: COLORS.textMuted },
  title: { fontSize: 24, fontWeight: "900", color: COLORS.text },

  tiles: { flexDirection: "row", gap: SPACING.sm },
  tile: {
    flex: 1,
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.md,
    ...SHADOW.card,
  },
  tileIcon: {
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: SPACING.sm,
  },
  tileVal: { fontSize: 28, fontWeight: "900" },
  tileLabel: { fontSize: 11, color: COLORS.textMuted, fontWeight: "600" },

  progressCard: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.md,
    gap: SPACING.sm,
    ...SHADOW.card,
  },
  progressHead: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  progressTitle: { fontSize: 13, fontWeight: "800", color: COLORS.text },
  progressSub: { fontSize: 11, color: COLORS.textMuted },
  track: { height: 8, borderRadius: 4, backgroundColor: COLORS.surfaceAlt, overflow: "hidden" },
  fill: { height: "100%", borderRadius: 4, backgroundColor: COLORS.success },

  sectionHead: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  section: { fontSize: 17, fontWeight: "800", color: COLORS.text },
  link: { fontSize: 13, fontWeight: "700", color: COLORS.primary },

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
    paddingVertical: 11,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: COLORS.border,
  },
  trAlt: { backgroundColor: "#FAFBFE" },
  td: { fontSize: 13, color: COLORS.text },
  cBus: { width: 42 },
  cRoute: { flex: 1, paddingRight: SPACING.sm },
  cSlot: { width: 58, textAlign: "center" },
  // textAlign for the header, which is a Text; alignItems for the cell, which is
  // a View. Each side ignores the property it cannot use, so one style keeps the
  // heading and the value on the same edge.
  cStatus: { width: 74, textAlign: "right", alignItems: "flex-end" },
  busNo: { fontWeight: "900", fontSize: 15 },
  slot: { fontWeight: "900", fontSize: 16, color: COLORS.primary },
  status: { fontSize: 11, fontWeight: "900", letterSpacing: 0.3 },
  empty: { textAlign: "center", color: COLORS.textMuted, padding: SPACING.lg, fontSize: 13 },

  cta: {
    height: 54,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.warning,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: SPACING.sm,
  },
  ctaText: { color: COLORS.white, fontWeight: "800", fontSize: 15 },

  reset: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: SPACING.sm,
    paddingVertical: SPACING.md,
  },
  resetText: { color: COLORS.danger, fontWeight: "700", fontSize: 13 },
});
