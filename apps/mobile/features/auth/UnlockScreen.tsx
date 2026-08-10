import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useCallback, useEffect, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Keypad from "../../components/Keypad";
import { LABELS } from "../../constants/domain";
import { COLORS, GRADIENT, RADIUS, SPACING } from "../../constants/theme";
import { useAppDispatch, useAppSelector } from "../../src/store";
import { login } from "../../src/store/auth.slice";
import {
  MPIN_LENGTH,
  forget,
  unlockWithBiometrics,
  verifyMpin,
  type StoredCredentials,
  type UnlockResult,
  type UnlockState,
} from "./unlock";

/**
 * The returning-user screen: four digits, or a face, instead of a password.
 *
 * The biometric prompt is fired on mount, because the fastest possible sign-in
 * is the one already asking by the time the phone is up. Cancelling it drops
 * straight onto the MPIN pad — the same pad as the gate screen, so a guard is
 * already fluent in it.
 */
export default function UnlockScreen({
  state,
  onForget,
}: {
  state: UnlockState;
  /** Called after the enrolment is erased, so the parent shows Login again. */
  onForget: () => void;
}) {
  const insets = useSafeAreaInsets();
  const dispatch = useAppDispatch();
  const status = useAppSelector((s) => s.auth.status);
  const authError = useAppSelector((s) => s.auth.error);

  const [pin, setPin] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const signIn = useCallback(
    async (credentials: StoredCredentials) => {
      setBusy(true);
      // The stored password is only ever spent here, on the real login call.
      const result = await dispatch(
        login({ identifier: credentials.identifier, password: credentials.password }),
      );
      setBusy(false);

      // A password changed on the server makes the stored one useless — say so
      // once and hand the person back to the password screen rather than
      // leaving them tapping a PIN that can no longer work.
      if (login.rejected.match(result)) {
        await forget();
        onForget();
      }
    },
    [dispatch, onForget],
  );

  const handle = useCallback(
    async (result: UnlockResult) => {
      setPin("");
      if (result.ok) return signIn(result.credentials);
      setError(result.message || null);
      if (result.forgotten) {
        await forget();
        onForget();
      }
    },
    [onForget, signIn],
  );

  const askBiometrics = useCallback(async () => {
    setError(null);
    void handle(await unlockWithBiometrics(`Unlock ${LABELS.app}`));
  }, [handle]);

  // Offered the moment the screen appears, so the common case needs no taps.
  useEffect(() => {
    if (state.biometricEnabled) void askBiometrics();
  }, [state.biometricEnabled, askBiometrics]);

  const type = (next: string) => {
    setError(null);
    setPin(next);
    if (next.length === MPIN_LENGTH) void verifyMpin(next).then(handle);
  };

  const working = busy || status === "loading";

  return (
    <View style={styles.root}>
      <LinearGradient
        colors={GRADIENT.brandWide}
        start={{ x: 0.05, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.backdrop}
        pointerEvents="none"
      />

      <View style={[styles.sheet, { paddingTop: insets.top + SPACING.xl, paddingBottom: insets.bottom + SPACING.lg }]}>
        <View style={styles.hello}>
          <View style={styles.avatar}>
            <Text style={styles.initial}>{(state.name || "?").charAt(0).toUpperCase()}</Text>
          </View>
          <Text style={styles.name} numberOfLines={1}>
            {state.name || "Welcome back"}
          </Text>
          <Text style={styles.prompt}>Enter your {MPIN_LENGTH}-digit MPIN</Text>
        </View>

        <View style={styles.dots}>
          {Array.from({ length: MPIN_LENGTH }).map((_, i) => (
            <View key={i} style={[styles.dot, i < pin.length && styles.dotOn]} />
          ))}
        </View>

        <Text style={[styles.error, !error && !authError && styles.errorHidden]} numberOfLines={2}>
          {error ?? authError ?? " "}
        </Text>

        <View style={styles.pad}>
          <Keypad value={pin} onChange={type} maxLength={MPIN_LENGTH} />
        </View>

        {state.biometricEnabled && (
          <Pressable style={styles.biometric} onPress={askBiometrics} disabled={working}>
            <Feather name="unlock" size={18} color={COLORS.white} />
            <Text style={styles.biometricText}>Use {state.biometricLabel}</Text>
          </Pressable>
        )}

        {/* Always reachable. An MPIN that can strand somebody outside their own
            shift is worse than the password it replaced. */}
        <Pressable
          onPress={async () => {
            await forget();
            onForget();
          }}
          disabled={working}
          hitSlop={10}
        >
          <Text style={styles.escape}>Sign in with a password instead</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.primaryDark },
  backdrop: { ...StyleSheet.absoluteFillObject },

  sheet: { flex: 1, paddingHorizontal: SPACING.lg, alignItems: "center", gap: SPACING.md },

  hello: { alignItems: "center", gap: SPACING.xs },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "#FFFFFF2E",
    alignItems: "center",
    justifyContent: "center",
  },
  initial: { fontSize: 28, fontWeight: "900", color: COLORS.white },
  name: { fontSize: 22, fontWeight: "900", color: COLORS.white },
  prompt: { fontSize: 13, color: "#FFFFFFB3", fontWeight: "600" },

  dots: { flexDirection: "row", gap: SPACING.md, marginTop: SPACING.xs },
  dot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: "#FFFFFF80",
  },
  dotOn: { backgroundColor: COLORS.white, borderColor: COLORS.white },

  error: { fontSize: 13, fontWeight: "700", color: "#FFD9D9", textAlign: "center", minHeight: 34 },
  errorHidden: { opacity: 0 },

  // The gate keypad is built for a light card; on this backdrop it needs its
  // own surface rather than floating on the gradient.
  pad: {
    width: "100%",
    maxWidth: 340,
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    padding: SPACING.sm,
  },

  biometric: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.sm,
    backgroundColor: "#FFFFFF2E",
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.md,
    paddingVertical: 12,
  },
  biometricText: { color: COLORS.white, fontSize: 15, fontWeight: "800" },

  escape: {
    color: "#FFFFFFC0",
    fontSize: 13,
    fontWeight: "700",
    textDecorationLine: "underline",
    marginTop: SPACING.xs,
  },
});
