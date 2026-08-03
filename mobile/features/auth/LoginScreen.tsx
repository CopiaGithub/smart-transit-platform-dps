import { Feather } from "@expo/vector-icons";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { LinearGradient } from "expo-linear-gradient";
import { useFormik } from "formik";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Yup from "yup";
import AppButton from "../../components/AppButton";
import { COLORS, RADIUS, SHADOW, SPACING } from "../../constants/theme";
import type { RootStackParamList } from "../../navigation/types";
import { login } from "../../src/store/auth.slice";
import { useAppDispatch, useAppSelector } from "../../src/store";

const schema = Yup.object({
  username: Yup.string().trim().required("Username is required"),
  password: Yup.string().min(4, "At least 4 characters").required("Password is required"),
});

// Which post the operator is signing in for — drives what the drawer shows.
const POSTS = [
  { role: "operator", label: "Gate In", icon: "log-in" },
  { role: "exit", label: "Gate Out", icon: "log-out" },
  { role: "admin", label: "Admin", icon: "shield" },
] as const;

type Props = NativeStackScreenProps<RootStackParamList, "Login">;

export default function LoginScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const dispatch = useAppDispatch();
  const { status, error } = useAppSelector((s) => s.auth);

  const form = useFormik({
    initialValues: { username: "", password: "", role: "operator" as string },
    validationSchema: schema,
    onSubmit: async (values) => {
      await dispatch(login(values)).unwrap();
      navigation.reset({ index: 0, routes: [{ name: "Main" }] });
    },
  });

  return (
    <View style={styles.root}>
      <LinearGradient
        colors={[COLORS.primary, COLORS.primaryDark]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.hero, { paddingTop: insets.top + SPACING.xl }]}
      >
        <View style={styles.logo}>
          <Feather name="navigation" size={26} color={COLORS.white} />
        </View>
        <Text style={styles.brand}>Transit Display</Text>
        <Text style={styles.tagline}>Station allocation & boarding control</Text>
      </LinearGradient>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.formWrap}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.card}>
            <Text style={styles.heading}>Sign in</Text>

            <Text style={styles.label}>Post</Text>
            <View style={styles.posts}>
              {POSTS.map((p) => {
                const on = form.values.role === p.role;
                return (
                  <Pressable
                    key={p.role}
                    style={[styles.post, on && styles.postOn]}
                    onPress={() => form.setFieldValue("role", p.role)}
                  >
                    <Feather
                      name={p.icon}
                      size={16}
                      color={on ? COLORS.white : COLORS.textMuted}
                    />
                    <Text style={[styles.postText, on && styles.postTextOn]}>
                      {p.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            <Field
              label="Username"
              icon="user"
              value={form.values.username}
              onChangeText={form.handleChange("username")}
              onBlur={form.handleBlur("username")}
              error={form.touched.username ? form.errors.username : undefined}
              autoCapitalize="none"
              placeholder="e.g. gate6.security"
            />
            <Field
              label="Password"
              icon="lock"
              value={form.values.password}
              onChangeText={form.handleChange("password")}
              onBlur={form.handleBlur("password")}
              error={form.touched.password ? form.errors.password : undefined}
              secureTextEntry
              placeholder="••••••"
            />

            {!!error && <Text style={styles.formError}>{error}</Text>}

            <AppButton
              title="Sign in"
              onPress={form.handleSubmit}
              loading={status === "loading"}
            />
            <Text style={styles.hint}>
              Prototype build — any username with a 4+ character password works.
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
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
    <View style={{ gap: SPACING.xs }}>
      <Text style={styles.label}>{label}</Text>
      <View style={[styles.inputRow, !!error && { borderColor: COLORS.danger }]}>
        <Feather name={icon} size={17} color={COLORS.textMuted} />
        <TextInput
          style={styles.input}
          placeholderTextColor={COLORS.textMuted}
          {...input}
        />
      </View>
      {!!error && <Text style={styles.error}>{error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.screenBg },
  hero: {
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.xl * 2,
    alignItems: "flex-start",
  },
  logo: {
    width: 52,
    height: 52,
    borderRadius: RADIUS.lg,
    backgroundColor: "#FFFFFF26",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: SPACING.md,
  },
  brand: { color: COLORS.white, fontSize: 26, fontWeight: "900" },
  tagline: { color: COLORS.white, opacity: 0.8, fontSize: 13, marginTop: 2 },

  formWrap: { padding: SPACING.md, marginTop: -SPACING.xl * 1.5 },
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.xl,
    padding: SPACING.lg,
    gap: SPACING.md,
    ...SHADOW.lifted,
  },
  heading: { fontSize: 20, fontWeight: "900", color: COLORS.text },

  posts: { flexDirection: "row", gap: SPACING.sm },
  post: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
    height: 42,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surfaceAlt,
  },
  postOn: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  postText: { fontSize: 12, fontWeight: "700", color: COLORS.textMuted },
  postTextOn: { color: COLORS.white },

  label: { fontSize: 12, fontWeight: "700", color: COLORS.textMuted },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.sm,
    height: 50,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.md,
    backgroundColor: COLORS.surface,
  },
  input: { flex: 1, color: COLORS.text, fontSize: 15 },
  error: { color: COLORS.danger, fontSize: 12 },
  formError: { color: COLORS.danger, fontSize: 13, textAlign: "center" },
  hint: { fontSize: 11, color: COLORS.textMuted, textAlign: "center" },
});
