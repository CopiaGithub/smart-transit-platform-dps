import { Feather } from "@expo/vector-icons";
import { FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import FlashBar, { useFlash } from "../../components/FlashBar";
import SlotBadge from "../../components/SlotBadge";
import { findGate, LABELS, STATUS, STATUS_COLOR } from "../../constants/domain";
import { COLORS, RADIUS, SHADOW, SPACING } from "../../constants/theme";
import {
  gateOut,
  selectReadyToLeave,
  selectStats,
  undoLast,
} from "../../src/store/operations.slice";
import { useAppDispatch, useAppSelector } from "../../src/store";

/**
 * Exit gate. Same shape as the teacher's screen: the bus rolls up already
 * boarding, the guard finds its row and taps the button beside it. Boarding
 * ones sit on top because those are the only ones he can release.
 */
export default function GateOutScreen() {
  const dispatch = useAppDispatch();
  const buses = useAppSelector(selectReadyToLeave);
  const stats = useAppSelector(selectStats);
  const user = useAppSelector((s) => s.auth.user);
  const gate = findGate(user?.gateId);
  const { flash, show, clear } = useFlash();

  return (
    <View style={styles.root}>
      <View style={styles.post}>
        <Feather name="log-out" size={16} color={COLORS.white} />
        <Text style={styles.postText}>{gate?.label ?? "Exit gate"} · Exit</Text>
        <View style={{ flex: 1 }} />
        <Text style={styles.postCount}>
          {stats.boarding} ready · {stats.onCampus} inside
        </Text>
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
            <Feather name="check-circle" size={38} color={COLORS.success} />
            <Text style={styles.emptyTitle}>Campus clear</Text>
            <Text style={styles.emptySub}>
              Every {LABELS.vehicle.toLowerCase()} has departed
            </Text>
          </View>
        }
        renderItem={({ item }) => {
          // Arrived but not boarding: students are still walking to it, so
          // releasing it would strand them. Shown for context, not tappable.
          const ready = item.status === STATUS.boarding;
          return (
            <View style={[styles.row, !ready && styles.rowWaiting]}>
              <SlotBadge slot={item.slot} size="md" tone={ready ? "solid" : "light"} />

              <View style={{ flex: 1 }}>
                <Text style={[styles.no, !ready && styles.dim]}>
                  {LABELS.vehicle} {item.no}
                </Text>
                <Text style={styles.route} numberOfLines={1}>
                  {item.route}
                </Text>
                <Text style={[styles.status, { color: STATUS_COLOR[item.status!] }]}>
                  {item.status}
                </Text>
              </View>

              {ready ? (
                <Pressable
                  style={({ pressed }) => [styles.btn, pressed && styles.btnPressed]}
                  onPress={() => {
                    dispatch(gateOut(item.id));
                    show(`${LABELS.vehicle} ${item.no} departed`);
                  }}
                >
                  <Feather name="log-out" size={17} color={COLORS.white} />
                  <Text style={styles.btnText}>MARK{"\n"}GATE OUT</Text>
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
  root: { flex: 1, backgroundColor: COLORS.screenBg, padding: SPACING.md, gap: SPACING.sm },

  post: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.sm,
    backgroundColor: COLORS.success,
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
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 0.5,
    textAlign: "center",
    lineHeight: 12,
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
