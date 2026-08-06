import { MaterialCommunityIcons } from "@expo/vector-icons";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { LABELS } from "../../constants/domain";
import { COLORS, RADIUS, SPACING } from "../../constants/theme";

/** Shown while the stored session is read. Purely visual — the root navigator
 *  owns the decision of what comes next. */
export default function SplashScreen() {
  return (
    <View style={styles.root}>
      <View style={styles.logo}>
        <MaterialCommunityIcons name="bus" size={30} color={COLORS.white} />
      </View>
      <Text style={styles.title}>{LABELS.app}</Text>
      <Text style={styles.tagline}>{LABELS.school}</Text>
      <ActivityIndicator color={COLORS.white} style={{ marginTop: SPACING.lg }} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: COLORS.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  logo: {
    width: 64,
    height: 64,
    borderRadius: RADIUS.lg,
    backgroundColor: "#FFFFFF26",
    borderWidth: 1,
    borderColor: "#FFFFFF33",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: SPACING.md,
  },
  title: { color: COLORS.white, fontSize: 23, fontWeight: "900", letterSpacing: -0.3 },
  tagline: { color: COLORS.white, opacity: 0.75, fontSize: 13, marginTop: 4 },
});
