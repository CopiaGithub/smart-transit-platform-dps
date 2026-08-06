import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import Constants from "expo-constants";
import { LinearGradient } from "expo-linear-gradient";
import { useFormik } from "formik";
import { useEffect, useRef, useState } from "react";
import {
  Animated,
  Easing,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Yup from "yup";
import AppButton from "../../components/AppButton";
import { LABELS } from "../../constants/domain";
import { COLORS, GRADIENT, RADIUS, SPACING } from "../../constants/theme";
import { useAppDispatch, useAppSelector } from "../../src/store";
import { login } from "../../src/store/auth.slice";

const schema = Yup.object({
  identifier: Yup.string().trim().required("Enter your username or mobile number"),
  password: Yup.string().min(4, "At least 4 characters").required("Password is required"),
});

/**
 * Three fields, no choices. Role and gate belong to the user record, so a
 * guard cannot sign in as the wrong post or at the wrong gate.
 */
export default function LoginScreen() {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const dispatch = useAppDispatch();
  const { status, error } = useAppSelector((s) => s.auth);

  const form = useFormik({
    initialValues: { identifier: "", password: "" },
    validationSchema: schema,
    // No navigation here: the token landing in the store swaps Login for the
    // drawer on its own, and a failure is read back from auth.error.
    onSubmit: (values) => void dispatch(login(values)),
  });

  const entrance = useEntrance();

  return (
    <View style={styles.root}>
      {/* Backdrop: one gradient plus two soft orbs. Purely decorative and
          non-interactive, so it never steals a touch from the form. */}
      <LinearGradient
        colors={GRADIENT.brandWide}
        start={{ x: 0.05, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.backdrop}
        pointerEvents="none"
      >
        <View style={[styles.orb, styles.orbOne]} />
        <View style={[styles.orb, styles.orbTwo]} />
      </LinearGradient>

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          contentContainerStyle={[
            styles.scroll,
            { paddingTop: insets.top + SPACING.xl * 1.5, paddingBottom: insets.bottom + SPACING.lg },
          ]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Animated.View
            style={[
              // Tablets get a centred column instead of a stretched card.
              { width: "100%", maxWidth: 460, alignSelf: "center" },
              width >= 768 && { paddingHorizontal: SPACING.lg },
              entrance,
            ]}
          >
            <View style={styles.hero}>
              <View style={styles.logo}>
                <MaterialCommunityIcons name="bus" size={32} color={COLORS.white} />
              </View>
              <Text style={styles.brand}>{LABELS.app}</Text>
              <Text style={styles.tagline}>{LABELS.school}</Text>
            </View>

            <View style={styles.card}>
              <View style={styles.cardHead}>
                <Text style={styles.heading}>Sign in</Text>
                <Text style={styles.headingSub}>
                  Your screen opens on whatever your post is
                </Text>
              </View>

              <Field
                label="USERNAME OR MOBILE NUMBER"
                icon="user"
                value={form.values.identifier}
                onChangeText={form.handleChange("identifier")}
                onBlur={form.handleBlur("identifier")}
                error={form.touched.identifier ? form.errors.identifier : undefined}
                autoCapitalize="none"
                autoCorrect={false}
                placeholder="Enter username or mobile"
                returnKeyType="next"
              />

              <Field
                label="PASSWORD"
                icon="lock"
                value={form.values.password}
                onChangeText={form.handleChange("password")}
                onBlur={form.handleBlur("password")}
                error={form.touched.password ? form.errors.password : undefined}
                secureTextEntry
                placeholder="Enter password"
                returnKeyType="go"
                onSubmitEditing={() => form.handleSubmit()}
              />

              {!!error && (
                <View style={styles.alert}>
                  <Feather name="alert-circle" size={16} color={COLORS.danger} />
                  <Text style={styles.alertText}>{error}</Text>
                </View>
              )}

              <View style={styles.cta}>
                <AppButton
                  title="Sign in"
                  onPress={form.handleSubmit}
                  loading={status === "loading"}
                />
              </View>
            </View>
          </Animated.View>

          <View style={styles.flex} />

          <Text style={styles.version}>
            {LABELS.app} · v{Constants.expoConfig?.version}
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

/** Fade + rise once on mount. Native driver, so it costs nothing on the JS thread. */
function useEntrance() {
  const value = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(value, {
      toValue: 1,
      duration: 520,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [value]);

  return {
    opacity: value,
    transform: [{ translateY: value.interpolate({ inputRange: [0, 1], outputRange: [22, 0] }) }],
  };
}

function Field({
  label,
  icon,
  error,
  ...input
}: React.ComponentProps<typeof TextInput> & {
  label: string;
  icon: React.ComponentProps<typeof Feather>["name"];
  error?: string;
}) {
  const [focused, setFocused] = useState(false);
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(anim, {
      toValue: focused ? 1 : 0,
      duration: 170,
      easing: Easing.out(Easing.quad),
      // Colour cannot animate on the native driver; one input at a time is cheap.
      useNativeDriver: false,
    }).start();
  }, [focused, anim]);

  const borderColor = error
    ? COLORS.danger
    : anim.interpolate({ inputRange: [0, 1], outputRange: [COLORS.border, GRADIENT.brand[1]] });

  return (
    <View style={styles.field}>
      <Text style={styles.cap}>{label}</Text>

      <Animated.View
        style={[
          styles.inputRow,
          { borderColor },
          focused && !error && styles.inputRowFocused,
          !!error && styles.inputRowError,
        ]}
      >
        <Feather
          name={icon}
          size={18}
          color={error ? COLORS.danger : focused ? GRADIENT.brand[1] : COLORS.textMuted}
        />
        <TextInput
          style={styles.input}
          placeholderTextColor={COLORS.textMuted}
          selectionColor={GRADIENT.brand[1]}
          {...input}
          // Wrapped, never replaced: Formik still gets its blur for `touched`.
          onFocus={(e) => {
            setFocused(true);
            input.onFocus?.(e);
          }}
          onBlur={(e) => {
            setFocused(false);
            input.onBlur?.(e);
          }}
        />
      </Animated.View>

      {!!error && <Text style={styles.error}>{error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.screenBg },
  flex: { flex: 1 },

  // ── backdrop ──────────────────────────────────────────────────────────
  backdrop: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: "56%",
    borderBottomLeftRadius: 40,
    borderBottomRightRadius: 40,
    overflow: "hidden",
  },
  orb: { position: "absolute", borderRadius: 999, backgroundColor: COLORS.white },
  orbOne: { width: 260, height: 260, top: -90, right: -70, opacity: 0.09 },
  orbTwo: { width: 190, height: 190, top: 110, left: -80, opacity: 0.07 },

  scroll: { flexGrow: 1, paddingHorizontal: SPACING.md },

  // ── hero ──────────────────────────────────────────────────────────────
  hero: { alignItems: "center", marginBottom: SPACING.xl },
  logo: {
    width: 72,
    height: 72,
    borderRadius: 22,
    // Glass card: translucent, so it carries no elevation by design.
    backgroundColor: "#FFFFFF2E",
    borderWidth: 1,
    borderColor: "#FFFFFF4D",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: SPACING.md,
  },
  brand: {
    color: COLORS.white,
    fontSize: 26,
    fontWeight: "800",
    letterSpacing: -0.4,
    textAlign: "center",
  },
  tagline: {
    color: COLORS.white,
    opacity: 0.82,
    fontSize: 14,
    fontWeight: "500",
    letterSpacing: 0.4,
    marginTop: SPACING.xs + 2,
  },

  // ── card ──────────────────────────────────────────────────────────────
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: 28,
    padding: SPACING.lg,
    gap: SPACING.md + 4,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: COLORS.border,
    shadowColor: GRADIENT.brand[0],
    shadowOpacity: 0.16,
    shadowRadius: 28,
    shadowOffset: { width: 0, height: 14 },
    elevation: 8,
  },
  cardHead: { gap: SPACING.xs },
  heading: { fontSize: 24, fontWeight: "800", color: COLORS.text, letterSpacing: -0.4 },
  headingSub: { fontSize: 14, fontWeight: "400", color: COLORS.textMuted, lineHeight: 20 },

  // ── fields ────────────────────────────────────────────────────────────
  field: { gap: SPACING.xs + 2 },
  cap: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.9,
    color: COLORS.textMuted,
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.sm + 2,
    height: 56,
    borderWidth: 1.5,
    borderRadius: RADIUS.md + 4,
    paddingHorizontal: SPACING.md,
    backgroundColor: COLORS.surfaceAlt,
  },
  inputRowFocused: { backgroundColor: COLORS.surface },
  inputRowError: { backgroundColor: COLORS.surface },
  input: { flex: 1, color: COLORS.text, fontSize: 16, fontWeight: "500", padding: 0 },
  error: { color: COLORS.danger, fontSize: 12, fontWeight: "600" },

  // ── feedback + cta ────────────────────────────────────────────────────
  alert: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.sm,
    backgroundColor: "#FEF2F2",
    borderWidth: 1,
    borderColor: "#FECACA",
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm + 2,
  },
  alertText: { flex: 1, color: COLORS.danger, fontSize: 13, fontWeight: "600", lineHeight: 18 },
  cta: { marginTop: SPACING.xs },

  version: {
    fontSize: 11,
    fontWeight: "500",
    color: COLORS.textMuted,
    textAlign: "center",
    letterSpacing: 0.3,
    marginTop: SPACING.lg,
  },
});
