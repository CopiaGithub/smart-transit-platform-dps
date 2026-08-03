import { Feather } from "@expo/vector-icons";
import { useState } from "react";
import { FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import StatusPill from "../../components/StatusPill";
import { LABELS } from "../../constants/domain";
import { COLORS, RADIUS, SHADOW, SPACING } from "../../constants/theme";
import { useAppSelector } from "../../src/store";

type Tab = "buses" | "users";

/** Modules 2 and 3 — the master lists the console reads from. */
export default function MastersScreen() {
  const [tab, setTab] = useState<Tab>("buses");
  const fleet = useAppSelector((s) => s.ops.fleet);
  const users = useAppSelector((s) => s.ops.users);

  return (
    <View style={styles.root}>
      <View style={styles.segment}>
        {(["buses", "users"] as Tab[]).map((t) => (
          <Pressable
            key={t}
            style={[styles.seg, tab === t && styles.segOn]}
            onPress={() => setTab(t)}
          >
            <Text style={[styles.segText, tab === t && styles.segTextOn]}>
              {t === "buses" ? `${LABELS.vehiclePlural} (${fleet.length})` : `Users (${users.length})`}
            </Text>
          </Pressable>
        ))}
      </View>

      {tab === "buses" ? (
        <FlatList
          contentContainerStyle={styles.content}
          data={fleet}
          keyExtractor={(b) => b.id}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <View style={[styles.avatar, item.reserve && styles.avatarReserve]}>
                <Text style={[styles.avatarText, item.reserve && { color: COLORS.accent }]}>
                  {item.no}
                </Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.title}>
                  {LABELS.vehicle} {item.no}
                  {item.reserve && <Text style={styles.reserveTag}>  RESERVE</Text>}
                </Text>
                <Text style={styles.sub} numberOfLines={1}>
                  {item.route}
                </Text>
                <View style={{ marginTop: 6 }}>
                  <StatusPill status={item.status} />
                </View>
              </View>
            </View>
          )}
        />
      ) : (
        <FlatList
          contentContainerStyle={styles.content}
          data={users}
          keyExtractor={(u) => u.id}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <View style={styles.avatar}>
                <Feather name="user" size={18} color={COLORS.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.title}>{item.name}</Text>
                <Text style={styles.sub}>{item.role}</Text>
                <Text style={styles.post}>
                  <Feather name="map-pin" size={10} color={COLORS.textMuted} /> {item.post}
                </Text>
              </View>
            </View>
          )}
        />
      )}

      {/* ponytail: read-only for the prototype — add/edit lands with the API. */}
      <Pressable style={styles.fab}>
        <Feather name="plus" size={24} color={COLORS.white} />
      </Pressable>
    </View>
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

  content: { padding: SPACING.md, gap: SPACING.sm, paddingBottom: 90 },
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
