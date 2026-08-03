import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useMemo, useState } from "react";
import {
  FlatList,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import SlotBadge from "../../components/SlotBadge";
import { LABELS, SLOT_COUNT } from "../../constants/domain";
import { COLORS, RADIUS, SHADOW, SPACING } from "../../constants/theme";
import type { Bus } from "../../src/data/seed";
import {
  assignSlot,
  selectNextSlot,
  selectStats,
  selectWaiting,
  selectYard,
  undoLastAssignment,
} from "../../src/store/operations.slice";
import { useAppDispatch, useAppSelector } from "../../src/store";

/**
 * The screen the Gate 6 guard uses under time pressure: one tap to pick the
 * bus, one tap to confirm. Everything else on it is read-only reassurance.
 */
export default function GateInScreen() {
  const dispatch = useAppDispatch();
  const waiting = useAppSelector(selectWaiting);
  const yard = useAppSelector(selectYard);
  const nextSlot = useAppSelector(selectNextSlot);
  const stats = useAppSelector(selectStats);
  const canUndo = useAppSelector((s) => s.ops.lastAssignedId !== null);

  const [query, setQuery] = useState("");
  const [pending, setPending] = useState<Bus | null>(null);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return waiting;
    return waiting.filter(
      (b) => b.no.toLowerCase().includes(q) || b.route.toLowerCase().includes(q),
    );
  }, [waiting, query]);

  const full = nextSlot === null;

  return (
    <View style={styles.root}>
      <LinearGradient
        colors={[COLORS.primary, COLORS.primaryDark]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.hero}
      >
        <View style={{ flex: 1 }}>
          <Text style={styles.heroCap}>NEXT {LABELS.slot.toUpperCase()}</Text>
          <Text style={styles.heroNum}>{full ? "FULL" : nextSlot}</Text>
          <Text style={styles.heroSub}>
            {full
              ? `All ${SLOT_COUNT} stations occupied — hold at gate`
              : `${yard.length} of ${SLOT_COUNT} stations occupied`}
          </Text>
          <View style={styles.bar}>
            <View
              style={[
                styles.barFill,
                {
                  width: `${Math.min(100, (yard.length / SLOT_COUNT) * 100)}%`,
                  backgroundColor: full ? COLORS.danger : COLORS.accent,
                },
              ]}
            />
          </View>
        </View>
        <View style={styles.heroStats}>
          <Stat value={stats.waiting} label="AWAITED" />
          <Stat value={stats.inYard} label="IN YARD" />
          <Stat value={stats.departed} label="OUT" />
        </View>
      </LinearGradient>

      <View style={styles.searchRow}>
        <View style={styles.search}>
          <Feather name="search" size={17} color={COLORS.textMuted} />
          <TextInput
            style={styles.searchInput}
            placeholder={`Search ${LABELS.vehicleNo} or ${LABELS.route.toLowerCase()}`}
            placeholderTextColor={COLORS.textMuted}
            value={query}
            onChangeText={setQuery}
            autoCorrect={false}
          />
          {!!query && (
            <Pressable onPress={() => setQuery("")} hitSlop={10}>
              <Feather name="x" size={17} color={COLORS.textMuted} />
            </Pressable>
          )}
        </View>
        <Pressable
          style={[styles.undo, !canUndo && styles.undoOff]}
          disabled={!canUndo}
          onPress={() => dispatch(undoLastAssignment())}
        >
          <Feather
            name="rotate-ccw"
            size={17}
            color={canUndo ? COLORS.danger : COLORS.textMuted}
          />
        </Pressable>
      </View>

      <FlatList
        data={results}
        keyExtractor={(b) => b.id}
        numColumns={3}
        columnWrapperStyle={{ gap: SPACING.sm }}
        contentContainerStyle={styles.grid}
        ListHeaderComponent={
          <Text style={styles.sectionCap}>
            TAP AN ARRIVING {LABELS.vehicle.toUpperCase()}
          </Text>
        }
        ListEmptyComponent={
          <Text style={styles.empty}>
            {query ? "No match" : "Every bus has been let in"}
          </Text>
        }
        renderItem={({ item }) => (
          <Pressable
            style={({ pressed }) => [
              styles.tile,
              full && styles.tileOff,
              pressed && !full && styles.tilePressed,
            ]}
            disabled={full}
            onPress={() => setPending(item)}
          >
            <Text style={styles.tileNo}>{item.no}</Text>
            <Text style={styles.tileRoute} numberOfLines={2}>
              {item.route}
            </Text>
          </Pressable>
        )}
      />

      <ConfirmSheet
        bus={pending}
        slot={nextSlot}
        onCancel={() => setPending(null)}
        onConfirm={() => {
          if (pending) dispatch(assignSlot(pending.id));
          setPending(null);
        }}
      />
    </View>
  );
}

function Stat({ value, label }: { value: number; label: string }) {
  return (
    <View style={{ alignItems: "flex-end" }}>
      <Text style={styles.statVal}>{value}</Text>
      <Text style={styles.statCap}>{label}</Text>
    </View>
  );
}

