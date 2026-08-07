import { Feather } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { useCallback, useEffect, useState } from "react";
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
import { SERVICE_STATUS, type BusMaster, type UserMaster } from "../../src/api/masters.api";
import {
  fetchBuses,
  fetchLookups,
  fetchUsers,
  selectBusPage,
  selectUserPage,
} from "../../src/store/masters.slice";
import { useAppDispatch, useAppSelector } from "../../src/store";
import { BusForm, UserForm, type Editing } from "./MasterForm";

type Tab = "buses" | "users";

/** Modules 2 and 3 — the master lists the whole console reads from. */
export default function MastersScreen() {
  const dispatch = useAppDispatch();
  const [tab, setTab] = useState<Tab>("buses");
  const [query, setQuery] = useState("");
  const [busEdit, setBusEdit] = useState<Editing<BusMaster>>(null);
  const [userEdit, setUserEdit] = useState<Editing<UserMaster>>(null);

  const buses = useAppSelector(selectBusPage);
  const users = useAppSelector(selectUserPage);
  const error = useAppSelector((s) => s.masters.error);

  const onBuses = tab === "buses";
  const page = onBuses ? buses : users;

  // Picker options for the forms — fetched once per visit, not per keystroke.
  useFocusEffect(
    useCallback(() => {
      dispatch(fetchLookups());
    }, [dispatch]),
  );

  // Search is the server's job (§3.3), so it is debounced rather than filtered
  // locally: the screen only ever holds one page of the list.
  useEffect(() => {
    const term = query.trim() || undefined;
    const timer = setTimeout(() => {
      if (onBuses) dispatch(fetchBuses({ searchTerm: term }));
      else dispatch(fetchUsers({ searchTerm: term }));
    }, 300);
    return () => clearTimeout(timer);
  }, [dispatch, query, onBuses]);

  return (
    <View style={styles.root}>
      <View style={styles.segment}>
        {(["buses", "users"] as Tab[]).map((t) => (
          <Pressable
            key={t}
            style={[styles.seg, tab === t && styles.segOn]}
            onPress={() => {
              setTab(t);
              setQuery("");
            }}
          >
            <Text style={[styles.segText, tab === t && styles.segTextOn]}>
              {t === "buses"
                ? `${LABELS.vehiclePlural} (${buses.total})`
                : `Users (${users.total})`}
            </Text>
          </Pressable>
        ))}
      </View>

      <View style={styles.search}>
        <Feather name="search" size={17} color={COLORS.textMuted} />
        <TextInput
          style={styles.searchInput}
          placeholder={onBuses ? `Search ${LABELS.vehicleNo} or route` : "Search name or code"}
          placeholderTextColor={COLORS.textMuted}
          value={query}
          onChangeText={setQuery}
          autoCorrect={false}
        />
        {page.loading ? (
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

      {onBuses ? (
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
      ) : (
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

      <Pressable
        style={styles.fab}
        onPress={() => (onBuses ? setBusEdit({ row: null }) : setUserEdit({ row: null }))}
      >
        <Feather name="plus" size={24} color={COLORS.white} />
      </Pressable>

      <BusForm editing={busEdit} onClose={() => setBusEdit(null)} />
      <UserForm editing={userEdit} onClose={() => setUserEdit(null)} />
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
  seg: { flex: 1, paddingVertical: 9, borderRadius: RADIUS.sm, alignItems: "center" },
  segOn: { backgroundColor: COLORS.surface, ...SHADOW.card },
  segText: { fontSize: 13, fontWeight: "700", color: COLORS.textMuted },
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
  avatar: {
    width: 44,
    height: 44,
    borderRadius: RADIUS.md,
    backgroundColor: TINT.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarReserve: { backgroundColor: TINT.warning },
  avatarText: { fontSize: 15, fontWeight: "900", color: COLORS.primary },
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
