import { Feather } from "@expo/vector-icons";
import { useMemo } from "react";
import { FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import FlashBar, { useFlash } from "../../components/FlashBar";
import SlotBadge from "../../components/SlotBadge";
import { LABELS, STATUS, STATUS_COLOR } from "../../constants/domain";
import { COLORS, RADIUS, SHADOW, SPACING, TINT } from "../../constants/theme";
import {
  selectOnCampus,
  selectStats,
  startBoarding,
  undoLast,
} from "../../src/store/operations.slice";
import { useAppDispatch, useAppSelector } from "../../src/store";

/**
 * The teacher's whole app. A bus appears the instant security lets it in and
 * the Mark boarding button sits on that same row — no dashboard, no drill-in,
 * nothing between the arrival and the tap.
 */
export default function BoardingScreen() {
  const dispatch = useAppDispatch();
  const onCampus = useAppSelector(selectOnCampus);
  const stats = useAppSelector(selectStats);
  const { flash, show, clear } = useFlash();

  // Buses still waiting rise to the top: those are the ones needing a tap.
  const buses = useMemo(
    () =>
      [...onCampus].sort(
        (a, z) =>
          Number(a.status === STATUS.boarding) - Number(z.status === STATUS.boarding) ||
          (a.slot ?? 0) - (z.slot ?? 0),
      ),
    [onCampus],
  );

  const waiting = onCampus.filter((b) => b.status === STATUS.arrived).length;

  return (
    <View style={styles.root}>
      <View style={styles.post}>
        <Feather name="users" size={16} color={COLORS.white} />
        <Text style={styles.postText}>{waiting} waiting to board</Text>
        <View style={{ flex: 1 }} />
        <Text style={styles.postCount}>{stats.boarding} boarding now</Text>
      </View>

      {!!flash && (
        <FlashBar
          text={flash}
          onUndo={() => {
            dispatch(undoLast());
            clear();
          }}
        />
      )}

      <FlatList
        data={buses}
        keyExtractor={(b) => b.id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Feather name="clock" size={38} color={COLORS.textMuted} />
            <Text style={styles.emptyTitle}>
              No {LABELS.vehiclePlural.toLowerCase()} on campus
            </Text>
            <Text style={styles.emptySub}>
              They appear here the moment security lets them in
            </Text>
          </View>
        }
        renderItem={({ item }) => {
          const boarding = item.status === STATUS.boarding;
          return (
            <View style={[styles.row, boarding && styles.rowDone]}>
              <SlotBadge slot={item.slot} size="md" tone={boarding ? "solid" : "light"} />

              <View style={{ flex: 1 }}>
                <Text style={styles.no}>
                  {LABELS.vehicle} {item.no}
                </Text>
                <Text style={styles.route} numberOfLines={1}>
                  {item.route}
                </Text>
                <Text style={[styles.status, { color: STATUS_COLOR[item.status!] }]}>
                  {item.status}
                </Text>
              </View>

              {boarding ? (
                <View style={styles.doneMark}>
                  <Feather name="check" size={22} color={COLORS.warning} />
                  <Text style={styles.doneText}>DONE</Text>
                </View>
              ) : (
                <Pressable
                  style={({ pressed }) => [styles.btn, pressed && styles.btnPressed]}
                  onPress={() => {
                    dispatch(startBoarding(item.id));
                    show(`${LABELS.vehicle} ${item.no} boarding`);
                  }}
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

  empty: { alignItems: "center", marginTop: SPACING.xl * 2, gap: SPACING.xs },
  emptyTitle: { fontSize: 17, fontWeight: "800", color: COLORS.text },
  emptySub: { fontSize: 13, color: COLORS.textMuted, textAlign: "center" },
});
