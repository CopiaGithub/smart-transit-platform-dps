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
  selectBusPage,
  selectPlatforms,
  selectRoutes,
  selectUserPage,
} from "../../src/store/masters.slice";
import { useAppDispatch, useAppSelector } from "../../src/store";
import { BusForm, PlatformForm, RouteForm, UserForm, type Editing } from "./MasterForm";

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
              <Pressable
                style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
                onPress={() => setBusEdit({ row: item })}
              >
                <View style={[styles.avatar, reserve && styles.avatarReserve]}>
                  <Text style={[styles.avatarText, reserve && { color: COLORS.accent }]}>
                    {item.BusNumber}
                  </Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.title}>
                    {LABELS.vehicle} {item.BusNumber}
                    {reserve && <Text style={styles.reserveTag}> RESERVE</Text>}
                  </Text>
                  <Text style={styles.sub} numberOfLines={1}>
                    {item.RouteName ?? "No route"}
                    {item.RegistrationNumber ? ` · ${item.RegistrationNumber}` : ""}
                  </Text>
                  {outOfService ? (
                    <Text style={styles.outOfService}>
                      {item.ServiceStatus}
                      {item.OutOfServiceReason ? ` — ${item.OutOfServiceReason}` : ""}
                    </Text>
                  ) : (
                    !!item.DriverName && <Text style={styles.driver}>{item.DriverName}</Text>
                  )}
                </View>
                <Feather name="chevron-right" size={20} color={COLORS.textMuted} />
              </Pressable>
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
            <Pressable
              style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
              onPress={() => setUserEdit({ row: item })}
            >
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{item.Name.charAt(0).toUpperCase()}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.title}>{item.Name}</Text>
                <Text style={styles.sub}>
                  {item.RoleName ?? "No role"}
                  {item.EmployeeCode ? ` · ${item.EmployeeCode}` : ""}
                </Text>
                {!!item.Contact && <Text style={styles.driver}>{item.Contact}</Text>}
              </View>
              <Feather name="chevron-right" size={20} color={COLORS.textMuted} />
            </Pressable>
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
            <Pressable
              style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
              onPress={() => setRouteEdit({ row: item })}
            >
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>
                  {item.RouteCode || item.RouteName.charAt(0).toUpperCase()}
                </Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.title} numberOfLines={1}>
                  {item.RouteName}
                </Text>
                <Text style={styles.sub} numberOfLines={1}>
                  {/* What the LED wall will actually print for this route. */}
                  LED: {item.LedDisplayName || item.RouteName}
                </Text>
                {!item.IsActive && <Text style={styles.outOfService}>Not in use</Text>}
              </View>
              <Feather name="chevron-right" size={20} color={COLORS.textMuted} />
            </Pressable>
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
            <Pressable
              style={({ pressed }) => [
                styles.card,
                pressed && styles.cardPressed,
                !item.IsActive && styles.cardOff,
              ]}
              onPress={() => setPlatformEdit({ row: item })}
            >
              <View style={[styles.avatar, !item.IsActive && styles.avatarOff]}>
                <Text style={[styles.avatarText, !item.IsActive && styles.avatarTextOff]}>
                  {String(item.PlatformNumber).padStart(2, "0")}
                </Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.title}>
                  {item.PlatformName || `${LABELS.slot} ${item.PlatformNumber}`}
                </Text>
                <Text style={styles.sub}>
                  Order {item.SortOrder}
                  {item.Side ? ` · ${item.Side} side` : ""}
                </Text>
                {item.IsActive ? (
                  // Position in the live queue, which is only the same as the
                  // stored order when nothing above it has been closed.
                  index === 0 && <Text style={styles.driver}>Next to be filled</Text>
                ) : (
                  <Text style={styles.outOfService}>Closed — skipped when allocating</Text>
                )}
              </View>
              <Feather name="chevron-right" size={20} color={COLORS.textMuted} />
            </Pressable>
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

  content: { padding: SPACING.md, gap: SPACING.sm, paddingBottom: 96 },
  listNote: {
    fontSize: 11,
    color: COLORS.textMuted,
    lineHeight: 16,
    marginBottom: SPACING.xs,
  },
  card: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.md,
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.md,
    ...SHADOW.card,
  },
  cardPressed: { borderColor: COLORS.primary, backgroundColor: COLORS.surfaceAlt },
  cardOff: { backgroundColor: COLORS.surfaceAlt },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: RADIUS.md,
    backgroundColor: TINT.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarReserve: { backgroundColor: TINT.warning },
  avatarOff: { backgroundColor: COLORS.border },
  avatarText: { fontSize: 15, fontWeight: "900", color: COLORS.primary },
  avatarTextOff: { color: COLORS.textMuted },
  title: { fontSize: 15, fontWeight: "800", color: COLORS.text },
  reserveTag: { fontSize: 9, fontWeight: "900", color: COLORS.accent, letterSpacing: 1 },
  sub: { fontSize: 12, color: COLORS.textMuted, marginTop: 1 },
  driver: { fontSize: 11, color: COLORS.textMuted, marginTop: 3 },
  outOfService: { fontSize: 11, color: COLORS.danger, fontWeight: "700", marginTop: 3 },
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
