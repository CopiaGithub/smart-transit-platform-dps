import { Feather } from "@expo/vector-icons";
import {
  DrawerContentScrollView,
  DrawerItemList,
  type DrawerContentComponentProps,
} from "@react-navigation/drawer";
import Constants from "expo-constants";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { COLORS, RADIUS, SPACING } from "../constants/theme";
import { logout } from "../src/store/auth.slice";
import { useAppDispatch, useAppSelector } from "../src/store";

export default function DrawerContent(props: DrawerContentComponentProps) {
  const insets = useSafeAreaInsets();
  const dispatch = useAppDispatch();
  const user = useAppSelector((s) => s.auth.user);

  return (
    <View style={styles.root}>
      <View style={[styles.header, { paddingTop: insets.top + SPACING.md }]}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {(user?.name ?? "?").charAt(0).toUpperCase()}
          </Text>
        </View>
        <Text style={styles.name}>{user?.name ?? "Guest"}</Text>
        <Text style={styles.role}>{user?.role ?? "not signed in"}</Text>
      </View>

      <DrawerContentScrollView {...props} contentContainerStyle={styles.list}>
        <DrawerItemList {...props} />
      </DrawerContentScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + SPACING.md }]}>
        <Pressable
          style={styles.logout}
          onPress={() => {
            props.navigation.closeDrawer();
            dispatch(logout());
          }}
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
  role: { color: COLORS.white, opacity: 0.8, fontSize: 12, textTransform: "capitalize" },
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
