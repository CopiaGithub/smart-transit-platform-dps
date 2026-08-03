import { StyleSheet, Text, View } from "react-native";
import { STATUS_COLOR, type Status } from "../constants/domain";
import { RADIUS } from "../constants/theme";

export default function StatusPill({
  status,
  dark = false,
}: {
  status: Status;
  dark?: boolean;
}) {
  const color = STATUS_COLOR[status];
  return (
    <View
      style={[
        styles.pill,
        { backgroundColor: dark ? "transparent" : color + "1A", borderColor: color },
      ]}
    >
      <View style={[styles.dot, { backgroundColor: color }]} />
      <Text style={[styles.text, { color }]}>{status}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  pill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderRadius: RADIUS.sm,
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 3,
    alignSelf: "flex-start",
  },
  dot: { width: 6, height: 6, borderRadius: 3 },
  text: { fontSize: 11, fontWeight: "800", letterSpacing: 0.4 },
});
