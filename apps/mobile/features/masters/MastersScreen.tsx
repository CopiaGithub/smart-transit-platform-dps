import { Feather } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { LABELS } from "../../constants/domain";
import { COLORS, RADIUS, SHADOW, SPACING, TINT } from "../../constants/theme";
import {
  SERVICE_STATUS,
  type BusMaster,
  type PlatformMaster,
  type RouteMaster,
  type UserMaster,
} from "../../src/api/masters.api";
import {
  fetchBuses,
  fetchLookups,
  fetchPlatforms,
  fetchUsers,
  removeBus,
  removePlatform,
  removeRoute,
  removeUser,
  selectBusPage,
  selectPlatforms,
  selectRoutes,
  selectUserPage,
} from "../../src/store/masters.slice";
import { useAppDispatch, useAppSelector } from "../../src/store";
import {
  askDelete,
  BusForm,
  DELETE_PROMPT,
  PlatformForm,
  RouteForm,
  UserForm,
  type Editing,
} from "./MasterForm";

type Tab = "buses" | "users" | "routes" | "platforms";

/**
 * Modules 2 and 3 — the master lists the whole console reads from.
 *
 * Buses and users are paged on the server because they grow; routes and
 * platforms are short fixed lists held whole, so their search filters in memory.
 * That split is why the search box below reads two different ways.
 */
