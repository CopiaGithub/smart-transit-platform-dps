import { Feather } from "@expo/vector-icons";
import { useMemo } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { LABELS, STATUS, STATUS_COLOR, type BusStatus } from "../../constants/domain";
import { COLORS, RADIUS, SHADOW, SPACING, TINT } from "../../constants/theme";
import type { Bus, Student } from "../../src/data/seed";
import { useAppSelector } from "../../src/store";

/**
 * The parent's whole app: their own children, the bus each one rides and where
 * that bus is right now. Strictly read-only — a parent watches, never marks.
 */
export default function ParentScreen() {
  const user = useAppSelector((s) => s.auth.user);
  const students = useAppSelector((s) => s.ops.students);
  const fleet = useAppSelector((s) => s.ops.fleet);

  // A parent sees their own children only — never the whole school roll.
  const children = useMemo(
    () => (user ? students.filter((st) => st.parentIds.includes(user.id)) : []),
    [students, user],
  );

  return (
    <ScrollView style={styles.root} contentContainerStyle={styles.content}>
      <View>
        <Text style={styles.hello}>Hello, {user?.name ?? "there"}</Text>
        <Text style={styles.title}>
          {children.length === 1 ? "Your child today" : "Your children today"}
        </Text>
      </View>

      {children.length === 0 ? (
        <View style={styles.emptyCard}>
          <Feather name="user-x" size={30} color={COLORS.textMuted} />
          <Text style={styles.emptyTitle}>No child linked yet</Text>
          <Text style={styles.emptySub}>
            Ask the school office to link your child to this account.
          </Text>
        </View>
      ) : (
        children.map((child) => (
          <ChildCard
            key={child.id}
            child={child}
            bus={fleet.find((b) => b.id === child.busId) ?? null}
          />
        ))
      )}

      <Text style={styles.footnote}>
        This screen updates on its own as security and the class teacher mark the
        {" "}{LABELS.vehicle.toLowerCase()}. Nothing here can be changed from your side.
      </Text>
    </ScrollView>
  );
}

function ChildCard({ child, bus }: { child: Student; bus: Bus | null }) {
  const tone = statusTone(bus?.status ?? null);

  return (
    <View style={styles.card}>
      <View style={styles.childRow}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{child.name.charAt(0).toUpperCase()}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.childName}>{child.name}</Text>
          <Text style={styles.childClass}>
            Grade {child.grade} · Division {child.division}
          </Text>
        </View>
      </View>

      <View style={[styles.statusBox, { backgroundColor: tone.bg, borderColor: tone.color }]}>
        <View style={[styles.statusDot, { backgroundColor: tone.color }]} />
        <View style={{ flex: 1 }}>
          <Text style={[styles.statusLabel, { color: tone.color }]}>{tone.label}</Text>
          <Text style={styles.statusHint}>{tone.hint(bus)}</Text>
        </View>
      </View>

      <Section title={LABELS.vehicle.toUpperCase()}>
        {bus ? (
          <>
            <Row label={LABELS.vehicleNo} value={bus.no} strong />
            <Row label={LABELS.route} value={bus.route} />
            <Row
              label={LABELS.slot}
              value={bus.slot === null ? "Not allocated yet" : String(bus.slot).padStart(2, "0")}
            />
          </>
        ) : (
          <Text style={styles.missing}>No {LABELS.vehicle.toLowerCase()} assigned yet</Text>
        )}
      </Section>

      <Section title="DRIVER">
        {bus?.driver ? (
          <>
            <Row label="Name" value={bus.driver.name} strong />
            <Row label="Mobile" value={bus.driver.mobile} />
          </>
        ) : (
          <Text style={styles.missing}>Driver not assigned yet</Text>
        )}
      </Section>
    </View>
  );
}

/** What each status means to a parent, in their words rather than the guard's. */
function statusTone(status: BusStatus) {
  switch (status) {
    case STATUS.arrived:
      return {
        label: "At school",
        color: STATUS_COLOR.Arrived,
        bg: TINT.primary,
        hint: (b: Bus | null) =>
          `Waiting at ${LABELS.slot.toLowerCase()} ${String(b?.slot ?? 0).padStart(2, "0")} — students are walking to it.`,
      };
    case STATUS.boarding:
      return {
        label: "Boarding now",
        color: STATUS_COLOR.Boarding,
        bg: TINT.warning,
        hint: (b: Bus | null) =>
          `Children are climbing in at ${LABELS.slot.toLowerCase()} ${String(b?.slot ?? 0).padStart(2, "0")}.`,
      };
    case STATUS.departed:
      return {
        label: "Left school",
        color: STATUS_COLOR.Departed,
        bg: TINT.success,
        hint: (b: Bus | null) =>
          b?.departedAt
            ? `Departed at ${new Date(b.departedAt).toLocaleTimeString("en-IN", {
                hour: "2-digit",
                minute: "2-digit",
              })}.`
            : "The bus has left the school gate.",
      };
    default:
      return {
        label: "Not reached school yet",
        color: COLORS.textMuted,
        bg: COLORS.surfaceAlt,
        hint: () => "You will see the station here the moment it enters the gate.",
      };
  }
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionCap}>{title}</Text>
      {children}
    </View>
  );
}

function Row({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={[styles.rowValue, strong && styles.rowValueStrong]} numberOfLines={2}>
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.screenBg },
  content: { padding: SPACING.md, gap: SPACING.md, paddingBottom: SPACING.xl },

  hello: { fontSize: 13, color: COLORS.textMuted },
  title: { fontSize: 24, fontWeight: "900", color: COLORS.text },

  card: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.xl,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.md,
    gap: SPACING.md,
    ...SHADOW.card,
  },

  childRow: { flexDirection: "row", alignItems: "center", gap: SPACING.md },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: COLORS.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: { color: COLORS.white, fontSize: 20, fontWeight: "900" },
  childName: { fontSize: 18, fontWeight: "900", color: COLORS.text },
  childClass: { fontSize: 12, color: COLORS.textMuted, marginTop: 2 },

  statusBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.sm,
    borderWidth: 1,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
  },
  statusDot: { width: 10, height: 10, borderRadius: 5 },
  statusLabel: { fontSize: 15, fontWeight: "900" },
  statusHint: { fontSize: 12, color: COLORS.textMuted, marginTop: 2, lineHeight: 17 },

  section: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: COLORS.border,
    paddingTop: SPACING.sm,
    gap: 4,
  },
  sectionCap: {
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 1.2,
    color: COLORS.textMuted,
    marginBottom: 2,
  },
  row: { flexDirection: "row", alignItems: "flex-start", gap: SPACING.md },
  rowLabel: { width: 78, fontSize: 12, color: COLORS.textMuted },
  rowValue: { flex: 1, fontSize: 13, color: COLORS.text, textAlign: "right" },
  rowValueStrong: { fontWeight: "800" },
  missing: { fontSize: 12, color: COLORS.textMuted, fontStyle: "italic" },

  emptyCard: {
    alignItems: "center",
    gap: SPACING.xs,
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: COLORS.border,
    padding: SPACING.lg,
  },
  emptyTitle: { fontSize: 16, fontWeight: "800", color: COLORS.text },
  emptySub: { fontSize: 13, color: COLORS.textMuted, textAlign: "center" },

  footnote: { fontSize: 11, color: COLORS.textMuted, lineHeight: 16, textAlign: "center" },
});
