import { Feather } from "@expo/vector-icons";
import { useMemo, useState } from "react";
import { FlatList, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import StatusPill from "../../components/StatusPill";
import { findGate, LABELS, ROLE_LABEL } from "../../constants/domain";
import { COLORS, RADIUS, SHADOW, SPACING } from "../../constants/theme";
import type { Bus, Operator } from "../../src/data/seed";
import { useAppSelector } from "../../src/store";
import { BusForm, UserForm, type Editing } from "./MasterForm";

type Tab = "buses" | "users";

/** Modules 2 and 3 — the master lists the whole console reads from. */
export default function MastersScreen() {
  const [tab, setTab] = useState<Tab>("buses");
  const [query, setQuery] = useState("");
  const [busEdit, setBusEdit] = useState<Editing<Bus>>(null);
  const [userEdit, setUserEdit] = useState<Editing<Operator>>(null);

  const fleet = useAppSelector((s) => s.ops.fleet);
  const users = useAppSelector((s) => s.ops.users);

  const q = query.trim().toLowerCase();
  const buses = useMemo(
    () =>
      q ? fleet.filter((b) => b.no.includes(q) || b.route.toLowerCase().includes(q)) : fleet,
    [fleet, q],
  );
  const people = useMemo(
    () =>
      q
        ? users.filter(
            (u) =>
              u.name.toLowerCase().includes(q) ||
              u.username.includes(q) ||
              u.mobile.includes(q),
          )
        : users,
    [users, q],
  );

  const onBuses = tab === "buses";

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
                ? `${LABELS.vehiclePlural} (${fleet.length})`
                : `Users (${users.length})`}
            </Text>
          </Pressable>
        ))}
      </View>

      <View style={styles.search}>
        <Feather name="search" size={17} color={COLORS.textMuted} />
        <TextInput
          style={styles.searchInput}
          placeholder={onBuses ? `Search ${LABELS.vehicleNo} or route` : "Search name"}
          placeholderTextColor={COLORS.textMuted}
          value={query}
          onChangeText={setQuery}
          autoCorrect={false}
        />
        {!!query && (
          <Pressable onPress={() => setQuery("")} hitSlop={10}>
            <Feather name="x" size={17} color={COLORS.textMuted} />
          </Pressable>
        )}
      </View>

      {onBuses ? (
        <FlatList
          contentContainerStyle={styles.content}
          data={buses}
          keyExtractor={(b) => b.id}
          keyboardShouldPersistTaps="handled"
          ListEmptyComponent={<Empty text="No bus matches that search" />}
          renderItem={({ item }) => (
            <Pressable
              style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
              onPress={() => setBusEdit({ row: item })}
            >
              <View style={[styles.avatar, item.reserve && styles.avatarReserve]}>
                <Text style={[styles.avatarText, item.reserve && { color: COLORS.accent }]}>
                  {item.no}
                </Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.title}>
                  {LABELS.vehicle} {item.no}
                  {item.reserve && <Text style={styles.reserveTag}> RESERVE</Text>}
                </Text>
                <Text style={styles.sub} numberOfLines={1}>
                  {item.route}
                </Text>
                <View style={{ marginTop: 6, alignSelf: "flex-start" }}>
                  {item.status ? (
                    <StatusPill status={item.status} />
                  ) : (
                    <Text style={styles.notIn}>Not in yet</Text>
                  )}
                </View>
              </View>
              <Feather name="chevron-right" size={20} color={COLORS.textMuted} />
            </Pressable>
          )}
        />
      ) : (
        <FlatList
          contentContainerStyle={styles.content}
          data={people}
          keyExtractor={(u) => u.id}
          keyboardShouldPersistTaps="handled"
          ListEmptyComponent={<Empty text="No user matches that search" />}
          renderItem={({ item }) => {
            const gate = findGate(item.gateId);
            return (
              <Pressable
                style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
                onPress={() => setUserEdit({ row: item })}
              >
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>
                    {item.name.charAt(0).toUpperCase()}
                  </Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.title}>{item.name}</Text>
                  <Text style={styles.sub}>
                    {ROLE_LABEL[item.role]} · {item.username} · {item.mobile}
                  </Text>
                  {!!gate && (
                    <Text style={styles.post}>
                      <Feather name="map-pin" size={10} color={COLORS.textMuted} />{" "}
                      {gate.label} · {gate.kind === "in" ? "Entry" : "Exit"}
                    </Text>
                  )}
                </View>
                <Feather name="chevron-right" size={20} color={COLORS.textMuted} />
              </Pressable>
            );
          }}
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

function Empty({ text }: { text: string }) {
  return <Text style={styles.empty}>{text}</Text>;
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
    backgroundColor: COLORS.primary + "14",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarReserve: { backgroundColor: COLORS.accent + "1F" },
  avatarText: { fontSize: 15, fontWeight: "900", color: COLORS.primary },
  title: { fontSize: 15, fontWeight: "800", color: COLORS.text },
  reserveTag: { fontSize: 9, fontWeight: "900", color: COLORS.accent, letterSpacing: 1 },
  sub: { fontSize: 12, color: COLORS.textMuted, marginTop: 1 },
  post: { fontSize: 11, color: COLORS.textMuted, marginTop: 4 },
  notIn: { fontSize: 11, color: COLORS.textMuted, fontWeight: "700" },
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
