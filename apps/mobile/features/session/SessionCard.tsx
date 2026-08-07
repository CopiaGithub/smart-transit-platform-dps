import { Feather } from "@expo/vector-icons";
import { Alert, Pressable, StyleSheet, Text, View } from "react-native";
import { LABELS, ROLES } from "../../constants/domain";
import { COLORS, RADIUS, SHADOW, SPACING, TINT } from "../../constants/theme";
import { closeSession, resetSession } from "../../src/store/session.slice";
import { useAppDispatch, useAppSelector } from "../../src/store";
import { useViewer } from "../auth/useViewer";

/**
 * The day itself, on the dashboard: which session is open, what it holds, and
 * the two ways to end it. Closing is the normal path; reset is the escape
 * hatch when buses were genuinely missed and cannot be reconstructed (§5.10).
 */
export default function SessionCard() {
  const dispatch = useAppDispatch();
  const viewer = useViewer();
  const { current, error } = useAppSelector((s) => s.session);

  if (!current) return null;

  const isAdmin = viewer.role === ROLES.admin;
  const stillInside = current.InYard + current.Waiting;

  const confirmClose = () =>
    Alert.alert(
      "Close today's session?",
      stillInside > 0
        ? `${stillInside} ${stillInside === 1 ? LABELS.vehicle.toLowerCase() : LABELS.vehiclePlural.toLowerCase()} are still recorded inside the compound. The server will refuse until they are marked out.`
        : "Tomorrow's session cannot be opened until today's is closed.",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Close session", onPress: () => dispatch(closeSession(current.Id)) },
      ],
    );

  const confirmReset = () =>
    Alert.alert(
      "Force the session closed?",
      "Every bus still recorded inside will be marked Departed and the session stamped as ended by hand. Use this only when the missing departures cannot be reconstructed.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Force close",
          style: "destructive",
          onPress: () => dispatch(resetSession(current.Id)),
        },
      ],
    );

  return (
    <View style={styles.card}>
      <View style={styles.head}>
        <View style={styles.dot} />
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>Session open</Text>
          <Text style={styles.sub}>
            {current.SessionDate}
            {current.ShiftName ? ` · ${current.ShiftName}` : ""}
          </Text>
        </View>
      </View>

      <View style={styles.counts}>
        <Count value={current.InYard} label="In yard" />
        <Count value={current.Waiting} label="Waiting" />
        <Count value={current.Departed} label="Departed" />
        <Count value={current.TotalBuses} label="Total" />
      </View>

      {!!error && (
        <View style={styles.alert}>
          <Feather name="alert-circle" size={15} color={COLORS.danger} />
          <Text style={styles.alertText}>{error}</Text>
        </View>
      )}

      <View style={styles.actions}>
        <Pressable style={styles.close} onPress={confirmClose}>
          <Feather name="check-circle" size={16} color={COLORS.primary} />
          <Text style={styles.closeText}>Close session</Text>
        </Pressable>

        {isAdmin && (
          <Pressable style={styles.reset} onPress={confirmReset}>
            <Feather name="alert-triangle" size={16} color={COLORS.danger} />
            <Text style={styles.resetText}>Force close</Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}

function Count({ value, label }: { value: number; label: string }) {
  return (
    <View style={styles.count}>
      <Text style={styles.countVal}>{value}</Text>
      <Text style={styles.countCap}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.md,
    gap: SPACING.md,
    ...SHADOW.card,
  },
  head: { flexDirection: "row", alignItems: "center", gap: SPACING.sm },
  dot: { width: 10, height: 10, borderRadius: 5, backgroundColor: COLORS.success },
  title: { fontSize: 15, fontWeight: "900", color: COLORS.text },
  sub: { fontSize: 12, color: COLORS.textMuted, marginTop: 1 },

  counts: { flexDirection: "row", gap: SPACING.sm },
  count: {
    flex: 1,
    alignItems: "center",
    backgroundColor: COLORS.surfaceAlt,
    borderRadius: RADIUS.md,
    paddingVertical: SPACING.sm,
  },
  countVal: { fontSize: 18, fontWeight: "900", color: COLORS.text },
  countCap: { fontSize: 10, color: COLORS.textMuted, fontWeight: "600" },

  alert: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: SPACING.sm,
    backgroundColor: TINT.danger,
    borderWidth: 1,
    borderColor: COLORS.danger + "44",
    borderRadius: RADIUS.md,
    padding: SPACING.sm,
  },
  alertText: { flex: 1, color: COLORS.danger, fontSize: 12, fontWeight: "600", lineHeight: 17 },

  actions: { flexDirection: "row", gap: SPACING.sm },
  close: {
    flex: 1,
    height: 46,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.primary,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: SPACING.sm,
  },
  closeText: { color: COLORS.primary, fontWeight: "800", fontSize: 14 },
  reset: {
    height: 46,
    paddingHorizontal: SPACING.md,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.danger + "55",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: SPACING.sm,
  },
  resetText: { color: COLORS.danger, fontWeight: "800", fontSize: 14 },
});
