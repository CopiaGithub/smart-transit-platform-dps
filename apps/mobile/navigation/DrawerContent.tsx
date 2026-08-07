import { Feather } from "@expo/vector-icons";
import {
  DrawerContentScrollView,
  DrawerItemList,
  type DrawerContentComponentProps,
} from "@react-navigation/drawer";
import Constants from "expo-constants";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LABELS } from "../constants/domain";
import { COLORS, RADIUS, SPACING } from "../constants/theme";
import { useSignOut } from "../features/auth/useSignOut";
import { useViewer } from "../features/auth/useViewer";

export default function DrawerContent(props: DrawerContentComponentProps) {
  const insets = useSafeAreaInsets();
  const signOut = useSignOut();
  const viewer = useViewer();
  const gate = viewer.gate;

  return (
    <View style={styles.root}>
      <View style={[styles.header, { paddingTop: insets.top + SPACING.md }]}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {(viewer.name || "?").charAt(0).toUpperCase()}
          </Text>
        </View>
        <Text style={styles.name}>{viewer.name || "Guest"}</Text>
        <Text style={styles.role}>
          {viewer.name ? viewer.roleLabel : "not signed in"}
          {gate ? ` · ${gate.label}` : ""}
        </Text>
        <Text style={styles.school}>{LABELS.school}</Text>
      </View>

      <DrawerContentScrollView {...props} contentContainerStyle={styles.list}>
        <DrawerItemList {...props} />
      </DrawerContentScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + SPACING.md }]}>
        <Pressable
          style={styles.logout}
          onPress={() => signOut(() => props.navigation.closeDrawer())}
        >
          <Feather name="log-out" size={18} color={COLORS.danger} />
          <Text style={styles.logoutText}>Sign out</Text>
        </Pressable>
        <Text style={styles.version}>
          v{Constants.expoConfig?.version} · {String(Constants.expoConfig?.extra?.appEnv)}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.surface },
  header: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.md,
    paddingBottom: SPACING.md,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.white,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: SPACING.sm,
  },
  avatarText: { color: COLORS.primary, fontSize: 22, fontWeight: "700" },
  name: { color: COLORS.white, fontSize: 16, fontWeight: "700" },
  role: { color: COLORS.white, opacity: 0.85, fontSize: 12, fontWeight: "600" },
  school: { color: COLORS.white, opacity: 0.6, fontSize: 11, marginTop: 2 },
  list: { paddingTop: SPACING.sm },
  footer: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: COLORS.border,
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.md,
  },
  logout: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.sm,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.sm,
    borderRadius: RADIUS.md,
  },
  logoutText: { color: COLORS.danger, fontWeight: "600" },
  version: { color: COLORS.textMuted, fontSize: 11, marginTop: SPACING.xs },
});
