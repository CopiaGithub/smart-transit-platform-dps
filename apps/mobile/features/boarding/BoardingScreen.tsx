import { Feather } from "@expo/vector-icons";
import { useCallback, useMemo } from "react";
import { FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import FlashBar, { useFlash } from "../../components/FlashBar";
import SlotBadge from "../../components/SlotBadge";
import { LABELS, STATUS, STATUS_COLOR, type Status } from "../../constants/domain";
import { COLORS, RADIUS, SHADOW, SPACING, TINT } from "../../constants/theme";
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

  usePolling(useCallback(() => void dispatch(fetchQueue()), [dispatch]));

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
          return (
            <View style={[styles.row, boarding && styles.rowDone]}>
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
                  onPress={() => board(item.EventId, item.BusNumber)}
                >
                  <Feather name="users" size={17} color={COLORS.white} />
                  <Text style={styles.btnText}>MARK{"\n"}BOARDING</Text>
                </Pressable>
              )}
            </View>
          );
        }}
      />
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
