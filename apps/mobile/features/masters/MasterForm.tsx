import { Feather } from "@expo/vector-icons";
import { useFormik } from "formik";
import { useMemo, useState, type ReactNode } from "react";
import {
  KeyboardAvoidingView,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import * as Yup from "yup";
import { askConfirm } from "../../components/ConfirmHost";
import { LABELS } from "../../constants/domain";
import { COLORS, RADIUS, SHADOW, SPACING, TINT } from "../../constants/theme";
import {
  BUS_TYPE,
  SERVICE_STATUS,
  type BusMaster,
  type PlatformMaster,
  type RouteMaster,
  type UserMaster,
} from "../../src/api/masters.api";
import {
  removeBus,
  removePlatform,
  removeRoute,
  removeUser,
  saveBus,
  savePlatform,
  saveRoute,
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

/** IsActive on every master reads the same way, so it is worded the same way. */
const IN_USE_OPTIONS = [
  { value: true, label: "In use" },
  { value: false, label: "Out of use" },
];

/**
 * The delete confirmations, in one place.
 *
 * A record can now be deleted from its row in the list as well as from inside
 * the edit sheet. Two buttons that do the same irreversible thing must ask the
 * same question — if the wording drifts, one of them is lying about what it does.
 */
export const DELETE_PROMPT = {
  bus: (b: BusMaster) => ({
    title: `Delete ${LABELS.vehicle.toLowerCase()} ${b.BusNumber}?`,
    message: "It is hidden from every list but kept so past dispersal reports still make sense.",
    confirm: "Delete",
  }),
  user: (u: UserMaster) => ({
    title: `Remove ${u.Name}?`,
    message: "They can no longer sign in. Past records are kept.",
    confirm: "Remove",
  }),
  route: (r: RouteMaster) => ({
    title: `Delete ${r.RouteName}?`,
    message:
      `It is hidden from every list but kept, so past dispersal reports still make sense. ` +
      `${LABELS.vehiclePlural} already on this route keep it until you move them.`,
    confirm: "Delete",
  }),
  platform: (p: PlatformMaster) => ({
    title: `Delete ${LABELS.slot.toLowerCase()} ${p.PlatformNumber}?`,
    message:
      "It stops being handed out but is kept, so past dispersal reports still make sense. " +
      "To close it only for today, set it to Out of use instead.",
    confirm: "Delete",
  }),
};

/** Cancel first, destructive second — the order both platforms expect. */
export function askDelete(
  prompt: { title: string; message: string; confirm: string },
  run: () => void,
) {
  askConfirm({
    title: prompt.title,
    message: prompt.message,
    confirmText: prompt.confirm,
    tone: "danger",
    icon: "trash-2",
    onConfirm: run,
  });
}

// ── bus ─────────────────────────────────────────────────────────────────────
export function BusForm({ editing, onClose }: { editing: Editing<BusMaster>; onClose: () => void }) {
  const dispatch = useAppDispatch();
  const allRoutes = useAppSelector(selectRoutes);
  const saving = useAppSelector((s) => s.masters.saving);
  const bus = editing?.row ?? null;

  // Retired routes are not offered — but the one this bus is already on stays on
  // the list even after it retires. Dropping it would show the bus as having no
  // route and quietly blank the field on the next save.
  const routes = useMemo(
    () => allRoutes.filter((r) => r.IsActive || r.Id === bus?.RouteId),
    [allRoutes, bus?.RouteId],
  );

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
      // Required so every bus carries a contact the gate can reach when it breaks
      // down mid-dispersal (BusesMaster.DriverPhone). Nothing displays the number
      // yet, so a wrong one goes unnoticed — worth re-checking once the gate
      // console shows it and the number starts being used.
      driverName: Yup.string().trim().required("Driver name is required"),
      driverPhone: Yup.string()
        .trim()
        .required("Driver mobile is required")
        // Empty is left to `required` above, so only one message shows at a time.
        .test(
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

  const confirmDelete = () => {
    if (!bus) return;
    askDelete(DELETE_PROMPT.bus(bus), async () => {
      const result = await dispatch(removeBus(bus.Id));
      if (removeBus.fulfilled.match(result)) onClose();
    });
  };

  const outOfService = form.values.serviceStatus !== SERVICE_STATUS.inService;

  return (
    <Sheet
      visible={!!editing}
      title={bus ? `${LABELS.vehicle} ${bus.BusNumber}` : `New ${LABELS.vehicle.toLowerCase()}`}
      saving={saving}
      onClose={onClose}
      onSave={form.handleSubmit}
      onDelete={bus ? confirmDelete : undefined}
      invalid={form.submitCount > 0 && !form.isValid}
    >
      <Field
        required
        label={LABELS.vehicleNo.toUpperCase()}
        info={
          `The number a guard types at the entry gate and the number the LED board ` +
          `shows. This is what identifies the bus everywhere in the app — not the ` +
          `registration plate below.`
        }
        value={form.values.busNumber}
        onChangeText={form.handleChange("busNumber")}
        onBlur={form.handleBlur("busNumber")}
        error={form.touched.busNumber ? form.errors.busNumber : undefined}
        maxLength={20}
      />
      {/* Deliberately not the gate identifier — that is the bus number above. */}
      <Field
        label="REGISTRATION NUMBER"
        info="The RTO plate. A fleet record only — it is never used to identify a bus at the gate or on the board."
        value={form.values.registrationNumber}
        onChangeText={form.handleChange("registrationNumber")}
        autoCapitalize="characters"
        maxLength={20}
      />

      <Select
        label={LABELS.route.toUpperCase()}
        info={
          `The route this bus normally runs — it is what the board prints beside the ` +
          `bus number. Routes marked out of use are not offered here, except the one ` +
          `this bus is already on.`
        }
        value={form.values.routeId}
        options={[
          { value: null, label: "None" },
          ...routes.map((r) => ({ value: r.Id as number | null, label: r.RouteName })),
        ]}
        onPick={(v) => form.setFieldValue("routeId", v)}
      />

      <Select
        label="TYPE"
        info={
          `Reserve buses stand by to replace a bus that does not run. They are listed ` +
          `separately at the entry gate, carry letter codes like R1, and keep the ` +
          `station of the bus they replace. Everything else is Active.`
        }
        value={form.values.busType}
        options={[
          { value: BUS_TYPE.active as string, label: "Active" },
          { value: BUS_TYPE.reserve as string, label: "Reserve" },
        ]}
        onPick={(v) => form.setFieldValue("busType", v)}
      />

      <Select
        label="SERVICE STATUS"
        info={
          `A temporary problem — the bus is expected back. Maintenance and Breakdown ` +
          `both ask for a reason. For a bus that is gone for good, use Fleet status at ` +
          `the bottom instead.`
        }
        value={form.values.serviceStatus}
        options={SERVICE_OPTIONS.map((o) => ({ value: o.value as string, label: o.label }))}
        onPick={(v) => form.setFieldValue("serviceStatus", v)}
      />

      {outOfService && (
        <Field
          required
          label="WHY IT IS OFF THE ROAD"
          value={form.values.outOfServiceReason}
          onChangeText={form.handleChange("outOfServiceReason")}
          onBlur={form.handleBlur("outOfServiceReason")}
          error={form.touched.outOfServiceReason ? form.errors.outOfServiceReason : undefined}
        />
      )}

      <Field
        label="CAPACITY"
        value={form.values.capacity}
        onChangeText={form.handleChange("capacity")}
        onBlur={form.handleBlur("capacity")}
        error={form.touched.capacity ? form.errors.capacity : undefined}
        keyboardType="number-pad"
        maxLength={3}
      />
      <Field
        required
        label="DRIVER NAME"
        value={form.values.driverName}
        onChangeText={form.handleChange("driverName")}
        onBlur={form.handleBlur("driverName")}
        error={form.touched.driverName ? form.errors.driverName : undefined}
      />
      <Field
        required
        label="DRIVER MOBILE"
        value={form.values.driverPhone}
        onChangeText={form.handleChange("driverPhone")}
        onBlur={form.handleBlur("driverPhone")}
        error={form.touched.driverPhone ? form.errors.driverPhone : undefined}
        keyboardType="number-pad"
        maxLength={10}
      />

      <Select
        label="FLEET STATUS"
        info="Out of use means the bus is off the road permanently and is refused at the gate. For a temporary problem use Service status instead."
        value={form.values.isActive}
        options={IN_USE_OPTIONS}
        onPick={(v) => form.setFieldValue("isActive", v)}
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
      // All three are usernames at sign-in — the server ORs them (AuthService:
      // EmailId == username || EmployeeCode == username || Contact == username).
      // Code and mobile are required by policy so every account has a handle to
      // type; email is left optional because not every driver or guard has one.
      employeeCode: Yup.string().trim().required("Employee code is required"),
      contact: Yup.string()
        .trim()
        .required("Mobile number is required")
        // Empty is left to `required` above, so only one message shows at a time.
        .test(
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

  const confirmDelete = () => {
    if (!user) return;
    askDelete(DELETE_PROMPT.user(user), async () => {
      const result = await dispatch(removeUser(user.Id));
      if (removeUser.fulfilled.match(result)) onClose();
    });
  };

  return (
    <Sheet
      visible={!!editing}
      title={user ? user.Name : "New user"}
      saving={saving}
      onClose={onClose}
      onSave={form.handleSubmit}
      onDelete={user ? confirmDelete : undefined}
      invalid={form.submitCount > 0 && !form.isValid}
    >
      <Field
        required
        label="NAME"
        value={form.values.name}
        onChangeText={form.handleChange("name")}
        onBlur={form.handleBlur("name")}
        error={form.touched.name ? form.errors.name : undefined}
      />

      <Select
        required
        label="ROLE"
        info={
          `Decides what this person sees when they open the app. A guard's post is part ` +
          `of the role name — "Gate 6 Operator" lands on the entry gate screen — so ` +
          `there is no separate gate to set here.`
        }
        value={form.values.roleId}
        options={roles.map((r) => ({ value: r.Id as number | null, label: r.RoleName }))}
        onPick={(v) => form.setFieldValue("roleId", v)}
        error={form.touched.roleId ? (form.errors.roleId as string | undefined) : undefined}
      />

      {/* Any of these three can be used as the username at sign-in (§3.2). */}
      <Field
        required
        label="EMPLOYEE CODE"
        info={
          `The employee code, mobile number and email are all usernames — this person ` +
          `can sign in with whichever of the three they remember. Email is the only one ` +
          `that may be left blank.`
        }
        value={form.values.employeeCode}
        onChangeText={form.handleChange("employeeCode")}
        onBlur={form.handleBlur("employeeCode")}
        error={form.touched.employeeCode ? form.errors.employeeCode : undefined}
        autoCapitalize="characters"
      />
      <Field
        required
        label="MOBILE NUMBER"
        value={form.values.contact}
        onChangeText={form.handleChange("contact")}
        onBlur={form.handleBlur("contact")}
        error={form.touched.contact ? form.errors.contact : undefined}
        keyboardType="number-pad"
        maxLength={10}
      />
      <Field
        label="EMAIL"
        value={form.values.emailId}
        onChangeText={form.handleChange("emailId")}
        onBlur={form.handleBlur("emailId")}
        error={form.touched.emailId ? form.errors.emailId : undefined}
        autoCapitalize="none"
        keyboardType="email-address"
      />

      {!user && (
        <Field
          required
          label="TEMPORARY PASSWORD"
          info="Given to them once, changed on first sign-in."
          value={form.values.password}
          onChangeText={form.handleChange("password")}
          onBlur={form.handleBlur("password")}
          error={form.touched.password ? form.errors.password : undefined}
          secureTextEntry
        />
      )}

      <Select
        label="SIGN-IN ACCESS"
        info="Blocked deactivates the account without deleting their history."
        value={form.values.isActive}
        options={[
          { value: true, label: "Allowed" },
          { value: false, label: "Blocked" },
        ]}
        onPick={(v) => form.setFieldValue("isActive", v)}
      />
    </Sheet>
  );
}

// ── platform ────────────────────────────────────────────────────────────────
/**
 * The screen the whole allocation order hangs off.
 *
 * Two numbers live here and they are deliberately not the same one. The platform
 * number is painted on the ground and a child is told to walk to it, so it never
 * moves. The allocation order is what the server hands buses out by, lowest
 * first — and because the compound fills from the exit end, platform 23 normally
 * carries order 1. Closing a platform for repair changes the order, or switches
 * the platform off; neither needs anything repainted.
 */
export function PlatformForm({
  editing,
  onClose,
}: {
  editing: Editing<PlatformMaster>;
  onClose: () => void;
}) {
  const dispatch = useAppDispatch();
  const saving = useAppSelector((s) => s.masters.saving);
  const platform = editing?.row ?? null;

  const form = useFormik({
    enableReinitialize: true,
    initialValues: {
      platformNumber: platform ? String(platform.PlatformNumber) : "",
      platformName: platform?.PlatformName ?? "",
      sortOrder: platform ? String(platform.SortOrder) : "",
      side: platform?.Side ?? null,
      isActive: platform?.IsActive ?? true,
    },
    validationSchema: Yup.object({
      platformNumber: Yup.string()
        .trim()
        .required("Platform number is required")
        .test("positive", "Must be a number above zero", (v) => Number(v) > 0),
      sortOrder: Yup.string()
        .trim()
        .required("Allocation order is required")
        .test("positive", "Must be a number above zero", (v) => Number(v) > 0),
    }),
    onSubmit: async (v) => {
      const result = await dispatch(
        savePlatform({
          id: platform?.Id,
          body: {
            platformNumber: Number(v.platformNumber),
            platformName: v.platformName.trim() || null,
            sortOrder: Number(v.sortOrder),
            side: v.side,
            isActive: v.isActive,
          },
        }),
      );
      if (savePlatform.fulfilled.match(result)) onClose();
    },
  });

  const confirmDelete = () => {
    if (!platform) return;
    askDelete(DELETE_PROMPT.platform(platform), async () => {
      const result = await dispatch(removePlatform(platform.Id));
      if (removePlatform.fulfilled.match(result)) onClose();
    });
  };

  return (
    <Sheet
      visible={!!editing}
      title={
        platform
          ? `${LABELS.slot} ${String(platform.PlatformNumber).padStart(2, "0")}`
          : `New ${LABELS.slot.toLowerCase()}`
      }
      saving={saving}
      onClose={onClose}
      onSave={form.handleSubmit}
      onDelete={platform ? confirmDelete : undefined}
      invalid={form.submitCount > 0 && !form.isValid}
    >
      <Field
        required
        label="PLATFORM NUMBER (PAINTED ON THE GROUND)"
        info={
          `Fixed — a child is told to walk to it and the LED board prints it. This is ` +
          `not the order buses are handed platforms in; that is the next field.`
        }
        value={form.values.platformNumber}
        onChangeText={form.handleChange("platformNumber")}
        onBlur={form.handleBlur("platformNumber")}
        error={form.touched.platformNumber ? form.errors.platformNumber : undefined}
        keyboardType="number-pad"
        maxLength={3}
      />

      <Field
        required
        label="ALLOCATION ORDER"
        info={
          `Buses are given the lowest free number here, not the lowest platform. The yard ` +
          `fills from the exit end, so ${LABELS.slot.toLowerCase()} 23 is normally 1. Change ` +
          `this to move a ${LABELS.slot.toLowerCase()} earlier or later in the queue — ` +
          `nothing gets repainted.`
        }
        value={form.values.sortOrder}
        onChangeText={form.handleChange("sortOrder")}
        onBlur={form.handleBlur("sortOrder")}
        error={form.touched.sortOrder ? form.errors.sortOrder : undefined}
        keyboardType="number-pad"
        maxLength={3}
      />

      <Field
        label="NAME"
        info={
          `A label for staff — it shows in this list and on the yard map instead of ` +
          `"${LABELS.slot} 23". The LED board and the children still go by the number.`
        }
        value={form.values.platformName}
        onChangeText={form.handleChange("platformName")}
        maxLength={50}
      />

      {/* ponytail: side hidden on request — restore the Select to bring it back.
          `side` stays in the form values and in the payload, so a platform that
          already has Left or Right keeps it through an edit. */}

      <Select
        label="STATUS"
        info="Out of use while it is blocked or under repair. It is skipped when a bus is given a platform, and any bus already standing on it stays put."
        value={form.values.isActive}
        options={IN_USE_OPTIONS}
        onPick={(v) => form.setFieldValue("isActive", v)}
      />
    </Sheet>
  );
}

// ── route ───────────────────────────────────────────────────────────────────
export function RouteForm({
  editing,
  onClose,
}: {
  editing: Editing<RouteMaster>;
  onClose: () => void;
}) {
  const dispatch = useAppDispatch();
  const saving = useAppSelector((s) => s.masters.saving);
  const route = editing?.row ?? null;

  const form = useFormik({
    enableReinitialize: true,
    initialValues: {
      routeName: route?.RouteName ?? "",
      routeCode: route?.RouteCode ?? "",
      ledDisplayName: route?.LedDisplayName ?? "",
      isActive: route?.IsActive ?? true,
    },
    validationSchema: Yup.object({
      routeName: Yup.string().trim().required("Route name is required").max(100, "Too long"),
    }),
    onSubmit: async (v) => {
      const result = await dispatch(
        saveRoute({
          id: route?.Id,
          body: {
            routeName: v.routeName.trim(),
            routeCode: v.routeCode.trim() || null,
            ledDisplayName: v.ledDisplayName.trim() || null,
            isActive: v.isActive,
          },
        }),
      );
      if (saveRoute.fulfilled.match(result)) onClose();
    },
  });

  const confirmDelete = () => {
    if (!route) return;
    askDelete(DELETE_PROMPT.route(route), async () => {
      const result = await dispatch(removeRoute(route.Id));
      if (removeRoute.fulfilled.match(result)) onClose();
    });
  };

  return (
    <Sheet
      visible={!!editing}
      title={route ? route.RouteName : `New ${LABELS.route.toLowerCase()}`}
      saving={saving}
      onClose={onClose}
      onSave={form.handleSubmit}
      onDelete={route ? confirmDelete : undefined}
      invalid={form.submitCount > 0 && !form.isValid}
    >
      <Field
        required
        label={`${LABELS.route.toUpperCase()} NAME`}
        value={form.values.routeName}
        onChangeText={form.handleChange("routeName")}
        onBlur={form.handleBlur("routeName")}
        error={form.touched.routeName ? form.errors.routeName : undefined}
        maxLength={100}
      />

      <Field
        label="CODE"
        info="A short tag for staff — it is the badge in this list and it can be searched on. It is not what the LED board prints; that is the next field."
        value={form.values.routeCode}
        onChangeText={form.handleChange("routeCode")}
        autoCapitalize="characters"
        maxLength={20}
      />

      <Field
        label="LED BOARD NAME"
        info="The short form the LED wall shows. Left blank, the wall falls back to the full route name — which is usually too long to read across the compound."
        value={form.values.ledDisplayName}
        onChangeText={form.handleChange("ledDisplayName")}
        autoCapitalize="characters"
        maxLength={50}
      />

      <Select
        label="STATUS"
        info="Out of use for a route the school has stopped running. It disappears from the pickers but stays on past records."
        value={form.values.isActive}
        options={IN_USE_OPTIONS}
        onPick={(v) => form.setFieldValue("isActive", v)}
      />
    </Sheet>
  );
}

// ── shared chrome ───────────────────────────────────────────────────────────
function Sheet({
  visible,
  title,
  saving,
  invalid,
  children,
  onClose,
  onSave,
  onDelete,
}: {
  visible: boolean;
  title: string;
  saving: boolean;
  /** A rejected Save. The field that failed is usually scrolled out of sight. */
  invalid?: boolean;
  children: ReactNode;
  onClose: () => void;
  onSave: () => void;
  onDelete?: () => void;
}) {
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      {/* See LoginScreen: `padding` on Android as well, because edge-to-edge
          stopped the window resizing under the keyboard and this sheet sits on
          the bottom edge, where every field is the bottom-most one. */}
      <KeyboardAvoidingView
        style={{ flex: 1, justifyContent: "flex-end" }}
        behavior="padding"
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

          {invalid && (
            <Text style={styles.formError}>
              Fill the fields marked <Text style={styles.req}>*</Text> — scroll up to the ones in
              red.
            </Text>
          )}

          <View style={styles.actions}>
            <Pressable style={[styles.btn, styles.btnGhost]} onPress={onClose} disabled={saving}>
              <Text style={styles.btnGhostText}>Cancel</Text>
            </Pressable>
            <Pressable
              style={[styles.btn, styles.btnPrimary, saving && styles.btnOff]}
              onPress={onSave}
              disabled={saving}
            >
              <Feather name="check" size={16} color={COLORS.white} />
              <Text style={styles.btnPrimaryText}>{saving ? "Saving…" : "Save"}</Text>
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

/**
 * No placeholders on any master form. A sample value sitting in an empty box
 * reads as a real one — an admin cannot tell an untouched New form from a
 * filled-in edit at a glance, and grey text is not the difference they notice.
 * The sheet title is what says which one it is. Explain a field with `info`.
 */
function Field({
  label,
  info,
  error,
  required,
  ...input
}: React.ComponentProps<typeof TextInput> & {
  label: string;
  info?: string;
  error?: string;
  required?: boolean;
}) {
  return (
    <View style={styles.field}>
      <Label text={label} info={info} required={required} />
      <TextInput style={[styles.input, !!error && styles.inputBad]} {...input} />
      {!!error && <Text style={styles.error}>{error}</Text>}
    </View>
  );
}

/**
 * One row, one list. Replaces the chip strip the masters used to carry: chips
 * wrapped onto three lines as soon as a school had more than a handful of
 * routes, which is most of the height an admin was scrolling past.
 */
function Select<T extends string | number | boolean | null>({
  label,
  info,
  value,
  options,
  onPick,
  error,
  required,
}: {
  label: string;
  info?: string;
  value: T;
  options: { value: T; label: string }[];
  onPick: (value: T) => void;
  error?: string;
  required?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const current = options.find((o) => o.value === value);

  return (
    <View style={styles.field}>
      <Label text={label} info={info} required={required} />

      <Pressable
        style={({ pressed }) => [
          styles.input,
          styles.selectRow,
          !!error && styles.inputBad,
          pressed && styles.selectPressed,
        ]}
        onPress={() => setOpen(true)}
        accessibilityRole="button"
        accessibilityLabel={`${label}: ${current?.label ?? "not set"}`}
      >
        <Text style={[styles.selectText, !current && styles.selectPlaceholder]} numberOfLines={1}>
          {current?.label ?? "Select"}
        </Text>
        <Feather name="chevron-down" size={17} color={COLORS.textMuted} />
      </Pressable>

      {!!error && <Text style={styles.error}>{error}</Text>}

      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <Pressable style={styles.backdrop} onPress={() => setOpen(false)}>
          <Pressable style={styles.popup} onPress={() => {}}>
            <Text style={styles.cap}>{label}</Text>
            {/* Long lists — routes on a big school — must not run off the screen. */}
            <ScrollView style={{ maxHeight: 360 }} keyboardShouldPersistTaps="handled">
              {options.map((o) => {
                const on = o.value === value;
                return (
                  <Pressable
                    key={String(o.value)}
                    style={({ pressed }) => [
                      styles.option,
                      on && styles.optionOn,
                      pressed && styles.optionOn,
                    ]}
                    onPress={() => {
                      onPick(o.value);
                      setOpen(false);
                    }}
                  >
                    <Text style={[styles.optionText, on && styles.optionTextOn]}>{o.label}</Text>
                    {on && <Feather name="check" size={18} color={COLORS.primary} />}
                  </Pressable>
                );
              })}
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

/**
 * `required` is the only mandatory marker on these forms — an optional field
 * carries nothing at all. Saying "(optional)" in the label as well would be the
 * same fact told twice, and the two drift apart the first time one is edited.
 */
function Label({ text, info, required }: { text: string; info?: string; required?: boolean }) {
  return (
    <View style={styles.labelRow}>
      <Text style={styles.cap}>
        {text}
        {required && (
          <Text style={styles.req} accessibilityLabel="required">
            {" *"}
          </Text>
        )}
      </Text>
      {!!info && <Info text={info} />}
    </View>
  );
}

/**
 * The explanation a field needs but not on every glance. These used to sit
 * under the field as a permanent paragraph — four lines of text an admin reads
 * once and then scrolls past every time after that.
 */
function Info({ text }: { text: string }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Pressable onPress={() => setOpen(true)} hitSlop={12} accessibilityRole="button">
        <Feather name="info" size={13} color={COLORS.textMuted} />
      </Pressable>

      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <Pressable style={styles.backdrop} onPress={() => setOpen(false)}>
          <Pressable style={styles.popup} onPress={() => {}}>
            <Text style={styles.infoText}>{text}</Text>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  sheet: {
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: RADIUS.xl,
    borderTopRightRadius: RADIUS.xl,
    paddingTop: SPACING.sm,
    paddingBottom: SPACING.lg,
    maxHeight: "92%",
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
  sheetBody: { padding: SPACING.md, gap: SPACING.sm },

  field: { gap: 2 },
  labelRow: { flexDirection: "row", alignItems: "center", gap: SPACING.xs },
  cap: { fontSize: 10, fontWeight: "900", letterSpacing: 1.2, color: COLORS.textMuted },
  input: {
    height: 38,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.sm + 2,
    // Android gives a TextInput its own vertical padding on top of the height,
    // which clips the text once the box is this short.
    paddingVertical: 0,
    fontSize: 14,
    color: COLORS.text,
    backgroundColor: COLORS.surface,
  },
  req: { color: COLORS.danger, fontWeight: "900" },
  inputBad: { borderColor: COLORS.danger, backgroundColor: TINT.danger },
  error: { color: COLORS.danger, fontSize: 12, fontWeight: "600" },
  formError: {
    color: COLORS.danger,
    fontSize: 12,
    fontWeight: "700",
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.xs,
  },

  // Reads as an input rather than a button: it holds a value, and lining it up
  // with the text fields is what keeps the form from looking like two forms.
  selectRow: { flexDirection: "row", alignItems: "center", gap: SPACING.sm },
  selectPressed: { backgroundColor: COLORS.surfaceAlt },
  selectText: { flex: 1, fontSize: 14, color: COLORS.text },
  selectPlaceholder: { color: COLORS.textMuted },

  backdrop: {
    flex: 1,
    backgroundColor: "#0F172A99",
    justifyContent: "center",
    padding: SPACING.lg,
  },
  popup: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    gap: SPACING.xs,
    ...SHADOW.lifted,
  },
  infoText: { fontSize: 14, color: COLORS.text, lineHeight: 21 },
  option: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.sm,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: SPACING.md,
    paddingVertical: 12,
    marginTop: SPACING.xs,
  },
  optionOn: { borderColor: COLORS.primary, backgroundColor: COLORS.surfaceAlt },
  optionText: { flex: 1, fontSize: 16, fontWeight: "700", color: COLORS.text },
  optionTextOn: { color: COLORS.primary },

  actions: {
    flexDirection: "row",
    gap: SPACING.sm,
    // Lines up with the fields above, which now sit on SPACING.md.
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: COLORS.border,
  },
  btn: {
    flex: 1,
    // Same 38 as `input`, on purpose: the buttons sit directly under a column
    // of fields, so a different height reads as a different kind of control.
    height: 38,
    borderRadius: RADIUS.md,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: SPACING.xs,
  },
  btnGhost: { borderWidth: 1, borderColor: COLORS.border },
  btnGhostText: { color: COLORS.textMuted, fontWeight: "700", fontSize: 14 },
  btnPrimary: { backgroundColor: COLORS.primary, flex: 1.6 },
  btnOff: { opacity: 0.5 },
  btnPrimaryText: { color: COLORS.white, fontWeight: "800", fontSize: 14 },
});
