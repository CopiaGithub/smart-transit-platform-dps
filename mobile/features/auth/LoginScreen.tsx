import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useFormik } from "formik";
import {
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Yup from "yup";
import AppButton from "../../components/AppButton";
import { COLORS, RADIUS, SPACING } from "../../constants/theme";
import type { RootStackParamList } from "../../navigation/types";
import { login } from "../../src/store/auth.slice";
import { useAppDispatch, useAppSelector } from "../../src/store";

const schema = Yup.object({
  username: Yup.string().trim().required("Username is required"),
  password: Yup.string().min(4, "At least 4 characters").required("Password is required"),
});

type Props = NativeStackScreenProps<RootStackParamList, "Login">;

export default function LoginScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const dispatch = useAppDispatch();
  const { status, error } = useAppSelector((s) => s.auth);

  const form = useFormik({
    initialValues: { username: "", password: "" },
    validationSchema: schema,
    onSubmit: async (values) => {
      await dispatch(login(values)).unwrap();
      navigation.reset({ index: 0, routes: [{ name: "Main" }] });
    },
  });

  return (
    <KeyboardAvoidingView
      style={[styles.root, { paddingTop: insets.top + SPACING.xl }]}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <Text style={styles.heading}>Sign in</Text>
      <Text style={styles.sub}>Use your site operator account</Text>

      <View style={styles.form}>
        <Field
          label="Username"
          value={form.values.username}
          onChangeText={form.handleChange("username")}
          onBlur={form.handleBlur("username")}
          error={form.touched.username ? form.errors.username : undefined}
          autoCapitalize="none"
        />
        <Field
          label="Password"
          value={form.values.password}
          onChangeText={form.handleChange("password")}
          onBlur={form.handleBlur("password")}
          error={form.touched.password ? form.errors.password : undefined}
          secureTextEntry
        />
        {!!error && <Text style={styles.formError}>{error}</Text>}
        <AppButton
          title="Sign in"
          onPress={form.handleSubmit}
          loading={status === "loading"}
        />
      </View>
    </KeyboardAvoidingView>
  );
}

function Field({
  label,
  error,
  ...input
}: React.ComponentProps<typeof TextInput> & { label: string; error?: string }) {
  return (
    <View style={{ gap: SPACING.xs }}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        style={[styles.input, !!error && { borderColor: COLORS.danger }]}
        placeholderTextColor={COLORS.textMuted}
        {...input}
      />
      {!!error && <Text style={styles.error}>{error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.screenBg, padding: SPACING.lg },
  heading: { fontSize: 26, fontWeight: "800", color: COLORS.text },
  sub: { color: COLORS.textMuted, marginTop: SPACING.xs },
  form: { marginTop: SPACING.xl, gap: SPACING.md },
  label: { fontSize: 13, fontWeight: "600", color: COLORS.text },
  input: {
    height: 48,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.md,
    backgroundColor: COLORS.surface,
    color: COLORS.text,
  },
  error: { color: COLORS.danger, fontSize: 12 },
  formError: { color: COLORS.danger, fontSize: 13, textAlign: "center" },
});
