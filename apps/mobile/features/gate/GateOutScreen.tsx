import { Feather } from "@expo/vector-icons";
import { useCallback } from "react";
import { Alert, FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import FlashBar, { useFlash } from "../../components/FlashBar";
import SlotBadge from "../../components/SlotBadge";
import { LABELS, STATUS, STATUS_COLOR, type Status } from "../../constants/domain";
import { COLORS, RADIUS, SHADOW, SPACING, TINT } from "../../constants/theme";
import { usePolling } from "../../src/hooks/usePolling";
import { fetchQueue, gateOut, selectReadyToLeave } from "../../src/store/operations.slice";
import { useAppDispatch, useAppSelector } from "../../src/store";

/**
 * Exit gate. The bus rolls up already boarding, the guard finds its row and
 * taps the button beside it. Boarding ones sit on top because those are the
 * only ones he may release.
 *
 * The post header lives in GateScreen, which is also what decides this body is
 * the one to show.
 */
export default function GateOutScreen() {
  const dispatch = useAppDispatch();
  const rows = useAppSelector(selectReadyToLeave);
  const submitting = useAppSelector((s) => s.ops.submitting);
  const opsError = useAppSelector((s) => s.ops.error);
  const loading = useAppSelector((s) => s.ops.loading);
  const { flash, show } = useFlash();

  usePolling(useCallback(() => void dispatch(fetchQueue()), [dispatch]));

  const release = async (busId: number, busNumber: string) => {
    const result = await dispatch(gateOut({ busId, busNumber }));
    if (gateOut.fulfilled.match(result)) show(String(result.payload));
  };

  /**
   * Departing is the one gate action that cannot be taken back — §5.7 undoes
   * the last platform assignment, not a departure — and the platform is handed
   * to the next bus the moment it lands. So the bus is named in the question:
   * the mistake this catches is tapping the row above or below the intended
   * one, which a bare "are you sure" would wave straight through.
   */
  const confirmRelease = (busId: number, busNumber: string, platform: number | null) =>
    Alert.alert(
      `Send ${LABELS.vehicle} ${busNumber} out?`,
      platform == null
        ? "This cannot be undone."
        : `${LABELS.slot} ${platform} is freed for the next ${LABELS.vehicle.toLowerCase()}. This cannot be undone.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: LABELS.recordOut,
          style: "destructive",
          onPress: () => void release(busId, busNumber),
        },
      ],
    );

  return (
    <View style={styles.root}>
      {/* Departure cannot be undone from here (§5.7 undoes the last platform
          assignment only), so the bar confirms without offering one. */}
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
            <Feather
              name={loading ? "loader" : "check-circle"}
              size={38}
              color={loading ? COLORS.textMuted : COLORS.success}
            />
            <Text style={styles.emptyTitle}>
              {loading ? "Loading the yard…" : "Campus clear"}
            </Text>
            {!loading && (
              <Text style={styles.emptySub}>
                Every {LABELS.vehicle.toLowerCase()} has departed
              </Text>
            )}
          </View>
        }
        renderItem={({ item }) => {
          // Arrived but not boarding: students are still walking to it, so
          // releasing it would strand them.
          const ready = item.Status === STATUS.boarding;
          return (
            <View style={[styles.row, !ready && styles.rowWaiting]}>
              <SlotBadge slot={item.PlatformNumber} size="md" tone={ready ? "solid" : "light"} />

              <View style={{ flex: 1 }}>
                <Text style={[styles.no, !ready && styles.dim]}>
                  {LABELS.vehicle} {item.BusNumber}
                </Text>
                <Text style={styles.route} numberOfLines={1}>
                  {item.RouteName ?? "No route allocated"}
                </Text>
                <Text style={[styles.status, { color: STATUS_COLOR[item.Status as Status] }]}>
                  {item.Status}
                </Text>
              </View>

              {ready ? (
                <Pressable
                  style={({ pressed }) => [
                    styles.btn,
                    (pressed || submitting) && styles.btnPressed,
                  ]}
                  disabled={submitting}
                  onPress={() => confirmRelease(item.BusId, item.BusNumber, item.PlatformNumber)}
                >
                  <Feather name="log-out" size={17} color={COLORS.white} />
                  <Text style={styles.btnText}>{LABELS.recordOut.toUpperCase()}</Text>
                </Pressable>
              ) : (
                <View style={styles.waitMark}>
                  <Feather name="clock" size={20} color={COLORS.textMuted} />
                  <Text style={styles.waitText}>STUDENTS{"\n"}BOARDING</Text>
                </View>
              )}
            </View>
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, gap: SPACING.sm },

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
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.md,
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.md,
    ...SHADOW.card,
  },
  // Never `opacity` on an elevated card — Android renders its shadow as a
  // grey block. Dim the row with an opaque background and muted text.
  rowWaiting: { backgroundColor: COLORS.surfaceAlt },
  no: { fontSize: 17, fontWeight: "900", color: COLORS.text },
  dim: { color: COLORS.textMuted },
  route: { fontSize: 12, color: COLORS.textMuted, marginTop: 1 },
  status: { fontSize: 11, fontWeight: "900", letterSpacing: 0.4, marginTop: 4 },

  btn: {
    minWidth: 92,
    paddingHorizontal: SPACING.sm,
    height: 62,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.success,
    alignItems: "center",
    justifyContent: "center",
    gap: 2,
  },
  btnPressed: { opacity: 0.75, transform: [{ scale: 0.97 }] },
  btnText: {
    color: COLORS.white,
    // One line now, so it can carry its own weight instead of being squeezed
    // onto two.
    fontSize: 12,
    fontWeight: "900",
    letterSpacing: 0.5,
    textAlign: "center",
    lineHeight: 15,
  },

  waitMark: { minWidth: 92, alignItems: "center", gap: 2 },
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
  emptySub: { fontSize: 13, color: COLORS.textMuted },
});
