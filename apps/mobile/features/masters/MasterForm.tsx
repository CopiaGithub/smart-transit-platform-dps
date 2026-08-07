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
import { LABELS } from "../../constants/domain";
import { COLORS, RADIUS, SHADOW, SPACING, TINT } from "../../constants/theme";
import {
  BUS_TYPE,
  SERVICE_STATUS,
  type BusMaster,
  type UserMaster,
} from "../../src/api/masters.api";
import {
  removeBus,
  removeUser,
  saveBus,
  saveUser,
  selectRoles,
  selectRoutes,
} from "../../src/store/masters.slice";
import { useAppDispatch, useAppSelector } from "../../src/store";

/** null = closed, row null = adding a new one. */
export type Editing<T> = { row: T | null } | null;

const SERVICE_OPTIONS = [
  { value: SERVICE_STATUS.inService, label: "In service" },
  { value: SERVICE_STATUS.maintenance, label: "Maintenance" },
  { value: SERVICE_STATUS.breakdown, label: "Breakdown" },
];

// ── bus ─────────────────────────────────────────────────────────────────────
export function BusForm({ editing, onClose }: { editing: Editing<BusMaster>; onClose: () => void }) {
  const dispatch = useAppDispatch();
  const routes = useAppSelector(selectRoutes);
  const saving = useAppSelector((s) => s.masters.saving);
  const bus = editing?.row ?? null;

  const form = useFormik({
    enableReinitialize: true,
    initialValues: {
      busNumber: bus?.BusNumber ?? "",
      registrationNumber: bus?.RegistrationNumber ?? "",
      routeId: bus?.RouteId ?? null,
      busType: bus?.BusType ?? BUS_TYPE.active,
      serviceStatus: bus?.ServiceStatus ?? SERVICE_STATUS.inService,
      outOfServiceReason: bus?.OutOfServiceReason ?? "",
      capacity: bus?.Capacity ? String(bus.Capacity) : "",
      driverName: bus?.DriverName ?? "",
      driverPhone: bus?.DriverPhone ?? "",
      isActive: bus?.IsActive ?? true,
    },
    validationSchema: Yup.object({
      // Uniqueness is not checked here: the server owns that index and answers
      // authoritatively. Guessing locally would only disagree with it.
      busNumber: Yup.string().trim().required("Bus number is required").max(20, "Too long"),
      capacity: Yup.string().test(
        "positive",
        "Capacity must be greater than zero",
        (v) => !v?.trim() || Number(v) > 0,
      ),
      driverPhone: Yup.string().test(
        "mobile",
        "Enter the 10-digit mobile number",
        (v) => !v?.trim() || /^\d{10}$/.test(v.trim()),
      ),
      outOfServiceReason: Yup.string().when("serviceStatus", {
        is: (s: string) => s !== SERVICE_STATUS.inService,
        then: (s) => s.trim().required("Say why the bus is off the road"),
      }),
    }),
    onSubmit: async (v) => {
      const result = await dispatch(
        saveBus({
          id: bus?.Id,
          body: {
            busNumber: v.busNumber.trim(),
            registrationNumber: v.registrationNumber.trim() || null,
            routeId: v.routeId,
            busType: v.busType,
            serviceStatus: v.serviceStatus,
            outOfServiceReason:
              v.serviceStatus === SERVICE_STATUS.inService ? null : v.outOfServiceReason.trim(),
            capacity: v.capacity.trim() ? Number(v.capacity) : null,
            driverName: v.driverName.trim() || null,
            driverPhone: v.driverPhone.trim() || null,
            isActive: v.isActive,
          },
        }),
      );
      if (saveBus.fulfilled.match(result)) onClose();
    },
  });

  const confirmDelete = () =>
    Alert.alert(
      `Delete ${LABELS.vehicle.toLowerCase()} ${bus?.BusNumber}?`,
      "It is hidden from every list but kept so past dispersal reports still make sense.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            if (!bus) return;
            const result = await dispatch(removeBus(bus.Id));
            if (removeBus.fulfilled.match(result)) onClose();
          },
        },
      ],
    );

  const outOfService = form.values.serviceStatus !== SERVICE_STATUS.inService;

  return (
    <Sheet
      visible={!!editing}
      title={bus ? `${LABELS.vehicle} ${bus.BusNumber}` : `New ${LABELS.vehicle.toLowerCase()}`}
      saving={saving}
      onClose={onClose}
      onSave={form.handleSubmit}
      onDelete={bus ? confirmDelete : undefined}
    >
      <Field
        label={LABELS.vehicleNo.toUpperCase()}
        value={form.values.busNumber}
        onChangeText={form.handleChange("busNumber")}
        onBlur={form.handleBlur("busNumber")}
        error={form.touched.busNumber ? form.errors.busNumber : undefined}
        placeholder="24"
        maxLength={20}
      />
      {/* Deliberately not the gate identifier — that is the bus number above. */}
      <Field
        label="REGISTRATION NUMBER (OPTIONAL)"
        value={form.values.registrationNumber}
        onChangeText={form.handleChange("registrationNumber")}
        placeholder="MH-43-AB-1234"
        autoCapitalize="characters"
        maxLength={20}
      />

      <Chips
        label={LABELS.route.toUpperCase()}
        value={form.values.routeId}
        options={[
          { value: null, label: "None" },
          ...routes.map((r) => ({ value: r.Id as number | null, label: r.RouteName })),
        ]}
        onPick={(v) => form.setFieldValue("routeId", v)}
      />

      <Chips
        label="TYPE"
        value={form.values.busType}
        options={[
          { value: BUS_TYPE.active, label: "Active" },
          { value: BUS_TYPE.reserve, label: "Reserve" },
        ]}
        onPick={(v) => form.setFieldValue("busType", v)}
      />

      <Chips
        label="SERVICE STATUS"
        value={form.values.serviceStatus}
        options={SERVICE_OPTIONS.map((o) => ({ value: o.value as string, label: o.label }))}
        onPick={(v) => form.setFieldValue("serviceStatus", v)}
      />

      {outOfService && (
        <Field
          label="WHY IT IS OFF THE ROAD"
          value={form.values.outOfServiceReason}
          onChangeText={form.handleChange("outOfServiceReason")}
          onBlur={form.handleBlur("outOfServiceReason")}
          error={form.touched.outOfServiceReason ? form.errors.outOfServiceReason : undefined}
          placeholder="Gearbox failure"
        />
      )}

      <Field
        label="CAPACITY"
        value={form.values.capacity}
        onChangeText={form.handleChange("capacity")}
        onBlur={form.handleBlur("capacity")}
        error={form.touched.capacity ? form.errors.capacity : undefined}
        placeholder="40"
        keyboardType="number-pad"
        maxLength={3}
      />
      <Field
        label="DRIVER NAME"
        value={form.values.driverName}
        onChangeText={form.handleChange("driverName")}
        placeholder="R. Shinde"
      />
      <Field
        label="DRIVER MOBILE"
        value={form.values.driverPhone}
        onChangeText={form.handleChange("driverPhone")}
        onBlur={form.handleBlur("driverPhone")}
        error={form.touched.driverPhone ? form.errors.driverPhone : undefined}
        placeholder="9820011000"
        keyboardType="number-pad"
        maxLength={10}
      />

      <Toggle
        label="On the fleet"
        hint="Clear this while the bus is off the road permanently. An inactive bus is refused at the gate."
        value={form.values.isActive}
        onChange={(v) => form.setFieldValue("isActive", v)}
      />
    </Sheet>
  );
}

