import { Feather } from "@expo/vector-icons";
import Constants from "expo-constants";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { LABELS, ROLES } from "../../constants/domain";
import { COLORS, RADIUS, SHADOW, SPACING } from "../../constants/theme";
import QuickSignInCard from "../auth/QuickSignInCard";
import { useSignOut } from "../auth/useSignOut";
import { useViewer } from "../auth/useViewer";

/** Who am I, where am I posted, and how do I get out. Nothing else. */
export default function ProfileScreen() {
  const signOut = useSignOut();
  const viewer = useViewer();
  const gate = viewer.gate;

  return (
    <ScrollView style={styles.root} contentContainerStyle={styles.content}>
      <View style={styles.hero}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {(viewer.name || "?").charAt(0).toUpperCase()}
          </Text>
        </View>
        <Text style={styles.name}>{viewer.name || "Guest"}</Text>
        <Text style={styles.role}>
          {viewer.name ? viewer.roleLabel : "Not signed in"}
        </Text>
      </View>

      <View style={styles.card}>
        <Row icon="home" label="School" value={LABELS.school} />
        <Row icon="shield" label="Role" value={viewer.name ? viewer.roleLabel : "—"} />
        {viewer.role === ROLES.security && (
          <Row
            icon="map-pin"
            // Where the shift normally starts. The gate screen can be pointed
            // anywhere from there, so this is not what they are limited to.
            label="Home post"
            value={gate ? `${gate.label} · ${gate.kind === "in" ? "Entry" : "Exit"}` : "—"}
          />
        )}
        <Row
          icon="check-square"
          label="You can mark"
          value={
            viewer.role === ROLES.security
              ? "Arrived · Departed"
              : viewer.role === ROLES.teacher
                ? "Boarding"
                : viewer.role === ROLES.parent
                  ? "Nothing — view only"
                  : "Arrived · Boarding · Departed"
          }
        />
      </View>

      <QuickSignInCard />

      <View style={styles.card}>
        <Row icon="smartphone" label="Version" value={String(Constants.expoConfig?.version)} />
      </View>

      <Pressable style={styles.signOut} onPress={() => signOut()}>
        <Feather name="log-out" size={18} color={COLORS.danger} />
        <Text style={styles.signOutText}>Sign out</Text>
      </Pressable>
    </ScrollView>
  );
}

function Row({
  icon,
  label,
  value,
}: {
  icon: React.ComponentProps<typeof Feather>["name"];
  label: string;
  value: string;
}) {
  return (
    <View style={styles.row}>
      <View style={styles.rowIcon}>
        <Feather name={icon} size={15} color={COLORS.primary} />
      </View>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.value} numberOfLines={2}>
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.screenBg },
  content: { padding: SPACING.md, gap: SPACING.md, paddingBottom: SPACING.xl },

  hero: {
    alignItems: "center",
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.xl,
    padding: SPACING.lg,
    gap: 4,
    ...SHADOW.card,
  },
  avatar: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: COLORS.primary,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: SPACING.sm,
  },
  avatarText: { color: COLORS.white, fontSize: 30, fontWeight: "900" },
  name: { fontSize: 20, fontWeight: "900", color: COLORS.text },
  role: { fontSize: 13, color: COLORS.textMuted },

  card: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.md,
    gap: SPACING.md,
    ...SHADOW.card,
  },
  row: { flexDirection: "row", alignItems: "center", gap: SPACING.sm },
  rowIcon: {
    width: 30,
    height: 30,
    borderRadius: 8,
    backgroundColor: COLORS.primary + "14",
    alignItems: "center",
    justifyContent: "center",
  },
  label: { fontSize: 13, color: COLORS.textMuted, flex: 1 },
  value: { fontSize: 13, fontWeight: "700", color: COLORS.text, flexShrink: 1, textAlign: "right" },

  signOut: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: SPACING.sm,
    height: 52,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.danger + "55",
    backgroundColor: COLORS.danger + "0D",
  },
  signOutText: { color: COLORS.danger, fontWeight: "800", fontSize: 15 },
});
