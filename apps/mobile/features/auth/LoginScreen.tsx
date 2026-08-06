import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import Constants from "expo-constants";
import { LinearGradient } from "expo-linear-gradient";
import { useFormik } from "formik";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Yup from "yup";
import AppButton from "../../components/AppButton";
import { LABELS } from "../../constants/domain";
import { COLORS, RADIUS, SHADOW, SPACING } from "../../constants/theme";
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
  const dispatch = useAppDispatch();
  const { status, error } = useAppSelector((s) => s.auth);

  const form = useFormik({
    initialValues: { identifier: "", password: "" },
    validationSchema: schema,
    // No navigation here: the token landing in the store swaps Login for the
    // drawer on its own, and a failure is read back from auth.error.
    onSubmit: (values) => void dispatch(login(values)),
  });

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      {/* Hero lives inside the scroll view so the card can genuinely overlap
          it — a negative margin on the content container gets clipped. */}
      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        bounces={false}
      >
        <LinearGradient
          colors={[COLORS.primary, COLORS.primaryDark]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.hero, { paddingTop: insets.top + SPACING.xl }]}
        >
          <View style={styles.logo}>
            <MaterialCommunityIcons name="bus" size={30} color={COLORS.white} />
          </View>
          <Text style={styles.brand}>{LABELS.app}</Text>
          <Text style={styles.tagline}>{LABELS.school}</Text>
        </LinearGradient>

        <View style={styles.body}>
          <View style={styles.card}>
            <View>
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
              placeholder="1111111111"
            />
            <Field
              label="PASSWORD"
              icon="lock"
              value={form.values.password}
              onChangeText={form.handleChange("password")}
              onBlur={form.handleBlur("password")}
              error={form.touched.password ? form.errors.password : undefined}
              secureTextEntry
              placeholder="••••••"
            />

            {!!error && (
              <View style={styles.alert}>
                <Feather name="alert-circle" size={15} color={COLORS.danger} />
                <Text style={styles.alertText}>{error}</Text>
              </View>
            )}

            <View style={{ marginTop: SPACING.xs }}>
              <AppButton
                title="Sign in"
                onPress={form.handleSubmit}
                loading={status === "loading"}
              />
            </View>
          </View>

          {/* ponytail: demo directory — drop this block when real accounts exist. */}
          <View style={styles.demo}>
            <Text style={styles.demoCap}>DEMO LOGINS · ANY 4+ CHARACTER PASSWORD</Text>
            {[
              ["1111111111", "Gate 6 · Entry"],
              ["2222222222", "Teacher"],
              ["3333333333", "Gate 1 · Exit"],
              ["4444444444", "Admin"],
            ].map(([m, who]) => (
              <View key={m} style={styles.demoRow}>
                <Text style={styles.demoMobile}>{m}</Text>
                <Text style={styles.demoWho}>{who}</Text>
              </View>
            ))}
          </View>

          <Text style={styles.footer}>
            Prototype build · v{Constants.expoConfig?.version}
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
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
  return (
    <View style={styles.field}>
      <Text style={styles.cap}>{label}</Text>
      <View style={[styles.inputRow, !!error && styles.inputBad]}>
        <Feather name={icon} size={17} color={COLORS.textMuted} />
        <TextInput style={styles.input} placeholderTextColor={COLORS.textMuted} {...input} />
      </View>
      {!!error && <Text style={styles.error}>{error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.screenBg },
  scroll: { flexGrow: 1, paddingBottom: SPACING.xl },

  hero: {
    alignItems: "center",
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.xl * 2,
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
  brand: {
    color: COLORS.white,
    fontSize: 23,
    fontWeight: "900",
    letterSpacing: -0.3,
    textAlign: "center",
  },
  tagline: { color: COLORS.white, opacity: 0.75, fontSize: 13, marginTop: 4 },

  body: { paddingHorizontal: SPACING.md },
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.xl,
    padding: SPACING.lg,
    gap: SPACING.md,
    // Safe here: a normal child of the scroll content, not the container.
    marginTop: -SPACING.xl * 1.25,
    ...SHADOW.lifted,
  },
  heading: { fontSize: 22, fontWeight: "900", color: COLORS.text, letterSpacing: -0.2 },
  headingSub: { fontSize: 13, color: COLORS.textMuted, marginTop: 2 },

  field: { gap: SPACING.xs },
  cap: { fontSize: 10, fontWeight: "900", letterSpacing: 1.2, color: COLORS.textMuted },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.sm,
    height: 52,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.md,
    backgroundColor: COLORS.surface,
  },
  inputBad: { borderColor: COLORS.danger, backgroundColor: COLORS.danger + "08" },
  input: { flex: 1, color: COLORS.text, fontSize: 15 },
  error: { color: COLORS.danger, fontSize: 12, fontWeight: "600" },

  alert: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.sm,
    backgroundColor: COLORS.danger + "0F",
    borderWidth: 1,
    borderColor: COLORS.danger + "44",
    borderRadius: RADIUS.md,
    padding: SPACING.sm,
  },
  alertText: { flex: 1, color: COLORS.danger, fontSize: 13, fontWeight: "600" },

  demo: {
    marginTop: SPACING.md,
    backgroundColor: COLORS.surfaceAlt,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    gap: 6,
  },
  demoCap: {
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 1,
    color: COLORS.textMuted,
    marginBottom: 2,
  },
  demoRow: { flexDirection: "row", alignItems: "center" },
  demoMobile: { flex: 1, fontSize: 13, fontWeight: "800", color: COLORS.text, letterSpacing: 0.5 },
  demoWho: { fontSize: 11, fontWeight: "700", color: COLORS.primary },

  footer: {
    fontSize: 11,
    color: COLORS.textMuted,
    textAlign: "center",
    marginTop: SPACING.md,
  },
});