// ── user ────────────────────────────────────────────────────────────────────
export function UserForm({
  editing,
  onClose,
}: {
  editing: Editing<UserMaster>;
  onClose: () => void;
}) {
  const dispatch = useAppDispatch();
  const roles = useAppSelector(selectRoles);
  const saving = useAppSelector((s) => s.masters.saving);
  const user = editing?.row ?? null;

  const form = useFormik({
    enableReinitialize: true,
    initialValues: {
      name: user?.Name ?? "",
      employeeCode: user?.EmployeeCode ?? "",
      contact: user?.Contact ?? "",
      emailId: user?.EmailId ?? "",
      password: "",
      roleId: user?.RoleId ?? null,
      isActive: user?.IsActive ?? true,
    },
    validationSchema: Yup.object({
      name: Yup.string().trim().required("Name is required"),
      contact: Yup.string().test(
        "mobile",
        "Enter the 10-digit mobile number",
        (v) => !v?.trim() || /^\d{10}$/.test(v.trim()),
      ),
      emailId: Yup.string().test(
        "email",
        "Enter a valid email address",
        (v) => !v?.trim() || /^\S+@\S+\.\S+$/.test(v.trim()),
      ),
      roleId: Yup.number().nullable().required("Pick a role — it decides what they can do"),
      // Only on create: an existing user's password is changed by them, not here.
      password: Yup.string().when([], {
        is: () => !user,
        then: (s) => s.min(8, "At least 8 characters").required("Set a temporary password"),
      }),
    }),
    onSubmit: async (v) => {
      const result = await dispatch(
        saveUser({
          id: user?.Id,
          body: {
            name: v.name.trim(),
            employeeCode: v.employeeCode.trim() || null,
            contact: v.contact.trim() || null,
            emailId: v.emailId.trim() || null,
            roleId: v.roleId,
            isActive: v.isActive,
            ...(user ? {} : { password: v.password }),
          },
        }),
      );
      if (saveUser.fulfilled.match(result)) onClose();
    },
  });

  const confirmDelete = () =>
    Alert.alert(`Remove ${user?.Name}?`, "They can no longer sign in. Past records are kept.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Remove",
        style: "destructive",
        onPress: async () => {
          if (!user) return;
          const result = await dispatch(removeUser(user.Id));
          if (removeUser.fulfilled.match(result)) onClose();
        },
      },
    ]);

  return (
    <Sheet
      visible={!!editing}
      title={user ? user.Name : "New user"}
      saving={saving}
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
      {/* Any of these three can be used as the username at sign-in (§3.2). */}
      <Field
        label="EMPLOYEE CODE"
        value={form.values.employeeCode}
        onChangeText={form.handleChange("employeeCode")}
        placeholder="EMP009"
        autoCapitalize="characters"
      />
      <Field
        label="MOBILE NUMBER"
        value={form.values.contact}
        onChangeText={form.handleChange("contact")}
        onBlur={form.handleBlur("contact")}
        error={form.touched.contact ? form.errors.contact : undefined}
        placeholder="9820000009"
        keyboardType="number-pad"
        maxLength={10}
      />
      <Field
        label="EMAIL"
        value={form.values.emailId}
        onChangeText={form.handleChange("emailId")}
        onBlur={form.handleBlur("emailId")}
        error={form.touched.emailId ? form.errors.emailId : undefined}
        placeholder="name@dpsnerul.edu"
        autoCapitalize="none"
        keyboardType="email-address"
      />

      {!user && (
        <Field
          label="TEMPORARY PASSWORD"
          value={form.values.password}
          onChangeText={form.handleChange("password")}
          onBlur={form.handleBlur("password")}
          error={form.touched.password ? form.errors.password : undefined}
          placeholder="Given to them once, changed on first sign-in"
          secureTextEntry
        />
      )}

      <Chips
        label="ROLE"
        value={form.values.roleId}
        options={roles.map((r) => ({ value: r.Id as number | null, label: r.RoleName }))}
        onPick={(v) => form.setFieldValue("roleId", v)}
        error={form.touched.roleId ? (form.errors.roleId as string | undefined) : undefined}
      />

      <Toggle
        label="Can sign in"
        hint="Clear this to deactivate the account without deleting their history."
        value={form.values.isActive}
        onChange={(v) => form.setFieldValue("isActive", v)}
      />
    </Sheet>
  );
}

