import { Feather } from "@expo/vector-icons";
import { useCallback, useEffect, useState } from "react";
import { Pressable, StyleSheet, Switch, Text, TextInput, View } from "react-native";
import { COLORS, RADIUS, SHADOW, SPACING, TINT } from "../../constants/theme";
import { authApi } from "../../src/api/auth.api";
import { ApiError, NetworkError } from "../../src/api/types";
import { useAppSelector } from "../../src/store";
import { MPIN_LENGTH, enable, forget, getUnlockState, type UnlockState } from "./unlock";

/**
 * Turning quick sign-in on, from Profile.
 *
 * The password is asked for again rather than kept from the last sign-in. Two
 * reasons: the app genuinely does not have it — nothing holds it after login —
 * and re-entering it is the right price for enabling a four-digit shortcut to
 * the same account.
 *
 * It is verified against the server before anything is stored, so a typo cannot
 * enrol credentials that will fail tomorrow morning at the gate.
 */
export default function QuickSignInCard() {
  const user = useAppSelector((s) => s.auth.user);
  const [state, setState] = useState<UnlockState | null>(null);
  const [open, setOpen] = useState(false);

  const [password, setPassword] = useState("");
  const [pin, setPin] = useState("");
  const [confirm, setConfirm] = useState("");
  const [useBiometric, setUseBiometric] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<string | null>(null);

  const read = useCallback(() => {
    getUnlockState().then(setState).catch(() => setState(null));
  }, []);

  useEffect(read, [read]);

  // `username` accepts an email, an employee code or a mobile number, so
  // whichever claim the token carries is a valid one to store.
  const identifier = user?.emailId ?? user?.employeeCode ?? "";

  const reset = () => {
    setPassword("");
    setPin("");
    setConfirm("");
    setError(null);
  };

  const submit = async () => {
    setError(null);

    if (!identifier) return setError("This account has no username the app can sign in with.");
    if (pin.length !== MPIN_LENGTH) return setError(`The MPIN must be ${MPIN_LENGTH} digits.`);
    if (pin !== confirm) return setError("The two MPINs do not match.");
    // Four identical or four consecutive digits are the pins a stranger tries
    // first, and they are no faster to type than any other four.
    if (/^(\d)\1+$/.test(pin)) return setError("Pick an MPIN that is not the same digit four times.");

    setBusy(true);
    try {
      // Prove the password before storing it.
      await authApi.login({ username: identifier, password });
      await enable({ identifier, password, name: user?.name ?? "" }, pin, useBiometric);
      reset();
      setOpen(false);
      setDone("Quick sign-in is on. Next time, four digits.");
      read();
    } catch (e) {
      setError(
        e instanceof ApiError || e instanceof NetworkError
          ? e.message
          : "Could not set this up. Please try again.",
      );
    } finally {
      setBusy(false);
    }
  };

  const turnOff = async () => {
    await forget();
    setDone("Quick sign-in is off. Your password is no longer stored on this phone.");
    read();
  };

  if (!state) return null;

  return (
    <View style={styles.card}>
      <View style={styles.head}>
        <View style={styles.icon}>
          <Feather name="unlock" size={15} color={COLORS.primary} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>Quick sign-in</Text>
          <Text style={styles.sub}>
            {state.enrolled
              ? `MPIN${state.biometricEnabled ? ` and ${state.biometricLabel}` : ""} on this phone`
              : state.biometricAvailable
                ? `${MPIN_LENGTH}-digit MPIN or ${state.biometricLabel}, instead of your password`
                : `A ${MPIN_LENGTH}-digit MPIN instead of your password`}
          </Text>
        </View>

        {state.enrolled ? (
          <Pressable style={styles.off} onPress={turnOff}>
            <Text style={styles.offText}>TURN OFF</Text>
          </Pressable>
        ) : (
          <Pressable style={styles.on} onPress={() => setOpen((o) => !o)}>
            <Text style={styles.onText}>{open ? "CANCEL" : "SET UP"}</Text>
          </Pressable>
        )}
      </View>

      {!!done && !open && <Text style={styles.done}>{done}</Text>}

      {open && !state.enrolled && (
        <View style={styles.form}>
          <Text style={styles.note}>
            Your password is kept in this phone's secure keystore so the app can sign you in
            again. Five wrong MPINs erase it.
          </Text>

          <Field
            label="Your password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            autoCapitalize="none"
          />
          <Field
            label={`New ${MPIN_LENGTH}-digit MPIN`}
            value={pin}
            onChangeText={setPin}
            secureTextEntry
            keyboardType="number-pad"
            maxLength={MPIN_LENGTH}
          />
          <Field
            label="Confirm MPIN"
            value={confirm}
            onChangeText={setConfirm}
            secureTextEntry
            keyboardType="number-pad"
            maxLength={MPIN_LENGTH}
          />

          {state.biometricAvailable && (
            <View style={styles.switchRow}>
              <Text style={styles.switchLabel}>Also use {state.biometricLabel}</Text>
              <Switch
                value={useBiometric}
                onValueChange={setUseBiometric}
                trackColor={{ true: COLORS.primary }}
              />
            </View>
          )}

          {!!error && <Text style={styles.error}>{error}</Text>}

          <Pressable
            style={({ pressed }) => [styles.save, (pressed || busy) && styles.savePressed]}
            disabled={busy}
            onPress={submit}
          >
            <Text style={styles.saveText}>{busy ? "CHECKING…" : "TURN ON"}</Text>
          </Pressable>
        </View>
      )}
    </View>
  );
}

