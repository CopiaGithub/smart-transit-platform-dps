import { Feather } from "@expo/vector-icons";
import { useFormik } from "formik";
import type { ReactNode } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from "react-native";
import * as Yup from "yup";
import {
  GATES,
  LABELS,
  ROLES,
  ROLE_LABEL,
  type Role,
} from "../../constants/domain";
import { COLORS, RADIUS, SHADOW, SPACING } from "../../constants/theme";
import { isNoTaken } from "../../src/domain/allocation";
import type { Bus, Operator } from "../../src/data/seed";
import {
  removeBus,
  removeUser,
  saveBus,
  saveUser,
} from "../../src/store/operations.slice";
import { useAppDispatch, useAppSelector } from "../../src/store";

/** null = closed, undefined row = adding a new one. */
export type Editing<T> = { row: T | null } | null;

// ── bus ─────────────────────────────────────────────────────────────────────
export function BusForm({ editing, onClose }: { editing: Editing<Bus>; onClose: () => void }) {
  const dispatch = useAppDispatch();
  const fleet = useAppSelector((s) => s.ops.fleet);
  const bus = editing?.row ?? null;
  // A bus standing on a station is on the LED board right now.
  const live = !!bus?.status;

  const form = useFormik({
    enableReinitialize: true,
    initialValues: {
      no: bus?.no ?? "",
      route: bus?.route ?? "",
      reserve: bus?.reserve ?? false,
    },
    validationSchema: Yup.object({
      no: Yup.string()
        .trim()
        .required("Bus number is required")
        .matches(/^\d{1,3}$/, "Digits only — the gate keypad has no letters")
        .test("unique", "Another bus already has this number", (value) =>
          value ? !isNoTaken(fleet, value, bus?.id) : true,
        ),
      route: Yup.string().trim().required("Route is required"),
    }),
    onSubmit: (v) => {
      dispatch(saveBus({ id: bus?.id, no: v.no.trim(), route: v.route.trim(), reserve: v.reserve }));
      onClose();
    },
  });

  const confirmDelete = () =>
    Alert.alert(
      `Delete ${LABELS.vehicle.toLowerCase()} ${bus?.no}?`,
      "It disappears from the gate screens and today's board. This cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => {
            if (bus) dispatch(removeBus(bus.id));
            onClose();
          },
        },
      ],
    );

  return (
    <Sheet
      visible={!!editing}
      title={bus ? `${LABELS.vehicle} ${bus.no}` : `New ${LABELS.vehicle.toLowerCase()}`}
      onClose={onClose}
      onSave={form.handleSubmit}
      onDelete={bus && !live ? confirmDelete : undefined}
    >
      {live && (
        <View style={styles.notice}>
          <Feather name="alert-triangle" size={15} color={COLORS.warning} />
          <Text style={styles.noticeText}>
            On {LABELS.slot.toLowerCase()} {bus?.slot} right now — the number is locked and it
            cannot be deleted until it departs.
          </Text>
        </View>
      )}

      <Field
        label={LABELS.vehicleNo.toUpperCase()}
        value={form.values.no}
        onChangeText={form.handleChange("no")}
        onBlur={form.handleBlur("no")}
        error={form.touched.no ? form.errors.no : undefined}
        placeholder="24"
        keyboardType="number-pad"
        maxLength={3}
        editable={!live}
      />

      <Field
        label={LABELS.route.toUpperCase()}
        value={form.values.route}
        onChangeText={form.handleChange("route")}
        onBlur={form.handleBlur("route")}
        error={form.touched.route ? form.errors.route : undefined}
        placeholder="Nerul East – Sector 12"
      />

      <View style={styles.switchRow}>
        <View style={{ flex: 1 }}>
          <Text style={styles.switchLabel}>Reserve bus</Text>
          <Text style={styles.switchHint}>
            Kept spare to cover a breakdown, not on a route of its own
          </Text>
        </View>
        <Switch
          value={form.values.reserve}
          onValueChange={(v) => void form.setFieldValue("reserve", v)}
          trackColor={{ true: COLORS.primary, false: COLORS.border }}
        />
      </View>
    </Sheet>
  );
}