export default function MastersScreen() {
  const dispatch = useAppDispatch();
  const [tab, setTab] = useState<Tab>("buses");
  const [query, setQuery] = useState("");
  const [busEdit, setBusEdit] = useState<Editing<BusMaster>>(null);
  const [userEdit, setUserEdit] = useState<Editing<UserMaster>>(null);
  const [routeEdit, setRouteEdit] = useState<Editing<RouteMaster>>(null);
  const [platformEdit, setPlatformEdit] = useState<Editing<PlatformMaster>>(null);

  const buses = useAppSelector(selectBusPage);
  const users = useAppSelector(selectUserPage);
  const routes = useAppSelector(selectRoutes);
  const platforms = useAppSelector(selectPlatforms);
  const error = useAppSelector((s) => s.masters.error);

  const paged = tab === "buses" || tab === "users";

  // Picker options and the short lists — fetched once per visit, not per keystroke.
  useFocusEffect(
    useCallback(() => {
      dispatch(fetchLookups());
      dispatch(fetchPlatforms());
    }, [dispatch]),
  );

  // Search is the server's job for the paged lists (§3.3), so it is debounced
  // rather than filtered locally: the screen only ever holds one page of those.
  useEffect(() => {
    if (!paged) return;
    const term = query.trim() || undefined;
    const timer = setTimeout(() => {
      if (tab === "buses") dispatch(fetchBuses({ searchTerm: term }));
      else dispatch(fetchUsers({ searchTerm: term }));
    }, 300);
    return () => clearTimeout(timer);
  }, [dispatch, query, tab, paged]);

  const term = query.trim().toLowerCase();

  const shownRoutes = useMemo(
    () =>
      !term
        ? routes
        : routes.filter((r) =>
            [r.RouteName, r.RouteCode, r.LedDisplayName].some((f) =>
              f?.toLowerCase().includes(term),
            ),
          ),
    [routes, term],
  );

  // In allocation order, not platform order — this screen exists to manage that
  // order, so showing the list in any other sequence would hide the thing being
  // edited. PlatformNumber breaks ties so the list never jumps around.
  const shownPlatforms = useMemo(() => {
    const matched = !term
      ? platforms
      : platforms.filter(
          (p) =>
            String(p.PlatformNumber).includes(term) ||
            p.PlatformName?.toLowerCase().includes(term),
        );
    return [...matched].sort(
      (a, z) => a.SortOrder - z.SortOrder || a.PlatformNumber - z.PlatformNumber,
    );
  }, [platforms, term]);

  const counts: Record<Tab, number> = {
    buses: buses.total,
    users: users.total,
    routes: routes.length,
    platforms: platforms.length,
  };

  const TABS: { key: Tab; label: string }[] = [
    { key: "buses", label: LABELS.vehiclePlural },
    { key: "users", label: "Users" },
    { key: "routes", label: "Routes" },
    { key: "platforms", label: LABELS.slotPlural },
  ];

  const searchPlaceholder =
    tab === "buses"
      ? `Search ${LABELS.vehicleNo} or route`
      : tab === "users"
        ? "Search name or code"
        : tab === "routes"
          ? "Search route or code"
          : `Search ${LABELS.slot.toLowerCase()} number`;

  const addNew = () => {
    if (tab === "buses") setBusEdit({ row: null });
    else if (tab === "users") setUserEdit({ row: null });
    else if (tab === "routes") setRouteEdit({ row: null });
    else setPlatformEdit({ row: null });
  };

  return (
    <View style={styles.root}>
      <View style={styles.segment}>
        {TABS.map((t) => (
          <Pressable
            key={t.key}
            style={[styles.seg, tab === t.key && styles.segOn]}
            onPress={() => {
              setTab(t.key);
              setQuery("");
            }}
          >
            <Text
              style={[styles.segText, tab === t.key && styles.segTextOn]}
              numberOfLines={1}
            >
              {t.label}
            </Text>
            <Text style={[styles.segCount, tab === t.key && styles.segTextOn]}>
              {counts[t.key]}
            </Text>
          </Pressable>
        ))}
      </View>

      <View style={styles.search}>
        <Feather name="search" size={17} color={COLORS.textMuted} />
        <TextInput
          style={styles.searchInput}
          placeholder={searchPlaceholder}
          placeholderTextColor={COLORS.textMuted}
          value={query}
          onChangeText={setQuery}
          autoCorrect={false}
        />
        {paged && (tab === "buses" ? buses.loading : users.loading) ? (
          <ActivityIndicator size="small" color={COLORS.textMuted} />
        ) : (
          !!query && (
            <Pressable onPress={() => setQuery("")} hitSlop={10}>
              <Feather name="x" size={17} color={COLORS.textMuted} />
            </Pressable>
          )
        )}
      </View>

      {!!error && (
        <View style={styles.alert}>
          <Feather name="alert-circle" size={15} color={COLORS.danger} />
          <Text style={styles.alertText}>{error}</Text>
        </View>
      )}

      {tab === "buses" && (
        <FlatList
          contentContainerStyle={styles.content}
          data={buses.items}
          keyExtractor={(b) => String(b.Id)}
          keyboardShouldPersistTaps="handled"
          ListEmptyComponent={<Empty loading={buses.loading} what="bus" />}
          renderItem={({ item }) => {
            const reserve = item.BusType.toLowerCase() === "reserve";
            const outOfService = item.ServiceStatus !== SERVICE_STATUS.inService;
            return (
              <Row
                onPress={() => setBusEdit({ row: item })}
                onDelete={() =>
                  askDelete(DELETE_PROMPT.bus(item), () => {
                    dispatch(removeBus(item.Id));
                  })
                }
                avatar={item.BusNumber}
                avatarTone={reserve ? "warn" : "primary"}
                title={`${LABELS.vehicle} ${item.BusNumber}`}
                // One line, in the order an admin scans it: where it goes, then
                // who drives it. The plate is last because nobody looks it up here.
                // A bus that is off the road gives up its driver for the reason —
                // that is the thing worth reading when it is not running.
                sub={join(
                  item.RouteName ?? "No route",
                  outOfService ? item.OutOfServiceReason : item.DriverName,
                  item.RegistrationNumber,
                )}
                pill={
                  outOfService
                    ? { text: item.ServiceStatus, tone: "bad" }
                    : reserve
                      ? { text: "RESERVE", tone: "warn" }
                      : undefined
                }
              />
            );
          }}
        />
      )}

      {tab === "users" && (
        <FlatList
          contentContainerStyle={styles.content}
          data={users.items}
          keyExtractor={(u) => String(u.Id)}
          keyboardShouldPersistTaps="handled"
          ListEmptyComponent={<Empty loading={users.loading} what="user" />}
          renderItem={({ item }) => (
            <Row
              onPress={() => setUserEdit({ row: item })}
              onDelete={() =>
                askDelete(DELETE_PROMPT.user(item), () => {
                  dispatch(removeUser(item.Id));
                })
              }
              avatar={item.Name.charAt(0).toUpperCase()}
              title={item.Name}
              sub={join(item.RoleName ?? "No role", item.EmployeeCode, item.Contact)}
              pill={item.IsActive ? undefined : { text: "Blocked", tone: "bad" }}
            />
          )}
        />
      )}

      {tab === "routes" && (
        <FlatList
          contentContainerStyle={styles.content}
          data={shownRoutes}
          keyExtractor={(r) => String(r.Id)}
          keyboardShouldPersistTaps="handled"
          ListEmptyComponent={<Empty loading={false} what="route" />}
          renderItem={({ item }) => (
            <Row
              onPress={() => setRouteEdit({ row: item })}
              onDelete={() =>
                askDelete(DELETE_PROMPT.route(item), () => {
                  dispatch(removeRoute(item.Id));
                })
              }
              avatar={item.RouteCode || item.RouteName.charAt(0).toUpperCase()}
              title={item.RouteName}
              // What the LED wall will actually print for this route.
              sub={`LED: ${item.LedDisplayName || item.RouteName}`}
              pill={item.IsActive ? undefined : { text: "Not in use", tone: "bad" }}
            />
          )}
        />
      )}

      {tab === "platforms" && (
        <FlatList
          contentContainerStyle={styles.content}
          data={shownPlatforms}
          keyExtractor={(p) => String(p.Id)}
          keyboardShouldPersistTaps="handled"
          ListHeaderComponent={
            <Text style={styles.listNote}>
              In the order buses are given them — top of this list is filled first. Tap a{" "}
              {LABELS.slot.toLowerCase()} to move it in the queue or close it for repair.
            </Text>
          }
          ListEmptyComponent={<Empty loading={false} what={LABELS.slot.toLowerCase()} />}
          renderItem={({ item, index }) => (
            <Row
              onPress={() => setPlatformEdit({ row: item })}
              onDelete={() =>
                askDelete(DELETE_PROMPT.platform(item), () => {
                  dispatch(removePlatform(item.Id));
                })
              }
              avatar={String(item.PlatformNumber).padStart(2, "0")}
              avatarTone={item.IsActive ? "primary" : "off"}
              title={item.PlatformName || `${LABELS.slot} ${item.PlatformNumber}`}
              // The order is information, not a state, so it reads on the line
              // rather than as a pill — every row would carry one otherwise, and
              // a badge every row has is a column, not a signal. "Next to be
              // filled" is position in the live queue, which only matches the
              // stored order when nothing above it has been closed. Side is not
              // shown: it is hidden on the form, so the list must not be the
              // only place it appears.
              sub={join(
                `Order ${item.SortOrder}`,
                item.IsActive ? (index === 0 ? "Next to be filled" : undefined) : "Closed",
              )}
              pill={item.IsActive ? undefined : { text: "Out of use", tone: "bad" }}
            />
          )}
        />
      )}

      <Pressable style={styles.fab} onPress={addNew}>
        <Feather name="plus" size={24} color={COLORS.white} />
      </Pressable>

      <BusForm editing={busEdit} onClose={() => setBusEdit(null)} />
      <UserForm editing={userEdit} onClose={() => setUserEdit(null)} />
      <RouteForm editing={routeEdit} onClose={() => setRouteEdit(null)} />
      <PlatformForm editing={platformEdit} onClose={() => setPlatformEdit(null)} />
    </View>
  );
}