// ── shared chrome ───────────────────────────────────────────────────────────
function Sheet({
  visible,
  title,
  saving,
  children,
  onClose,
  onSave,
  onDelete,
}: {
  visible: boolean;
  title: string;
  saving: boolean;
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
              <Pressable onPress={onDelete} hitSlop={10} disabled={saving}>
                <Feather name="trash-2" size={20} color={COLORS.danger} />
              </Pressable>
            )}
          </View>

          <ScrollView contentContainerStyle={styles.sheetBody} keyboardShouldPersistTaps="handled">
            {children}
          </ScrollView>

          <View style={styles.actions}>
            <Pressable style={[styles.btn, styles.btnGhost]} onPress={onClose} disabled={saving}>
              <Text style={styles.btnGhostText}>Cancel</Text>
            </Pressable>
            <Pressable
              style={[styles.btn, styles.btnPrimary, saving && styles.btnOff]}
              onPress={onSave}
              disabled={saving}
            >
              <Feather name="check" size={18} color={COLORS.white} />
              <Text style={styles.btnPrimaryText}>{saving ? "Saving…" : "Save"}</Text>
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
  return (
    <View style={styles.field}>
      <Text style={styles.cap}>{label}</Text>
      <TextInput
        style={[styles.input, !!error && styles.inputBad]}
        placeholderTextColor={COLORS.textMuted}
        {...input}
      />
      {!!error && <Text style={styles.error}>{error}</Text>}
    </View>
  );
}

function Chips<T extends string | number | null>({
  label,
  value,
  options,
  onPick,
  error,
}: {
  label: string;
  value: T;
  options: { value: T; label: string }[];
  onPick: (value: T) => void;
  error?: string;
}) {
  return (
    <View style={styles.field}>
      <Text style={styles.cap}>{label}</Text>
      <View style={styles.chips}>
        {options.map((o) => {
          const on = value === o.value;
          return (
            <Pressable
              key={String(o.value)}
              style={[styles.chip, on && styles.chipOn]}
              onPress={() => onPick(o.value)}
            >
              <Text style={[styles.chipText, on && styles.chipTextOn]}>{o.label}</Text>
            </Pressable>
          );
        })}
      </View>
      {!!error && <Text style={styles.error}>{error}</Text>}
    </View>
  );
}

function Toggle({
  label,
  hint,
  value,
  onChange,
}: {
  label: string;
  hint: string;
  value: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <View style={styles.switchRow}>
      <View style={{ flex: 1 }}>
        <Text style={styles.switchLabel}>{label}</Text>
        <Text style={styles.switchHint}>{hint}</Text>
      </View>
      <Switch
        value={value}
        onValueChange={onChange}
        trackColor={{ true: COLORS.primary, false: COLORS.border }}
      />
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
  inputBad: { borderColor: COLORS.danger, backgroundColor: TINT.danger },
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
  btnOff: { opacity: 0.5 },
  btnPrimaryText: { color: COLORS.white, fontWeight: "800", fontSize: 16 },
});