// ── user ────────────────────────────────────────────────────────────────────
export function UserForm({
  editing,
  onClose,
}: {
  editing: Editing<Operator>;
  onClose: () => void;
}) {
  const dispatch = useAppDispatch();
  const users = useAppSelector((s) => s.ops.users);
  const user = editing?.row ?? null;

  const form = useFormik({
    enableReinitialize: true,
    initialValues: {
      name: user?.name ?? "",
      username: user?.username ?? "",
      mobile: user?.mobile ?? "",
      role: user?.role ?? (ROLES.security as Role),
      gateId: user?.gateId ?? null,
    },
    validationSchema: Yup.object({
      name: Yup.string().trim().required("Name is required"),
      // Username and mobile are the sign-in credentials, so a duplicate would
      // hand one person another person's gate.
      username: Yup.string()
        .trim()
        .required("Username is required")
        .test("unique", "Someone already signs in with this username", (v) =>
          !users.some(
            (u) => u.id !== user?.id && u.username.toLowerCase() === (v ?? "").toLowerCase(),
          ),
        ),
      mobile: Yup.string()
        .trim()
        .matches(/^\d{10}$/, "Enter the 10-digit mobile number")
        .required("Mobile number is required")
        .test("unique", "Another user has this mobile number", (v) =>
          !users.some((u) => u.id !== user?.id && u.mobile === v),
        ),
      gateId: Yup.string()
        .nullable()
        .when("role", {
          is: ROLES.security,
          then: (s) => s.required("A guard must be posted to a gate"),
        }),
    }),
    onSubmit: (v) => {
      dispatch(
        saveUser({
          id: user?.id,
          name: v.name.trim(),
          username: v.username.trim(),
          mobile: v.mobile.trim(),
          role: v.role,
          gateId: v.gateId,
        }),
      );
      onClose();
    },
  });

  const confirmDelete = () =>
    Alert.alert(`Remove ${user?.name}?`, "They will no longer appear in the user list.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Remove",
        style: "destructive",
        onPress: () => {
          if (user) dispatch(removeUser(user.id));
          onClose();
        },
      },
    ]);

  return (
    <Sheet
      visible={!!editing}
      title={user ? user.name : "New user"}
      onClose={onClose}
      onSave={form.handleSubmit}
      onDelete={user ? confirmDelete : undefined}
    >
      <Field
        label="NAME"
        value={form.values.name}
        onChangeText={form.handleChange("name")}
        onBlur={form.handleBlur("name")}
        error={form.touched.name ? form.errors.name : undefined}
        placeholder="R. Kamble"
      />

      <Field
        label="USERNAME"
        value={form.values.username}
        onChangeText={form.handleChange("username")}
        onBlur={form.handleBlur("username")}
        error={form.touched.username ? form.errors.username : undefined}
        placeholder="kamble"
        autoCapitalize="none"
        autoCorrect={false}
      />

      <Field
        label="MOBILE NUMBER"
        value={form.values.mobile}
        onChangeText={form.handleChange("mobile")}
        onBlur={form.handleBlur("mobile")}
        error={form.touched.mobile ? form.errors.mobile : undefined}
        placeholder="9820011111"
        keyboardType="number-pad"
        maxLength={10}
      />

      <View style={styles.field}>
        <Text style={styles.cap}>ROLE</Text>
        <View style={styles.chips}>
          {(Object.values(ROLES) as Role[]).map((r) => {
            const on = form.values.role === r;
            return (
              <Pressable
                key={r}
                style={[styles.chip, on && styles.chipOn]}
                onPress={() => {
                  form.setFieldValue("role", r);
                  if (r !== ROLES.security) form.setFieldValue("gateId", null);
                }}
              >
                <Text style={[styles.chipText, on && styles.chipTextOn]}>{ROLE_LABEL[r]}</Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      {form.values.role === ROLES.security && (
        <View style={styles.field}>
          <Text style={styles.cap}>POSTED AT</Text>
          <View style={styles.chips}>
            {GATES.map((g) => {
              const on = form.values.gateId === g.id;
              return (
                <Pressable
                  key={g.id}
                  style={[styles.chip, on && styles.chipOn]}
                  onPress={() => form.setFieldValue("gateId", g.id)}
                >
                  <Text style={[styles.chipText, on && styles.chipTextOn]}>
                    {g.label} · {g.kind === "in" ? "Entry" : "Exit"}
                  </Text>
                </Pressable>
              );
            })}
          </View>
          {!!form.touched.gateId && !!form.errors.gateId && (
            <Text style={styles.error}>{form.errors.gateId}</Text>
          )}
        </View>
      )}
    </Sheet>
  );
}

// ── shared chrome ───────────────────────────────────────────────────────────
function Sheet({
  visible,
  title,
  children,
  onClose,
  onSave,
  onDelete,
}: {
  visible: boolean;
  title: string;
  children: ReactNode;
  onClose: () => void;
  onSave: () => void;
  onDelete?: () => void;
}) {
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={{ flex: 1, justifyContent: "flex-end" }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <Pressable style={{ flex: 1 }} onPress={onClose} />
        <View style={styles.sheet}>
          <View style={styles.grabber} />
          <View style={styles.sheetHead}>
            <Text style={styles.sheetTitle}>{title}</Text>
            {!!onDelete && (
              <Pressable onPress={onDelete} hitSlop={10}>
                <Feather name="trash-2" size={20} color={COLORS.danger} />
              </Pressable>
            )}
          </View>

          <ScrollView
            contentContainerStyle={styles.sheetBody}
            keyboardShouldPersistTaps="handled"
          >
            {children}
          </ScrollView>

          <View style={styles.actions}>
            <Pressable style={[styles.btn, styles.btnGhost]} onPress={onClose}>
              <Text style={styles.btnGhostText}>Cancel</Text>
            </Pressable>
            <Pressable style={[styles.btn, styles.btnPrimary]} onPress={onSave}>
              <Feather name="check" size={18} color={COLORS.white} />
              <Text style={styles.btnPrimaryText}>Save</Text>
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

function Field({
  label,
  error,
  ...input
}: React.ComponentProps<typeof TextInput> & { label: string; error?: string }) {
  const off = input.editable === false;
  return (
    <View style={styles.field}>
      <Text style={styles.cap}>{label}</Text>
      <TextInput
        style={[styles.input, !!error && styles.inputBad, off && styles.inputOff]}
        placeholderTextColor={COLORS.textMuted}
        {...input}
      />
      {!!error && <Text style={styles.error}>{error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  sheet: {
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: RADIUS.xl,
    borderTopRightRadius: RADIUS.xl,
    paddingTop: SPACING.sm,
    paddingBottom: SPACING.lg,
    maxHeight: "88%",
    ...SHADOW.lifted,
  },
  grabber: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: COLORS.border,
    alignSelf: "center",
  },
  sheetHead: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.sm,
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.md,
  },
  sheetTitle: { flex: 1, fontSize: 20, fontWeight: "900", color: COLORS.text },
  sheetBody: { padding: SPACING.lg, gap: SPACING.md },

  field: { gap: SPACING.xs },
  cap: { fontSize: 10, fontWeight: "900", letterSpacing: 1.2, color: COLORS.textMuted },
  input: {
    height: 52,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.md,
    fontSize: 15,
    color: COLORS.text,
    backgroundColor: COLORS.surface,
  },
  inputBad: { borderColor: COLORS.danger, backgroundColor: COLORS.danger + "08" },
  inputOff: { backgroundColor: COLORS.surfaceAlt, color: COLORS.textMuted },
  error: { color: COLORS.danger, fontSize: 12, fontWeight: "600" },

  chips: { flexDirection: "row", flexWrap: "wrap", gap: SPACING.sm },
  chip: {
    paddingHorizontal: SPACING.md,
    paddingVertical: 10,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surfaceAlt,
  },
  chipOn: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  chipText: { fontSize: 13, fontWeight: "700", color: COLORS.textMuted },
  chipTextOn: { color: COLORS.white },

  switchRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
  },
  switchLabel: { fontSize: 14, fontWeight: "800", color: COLORS.text },
  switchHint: { fontSize: 11, color: COLORS.textMuted, marginTop: 2, lineHeight: 15 },

  notice: {
    flexDirection: "row",
    gap: SPACING.sm,
    backgroundColor: COLORS.warning + "14",
    borderWidth: 1,
    borderColor: COLORS.warning + "44",
    borderRadius: RADIUS.md,
    padding: SPACING.md,
  },
  noticeText: { flex: 1, fontSize: 12, color: COLORS.text, lineHeight: 17 },

  actions: {
    flexDirection: "row",
    gap: SPACING.sm,
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: COLORS.border,
  },
  btn: {
    flex: 1,
    height: 52,
    borderRadius: RADIUS.md,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: SPACING.sm,
  },
  btnGhost: { borderWidth: 1, borderColor: COLORS.border },
  btnGhostText: { color: COLORS.textMuted, fontWeight: "700", fontSize: 15 },
  btnPrimary: { backgroundColor: COLORS.primary, flex: 1.6 },
  btnPrimaryText: { color: COLORS.white, fontWeight: "800", fontSize: 16 },
});