function Empty({ loading, what }: { loading: boolean; what: string }) {
  return (
    <Text style={styles.empty}>{loading ? "Loading…" : `No ${what} matches that search`}</Text>
  );
}

/** Drops the blanks, so a bus with no driver does not render " · · MH-43". */
const join = (...parts: (string | null | undefined)[]) => parts.filter(Boolean).join(" · ");

type Tone = "primary" | "warn" | "off" | "bad" | "muted";

/**
 * One master record, two lines.
 *
 * All four lists render through this. They used to be four near-identical
 * three-line cards, and the third line was almost always something that fits
 * after a middot — which cost a third of the screen to say nothing. What is
 * genuinely a state (off the road, closed, blocked) moves to a pill on the
 * right, where the eye can find it down a column of forty rows.
 */
function Row({
  onPress,
  onDelete,
  avatar,
  avatarTone = "primary",
  title,
  sub,
  subTone = "muted",
  pill,
}: {
  onPress: () => void;
  onDelete: () => void;
  avatar: string;
  avatarTone?: Tone;
  title: string;
  sub?: string;
  subTone?: Tone;
  pill?: { text: string; tone: Tone };
}) {
  return (
    <Pressable
      style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
      onPress={onPress}
    >
      <View style={[styles.avatar, TONE_BG[avatarTone]]}>
        <Text style={[styles.avatarText, TONE_FG[avatarTone]]} numberOfLines={1}>
          {avatar}
        </Text>
      </View>

      <View style={styles.rowBody}>
        <Text style={styles.title} numberOfLines={1}>
          {title}
        </Text>
        {!!sub && (
          <Text style={[styles.sub, TONE_FG[subTone]]} numberOfLines={1}>
            {sub}
          </Text>
        )}
      </View>

      {!!pill && (
        <View style={[styles.pill, TONE_BG[pill.tone]]}>
          <Text style={[styles.pillText, TONE_FG[pill.tone]]} numberOfLines={1}>
            {pill.text}
          </Text>
        </View>
      )}

      {/* Nested Pressables: the icon takes the touch, so tapping one never also
          opens the row behind it. hitSlop keeps a 32px button thumb-sized
          without making the row taller. */}
      <Pressable
        style={({ pressed }) => [styles.iconBtn, styles.iconEdit, pressed && styles.iconEditOn]}
        onPress={onPress}
        hitSlop={6}
        accessibilityRole="button"
        accessibilityLabel={`Edit ${title}`}
      >
        <Feather name="edit-2" size={14} color={COLORS.primary} />
      </Pressable>

      <Pressable
        style={({ pressed }) => [styles.iconBtn, styles.iconDel, pressed && styles.iconDelOn]}
        onPress={onDelete}
        hitSlop={6}
        accessibilityRole="button"
        accessibilityLabel={`Delete ${title}`}
      >
        <Feather name="trash-2" size={14} color={COLORS.danger} />
      </Pressable>
    </Pressable>
  );
}

