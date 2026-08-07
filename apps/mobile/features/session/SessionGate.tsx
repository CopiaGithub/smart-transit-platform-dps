import { Feather } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { useCallback, type ReactNode } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";
import { LABELS, ROLES } from "../../constants/domain";
import { COLORS, RADIUS, SHADOW, SPACING, TINT } from "../../constants/theme";
import { fetchCurrentSession, openSession } from "../../src/store/session.slice";
import { useAppDispatch, useAppSelector } from "../../src/store";
import { useViewer } from "../auth/useViewer";

/**
 * Nothing can be recorded until a dispersal session is open (§5.2), so every
 * screen that writes to the day sits behind this. It is a gate rather than a
 * banner on purpose: a guard tapping a bus into a closed day would get a
 * refusal per tap, and never be told the actual reason.
 */
export default function SessionGate({ children }: { children: ReactNode }) {
  const dispatch = useAppDispatch();
  const viewer = useViewer();
  const { current, loaded, loading, error } = useAppSelector((s) => s.session);

  // Re-check on focus: another post may have opened or closed the day while
  // this screen sat in the background.
  useFocusEffect(
    useCallback(() => {
      dispatch(fetchCurrentSession());
    }, [dispatch]),
  );

  if (!loaded) {
    return (
      <View style={styles.centre}>
        <ActivityIndicator color={COLORS.primary} />
        <Text style={styles.muted}>Checking today's session…</Text>
      </View>
    );
  }

  if (current) return <>{children}</>;

  // §6: only an admin or the Gate 6 operator may open the day.
  const mayOpen = viewer.role === ROLES.admin || viewer.gate?.kind === "in";

  return (
    <View style={styles.root}>
      <View style={styles.card}>
        <View style={styles.icon}>
          <Feather name="calendar" size={26} color={COLORS.warning} />
        </View>

        <Text style={styles.title}>No session open</Text>
        <Text style={styles.body}>
          Today's dispersal has not been started yet, so no {LABELS.vehicle.toLowerCase()}{" "}
          movement can be recorded.
        </Text>

        {!!error && (
          <View style={styles.alert}>
            <Feather name="alert-circle" size={15} color={COLORS.danger} />
            <Text style={styles.alertText}>{error}</Text>
          </View>
        )}

        {mayOpen ? (
          <Pressable
            style={({ pressed }) => [styles.cta, (pressed || loading) && styles.ctaOff]}
            disabled={loading}
            onPress={() => dispatch(openSession())}
          >
            {loading ? (
              <ActivityIndicator color={COLORS.white} />
            ) : (
              <>
                <Feather name="play-circle" size={20} color={COLORS.white} />
                <Text style={styles.ctaText}>Open today's session</Text>
              </>
            )}
          </Pressable>
        ) : (
          <Text style={styles.hint}>
            Ask the Gate 6 operator or an administrator to open it.
          </Text>
        )}

        <Pressable
          style={styles.refresh}
          onPress={() => dispatch(fetchCurrentSession())}
          hitSlop={8}
        >
          <Feather name="refresh-ccw" size={13} color={COLORS.textMuted} />
          <Text style={styles.refreshText}>Check again</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.screenBg, padding: SPACING.md, justifyContent: "center" },
  centre: {
    flex: 1,
    backgroundColor: COLORS.screenBg,
    alignItems: "center",
    justifyContent: "center",
    gap: SPACING.sm,
  },
  muted: { color: COLORS.textMuted, fontSize: 13 },

  card: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.xl,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.lg,
    alignItems: "center",
    gap: SPACING.sm,
    ...SHADOW.card,
  },
  icon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    // Opaque tint — an elevated card must never carry a translucent background.
    backgroundColor: TINT.warning,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: SPACING.xs,
  },
  title: { fontSize: 19, fontWeight: "900", color: COLORS.text },
  body: { fontSize: 13, color: COLORS.textMuted, textAlign: "center", lineHeight: 19 },

  alert: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.sm,
    alignSelf: "stretch",
    backgroundColor: TINT.danger,
    borderWidth: 1,
    borderColor: COLORS.danger + "44",
    borderRadius: RADIUS.md,
    padding: SPACING.sm,
  },
  alertText: { flex: 1, color: COLORS.danger, fontSize: 12, fontWeight: "600", lineHeight: 17 },

  cta: {
    alignSelf: "stretch",
    height: 54,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.primary,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: SPACING.sm,
    marginTop: SPACING.xs,
  },
  ctaOff: { opacity: 0.6 },
  ctaText: { color: COLORS.white, fontSize: 16, fontWeight: "800" },
  hint: { fontSize: 13, color: COLORS.textMuted, textAlign: "center", marginTop: SPACING.xs },

  refresh: { flexDirection: "row", alignItems: "center", gap: 6, paddingVertical: SPACING.sm },
  refreshText: { fontSize: 12, color: COLORS.textMuted, fontWeight: "600" },
});