function ConfirmSheet({
  bus,
  slot,
  onCancel,
  onConfirm,
}: {
  bus: Bus | null;
  slot: number | null;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <Modal visible={!!bus} transparent animationType="slide" onRequestClose={onCancel}>
      <Pressable style={styles.backdrop} onPress={onCancel} />
      <View style={styles.sheet}>
        <View style={styles.grabber} />
        <Text style={styles.sheetCap}>CONFIRM ARRIVAL</Text>

        <View style={styles.sheetRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.sheetBus}>
              {LABELS.vehicle} {bus?.no}
            </Text>
            <Text style={styles.sheetRoute}>{bus?.route}</Text>
          </View>
          <SlotBadge slot={slot} size="lg" tone="solid" />
        </View>

        <Text style={styles.sheetNote}>
          {LABELS.slot} {slot} is the next free slot in the queue. The boards update
          immediately.
        </Text>

        <View style={{ flexDirection: "row", gap: SPACING.sm }}>
          <Pressable style={[styles.btn, styles.btnGhost]} onPress={onCancel}>
            <Text style={styles.btnGhostText}>Cancel</Text>
          </Pressable>
          <Pressable style={[styles.btn, styles.btnPrimary]} onPress={onConfirm}>
            <Feather name="check" size={18} color={COLORS.white} />
            <Text style={styles.btnPrimaryText}>Assign {LABELS.slot}</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.screenBg },

  hero: {
    flexDirection: "row",
    padding: SPACING.md,
    paddingBottom: SPACING.lg,
    borderBottomLeftRadius: RADIUS.xl,
    borderBottomRightRadius: RADIUS.xl,
  },
  heroCap: {
    color: COLORS.white,
    opacity: 0.75,
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 1.4,
  },
  heroNum: { color: COLORS.white, fontSize: 54, fontWeight: "900", lineHeight: 60 },
  heroSub: { color: COLORS.white, opacity: 0.8, fontSize: 12 },
  bar: {
    height: 5,
    borderRadius: 3,
    backgroundColor: "#FFFFFF33",
    marginTop: SPACING.sm,
    overflow: "hidden",
  },
  barFill: { height: "100%", borderRadius: 3 },
  heroStats: { justifyContent: "center", gap: SPACING.sm },
  statVal: { color: COLORS.white, fontSize: 20, fontWeight: "900" },
  statCap: { color: COLORS.white, opacity: 0.7, fontSize: 9, letterSpacing: 1 },

  searchRow: {
    flexDirection: "row",
    gap: SPACING.sm,
    paddingHorizontal: SPACING.md,
    marginTop: SPACING.md,
  },
  search: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.sm,
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: SPACING.md,
    height: 46,
  },
  searchInput: { flex: 1, color: COLORS.text, fontSize: 15 },
  undo: {
    width: 46,
    height: 46,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: "center",
    justifyContent: "center",
  },
  undoOff: { opacity: 0.45 },

  grid: { padding: SPACING.md, gap: SPACING.sm },
  sectionCap: {
    color: COLORS.textMuted,
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 1.2,
    marginBottom: SPACING.sm,
  },
  tile: {
    flex: 1,
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.sm,
    alignItems: "center",
    minHeight: 92,
    ...SHADOW.card,
  },
  tilePressed: { borderColor: COLORS.primary, backgroundColor: COLORS.surfaceAlt },
  tileOff: { opacity: 0.4 },
  tileNo: { fontSize: 26, fontWeight: "900", color: COLORS.primary },
  tileRoute: {
    fontSize: 10,
    color: COLORS.textMuted,
    textAlign: "center",
    marginTop: 2,
  },
  empty: { textAlign: "center", color: COLORS.textMuted, marginTop: SPACING.xl },

  backdrop: { flex: 1, backgroundColor: "#0F172A99" },
  sheet: {
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: RADIUS.xl,
    borderTopRightRadius: RADIUS.xl,
    padding: SPACING.lg,
    paddingBottom: SPACING.xl,
    gap: SPACING.md,
  },
  grabber: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: COLORS.border,
    alignSelf: "center",
  },
  sheetCap: {
    color: COLORS.textMuted,
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 1.4,
  },
  sheetRow: { flexDirection: "row", alignItems: "center", gap: SPACING.md },
  sheetBus: { fontSize: 24, fontWeight: "900", color: COLORS.text },
  sheetRoute: { fontSize: 13, color: COLORS.textMuted, marginTop: 2 },
  sheetNote: { fontSize: 12, color: COLORS.textMuted, lineHeight: 18 },
  btn: {
    flex: 1,
    height: 52,
    borderRadius: RADIUS.md,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: SPACING.sm,
  },
  btnGhost: { borderWidth: 1, borderColor: COLORS.border },
  btnGhostText: { color: COLORS.textMuted, fontWeight: "700", fontSize: 15 },
  btnPrimary: { backgroundColor: COLORS.primary, flex: 1.6 },
  btnPrimaryText: { color: COLORS.white, fontWeight: "800", fontSize: 15 },
});