function Field({ label, ...input }: { label: string } & React.ComponentProps<typeof TextInput>) {
  return (
    <View style={{ gap: 4 }}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput style={styles.input} placeholderTextColor={COLORS.textMuted} {...input} />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.md,
    gap: SPACING.sm,
    ...SHADOW.card,
  },
  head: { flexDirection: "row", alignItems: "center", gap: SPACING.sm },
  icon: {
    width: 30,
    height: 30,
    borderRadius: 8,
    backgroundColor: COLORS.primary + "14",
    alignItems: "center",
    justifyContent: "center",
  },
  title: { fontSize: 14, fontWeight: "900", color: COLORS.text },
  sub: { fontSize: 11, color: COLORS.textMuted, marginTop: 1 },

  on: {
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.sm,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 8,
  },
  onText: { color: COLORS.white, fontSize: 11, fontWeight: "900", letterSpacing: 0.5 },
  off: {
    borderWidth: 1,
    borderColor: COLORS.danger + "55",
    backgroundColor: TINT.danger,
    borderRadius: RADIUS.sm,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 8,
  },
  offText: { color: COLORS.danger, fontSize: 11, fontWeight: "900", letterSpacing: 0.5 },

  done: { fontSize: 12, color: COLORS.success, fontWeight: "700" },

  form: { gap: SPACING.sm, borderTopWidth: 1, borderTopColor: COLORS.border, paddingTop: SPACING.sm },
  note: { fontSize: 11, color: COLORS.textMuted, lineHeight: 16 },
  fieldLabel: { fontSize: 10, fontWeight: "900", letterSpacing: 0.8, color: COLORS.textMuted },
  input: {
    height: 46,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surfaceAlt,
    paddingHorizontal: SPACING.md,
    fontSize: 16,
    color: COLORS.text,
  },

  switchRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  switchLabel: { fontSize: 13, fontWeight: "700", color: COLORS.text },

  error: { fontSize: 12, color: COLORS.danger, fontWeight: "700" },

  save: {
    height: 48,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  savePressed: { backgroundColor: COLORS.primaryDark },
  saveText: { color: COLORS.white, fontSize: 14, fontWeight: "900", letterSpacing: 1 },
});