const TONE_BG: Record<Tone, { backgroundColor: string }> = {
  primary: { backgroundColor: TINT.primary },
  warn: { backgroundColor: TINT.warning },
  off: { backgroundColor: COLORS.surfaceAlt },
  bad: { backgroundColor: TINT.danger },
  muted: { backgroundColor: COLORS.surfaceAlt },
};

const TONE_FG: Record<Tone, { color: string }> = {
  primary: { color: COLORS.primary },
  warn: { color: COLORS.accent },
  off: { color: COLORS.textMuted },
  bad: { color: COLORS.danger },
  muted: { color: COLORS.textMuted },
};

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.screenBg },
  segment: {
    flexDirection: "row",
    margin: SPACING.md,
    marginBottom: 0,
    backgroundColor: COLORS.surfaceAlt,
    borderRadius: RADIUS.md,
    padding: 3,
  },
  seg: { flex: 1, paddingVertical: 7, borderRadius: RADIUS.sm, alignItems: "center" },
  segOn: { backgroundColor: COLORS.surface, ...SHADOW.card },
  // Four tabs on a phone: the label rides above its count rather than beside
  // it, so "Buses 12" does not have to fit across a quarter of the screen.
  segText: { fontSize: 11, fontWeight: "700", color: COLORS.textMuted },
  segCount: { fontSize: 14, fontWeight: "900", color: COLORS.textMuted },
  segTextOn: { color: COLORS.primary },

  search: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.sm,
    marginHorizontal: SPACING.md,
    marginTop: SPACING.md,
    paddingHorizontal: SPACING.md,
    height: 46,
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  searchInput: { flex: 1, color: COLORS.text, fontSize: 15 },

  alert: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.sm,
    marginHorizontal: SPACING.md,
    marginTop: SPACING.sm,
    backgroundColor: TINT.danger,
    borderWidth: 1,
    borderColor: COLORS.danger + "44",
    borderRadius: RADIUS.md,
    padding: SPACING.sm,
  },
  alertText: { flex: 1, color: COLORS.danger, fontSize: 12, fontWeight: "600" },

  content: { padding: SPACING.md, gap: 6, paddingBottom: 96 },
  listNote: {
    fontSize: 11,
    color: COLORS.textMuted,
    lineHeight: 16,
    marginBottom: SPACING.xs,
  },
  // Flat, not lifted. Forty rows each casting their own shadow reads as noise;
  // a hairline border on white is what an admin console looks like.
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.sm,
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: SPACING.sm + 2,
    paddingVertical: SPACING.sm,
  },
  rowPressed: { borderColor: COLORS.primary, backgroundColor: COLORS.surfaceAlt },
  rowBody: { flex: 1, gap: 1 },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: RADIUS.sm,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 2,
  },
  avatarText: { fontSize: 13, fontWeight: "900" },
  title: { fontSize: 14, fontWeight: "700", color: COLORS.text },
  sub: { fontSize: 12 },
  pill: {
    borderRadius: RADIUS.sm,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 3,
    maxWidth: 96,
  },
  pillText: { fontSize: 10, fontWeight: "800", letterSpacing: 0.4 },

  // Tinted squares rather than bare glyphs: they read as buttons, they line up
  // with the avatar's shape language, and the red one is visibly its own thing
  // so a thumb aiming for edit does not land on delete.
  iconBtn: {
    width: 32,
    height: 32,
    borderRadius: RADIUS.sm,
    alignItems: "center",
    justifyContent: "center",
  },
  iconEdit: { backgroundColor: TINT.primary },
  iconEditOn: { backgroundColor: COLORS.primary + "26" },
  iconDel: { backgroundColor: TINT.danger },
  iconDelOn: { backgroundColor: COLORS.danger + "26" },
  empty: { textAlign: "center", color: COLORS.textMuted, marginTop: SPACING.xl, fontSize: 13 },

  fab: {
    position: "absolute",
    right: SPACING.md,
    bottom: SPACING.lg,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.primary,
    alignItems: "center",
    justifyContent: "center",
    ...SHADOW.lifted,
  },
});
