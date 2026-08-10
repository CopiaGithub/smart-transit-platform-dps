import { Feather } from "@expo/vector-icons";
import { StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import PickerChip from "../../components/PickerChip";
import { findGate, LABELS, type Gate } from "../../constants/domain";
import { COLORS, RADIUS, SPACING } from "../../constants/theme";
import { selectOpsStats } from "../../src/store/operations.slice";
import { useAppSelector } from "../../src/store";
import { useViewer } from "../auth/useViewer";
import GateInScreen from "./GateInScreen";
import GateOutScreen from "./GateOutScreen";
import { gatesFacing, useGatePost } from "./useGatePost";

const DIRECTIONS = [
  { key: "in", label: "Entry", hint: `Record a ${LABELS.vehicle.toLowerCase()} arriving` },
  { key: "out", label: "Exit", hint: `Release a ${LABELS.vehicle.toLowerCase()} that has boarded` },
];

/**
 * The guard's whole screen: which post they are on, and the one job that post
 * does.
 *
 * Entry and exit used to be two menu entries, fixed by the role name — so a
 * guard covering someone else's gate could not record anything at all. The post
 * is a choice on the strip now, and it is the only thing that decides which
 * body renders below. Both directions are open to both operators on the server
 * too (RoleNames.AnyGateOperator); the audit still records who did it.
 *
 * The two bodies stay deliberately unalike — blue keypad against green list —
 * so a guard can see which way they are pointing without reading a word.
 */
export default function GateScreen() {
  const insets = useSafeAreaInsets();
  const viewer = useViewer();
  const { gate, choose, ready } = useGatePost(viewer.userId, viewer.gate);
  const stats = useAppSelector(selectOpsStats);

  // Storage answers in a frame or two. Rendering the home post meanwhile would
  // put a covering guard on the wrong keypad for exactly long enough to use it.
  if (!ready) return <View style={styles.root} />;

  const entry = gate.kind === "in";

  const pickDirection = (kind: string) => {
    const [first] = gatesFacing(kind as Gate["kind"]);
    if (first) choose(first);
  };

  return (
    <View style={[styles.root, { paddingBottom: SPACING.md + insets.bottom }]}>
      <View style={[styles.post, entry ? styles.postIn : styles.postOut]}>
        <Feather name={entry ? "log-in" : "log-out"} size={16} color={COLORS.white} />

        <PickerChip
          title="WORKING THIS SHIFT AS"
          selected={gate.kind}
          options={DIRECTIONS}
          onSelect={pickDirection}
        />
        <PickerChip
          title={entry ? "ENTRY GATE" : "EXIT GATE"}
          selected={gate.id}
          options={gatesFacing(gate.kind).map((g) => ({ key: g.id, label: g.label }))}
          onSelect={(id) => choose(findGate(id) ?? gate)}
        />

        <View style={{ flex: 1 }} />
        <Text style={styles.postCount} numberOfLines={1}>
          {entry ? `${stats.awaited} to come in` : `${stats.boarding} ready`}
        </Text>
      </View>

      {entry ? <GateInScreen /> : <GateOutScreen />}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: COLORS.screenBg,
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.md,
    gap: SPACING.sm,
  },

  post: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.xs,
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.sm,
  },
  // Colour is the fastest read on this screen — blue takes buses in, green
  // lets them out. Changing the picker changes the strip under the thumb.
  postIn: { backgroundColor: COLORS.primary },
  postOut: { backgroundColor: COLORS.success },
  postCount: { color: COLORS.white, opacity: 0.9, fontSize: 12, fontWeight: "700" },
});
