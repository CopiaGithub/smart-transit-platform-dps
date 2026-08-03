import { Feather } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import SlotBadge from "../../components/SlotBadge";
import StatusPill from "../../components/StatusPill";
import { LABELS, SLOT_COUNT } from "../../constants/domain";
import { COLORS, RADIUS, SHADOW, SPACING } from "../../constants/theme";
import {
  resetDay,
  selectNextSlot,
  selectStats,
  selectYard,
} from "../../src/store/operations.slice";
import { useAppDispatch, useAppSelector } from "../../src/store";

export default function DashboardScreen() {
  const navigation = useNavigation();
  const dispatch = useAppDispatch();
  const user = useAppSelector((s) => s.auth.user);
  const stats = useAppSelector(selectStats);
  const yard = useAppSelector(selectYard);
  const nextSlot = useAppSelector(selectNextSlot);

  const progress = stats.total ? stats.departed / stats.total : 0;

  return (
    <ScrollView style={styles.root} contentContainerStyle={styles.content}>
      <LinearGradient
        colors={[COLORS.primary, COLORS.primaryDark]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.hero}
      >
        <Text style={styles.heroHi}>Good afternoon, {user?.name ?? "Operator"}</Text>
        <Text style={styles.heroTitle}>Boarding window</Text>

        <View style={styles.progressRow}>
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${progress * 100}%` }]} />
          </View>
          <Text style={styles.progressText}>
            {stats.departed}/{stats.total}
          </Text>
        </View>

        <View style={styles.heroFoot}>
          <HeroStat label="Awaited" value={stats.waiting} />
          <HeroStat label="In yard" value={stats.inYard} />
          <HeroStat
            label={`Next ${LABELS.slot.toLowerCase()}`}
            value={nextSlot ?? "FULL"}
          />
        </View>
      </LinearGradient>

      <View style={styles.actions}>
        <Action
          icon="log-in"
          label={LABELS.gateIn}
          hint={`Assign ${LABELS.slot.toLowerCase()}`}
          color={COLORS.primary}
          onPress={() => navigation.navigate("GateIn" as never)}
        />
        <Action
          icon="log-out"
          label={LABELS.gateOut}
          hint="Mark departed"
          color={COLORS.success}
          onPress={() => navigation.navigate("GateOut" as never)}
        />
        <Action
          icon="monitor"
          label="Live Board"
          hint="LED mirror"
          color={COLORS.text}
          onPress={() => navigation.navigate("LiveBoard" as never)}
        />
        <Action
          icon="repeat"
          label="Replace"
          hint="Reserve bus"
          color={COLORS.accent}
          onPress={() => navigation.navigate("Replace" as never)}
        />
      </View>

      <View style={styles.sectionHead}>
        <Text style={styles.sectionTitle}>Currently in the compound</Text>
        <Pressable onPress={() => navigation.navigate("GateOut" as never)}>
          <Text style={styles.link}>View all</Text>
        </Pressable>
      </View>

      {yard.length === 0 ? (
        <View style={styles.emptyCard}>
          <Feather name="inbox" size={26} color={COLORS.textMuted} />
          <Text style={styles.emptyText}>
            Compound is empty — start by letting a bus in from {LABELS.gateIn}
          </Text>
        </View>
      ) : (
        yard.slice(0, 4).map((bus) => (
          <View key={bus.id} style={styles.card}>
            <SlotBadge slot={bus.slot} size="sm" />
            <View style={{ flex: 1 }}>
              <Text style={styles.cardTitle}>
                {LABELS.vehicle} {bus.no}
              </Text>
              <Text style={styles.cardSub} numberOfLines={1}>
                {bus.route}
              </Text>
            </View>
            <StatusPill status={bus.status} />
          </View>
        ))
      )}

      <View style={styles.capacityCard}>
        <Text style={styles.capacityTitle}>
          {LABELS.slotPlural} occupancy · {yard.length}/{SLOT_COUNT}
        </Text>
        <View style={styles.dots}>
          {Array.from({ length: SLOT_COUNT }, (_, i) => {
            const taken = yard.some((b) => b.slot === i + 1);
            return (
              <View key={i} style={[styles.dot, taken && styles.dotOn]}>
                <Text style={[styles.dotText, taken && styles.dotTextOn]}>{i + 1}</Text>
              </View>
            );
          })}
        </View>
      </View>

      <Pressable style={styles.reset} onPress={() => dispatch(resetDay())}>
        <Feather name="refresh-ccw" size={15} color={COLORS.danger} />
        <Text style={styles.resetText}>End of day — clear all</Text>
      </Pressable>
    </ScrollView>
  );
}

function HeroStat({ label, value }: { label: string; value: number | string }) {
  return (
    <View>
      <Text style={styles.heroStatVal}>{value}</Text>
      <Text style={styles.heroStatCap}>{label}</Text>
    </View>
  );
}

function Action({
  icon,
  label,
  hint,
  color,
  onPress,
}: {
  icon: React.ComponentProps<typeof Feather>["name"];
  label: string;
  hint: string;
  color: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      style={({ pressed }) => [styles.action, pressed && { opacity: 0.7 }]}
      onPress={onPress}
    >
      <View style={[styles.actionIcon, { backgroundColor: color + "14" }]}>
        <Feather name={icon} size={20} color={color} />
      </View>
      <Text style={styles.actionLabel}>{label}</Text>
      <Text style={styles.actionHint}>{hint}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.screenBg },
  content: { padding: SPACING.md, gap: SPACING.md, paddingBottom: SPACING.xl },

  hero: { borderRadius: RADIUS.xl, padding: SPACING.lg, ...SHADOW.lifted },
  heroHi: { color: COLORS.white, opacity: 0.8, fontSize: 12 },
  heroTitle: { color: COLORS.white, fontSize: 24, fontWeight: "900", marginTop: 2 },
  progressRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.sm,
    marginTop: SPACING.md,
  },
  progressTrack: {
    flex: 1,
    height: 7,
    borderRadius: 4,
    backgroundColor: "#FFFFFF33",
    overflow: "hidden",
  },
  progressFill: { height: "100%", borderRadius: 4, backgroundColor: COLORS.accent },
  progressText: { color: COLORS.white, fontSize: 12, fontWeight: "800" },
  heroFoot: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: SPACING.md,
  },
  heroStatVal: { color: COLORS.white, fontSize: 20, fontWeight: "900" },
  heroStatCap: { color: COLORS.white, opacity: 0.7, fontSize: 10, letterSpacing: 0.6 },

  actions: { flexDirection: "row", flexWrap: "wrap", gap: SPACING.sm },
  action: {
    flexGrow: 1,
    flexBasis: "45%",
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.md,
    gap: 2,
    ...SHADOW.card,
  },
  actionIcon: {
    width: 38,
    height: 38,
    borderRadius: RADIUS.md,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: SPACING.xs,
  },
  actionLabel: { fontSize: 14, fontWeight: "800", color: COLORS.text },
  actionHint: { fontSize: 11, color: COLORS.textMuted },

  sectionHead: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: SPACING.xs,
  },
  sectionTitle: { fontSize: 16, fontWeight: "800", color: COLORS.text },
  link: { fontSize: 13, fontWeight: "700", color: COLORS.primary },

  card: {
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
  cardTitle: { fontSize: 14, fontWeight: "800", color: COLORS.text },
  cardSub: { fontSize: 11, color: COLORS.textMuted, marginTop: 1 },

  emptyCard: {
    alignItems: "center",
    gap: SPACING.sm,
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: COLORS.border,
    padding: SPACING.lg,
  },
  emptyText: { color: COLORS.textMuted, fontSize: 13, textAlign: "center" },

  capacityCard: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.md,
    gap: SPACING.sm,
    ...SHADOW.card,
  },
  capacityTitle: { fontSize: 13, fontWeight: "800", color: COLORS.text },
  dots: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  dot: {
    width: 28,
    height: 28,
    borderRadius: RADIUS.sm,
    backgroundColor: COLORS.surfaceAlt,
    alignItems: "center",
    justifyContent: "center",
  },
  dotOn: { backgroundColor: COLORS.primary },
  dotText: { fontSize: 11, fontWeight: "800", color: COLORS.textMuted },
  dotTextOn: { color: COLORS.white },

  reset: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: SPACING.sm,
    paddingVertical: SPACING.md,
  },
  resetText: { color: COLORS.danger, fontWeight: "700", fontSize: 13 },
});
