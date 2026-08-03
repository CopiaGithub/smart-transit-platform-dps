import { useNavigation } from "@react-navigation/native";
import { FlatList, StyleSheet, Text, View } from "react-native";
import Card from "../../components/Card";
import { COLORS, RADIUS, SPACING } from "../../constants/theme";

// ponytail: static sample rows until the API exists. Replace with a thunk +
// slice under src/store when the endpoint lands.
const DISPLAYS = [
  { id: "d1", name: "Gate A Board", location: "North entrance", online: true },
  { id: "d2", name: "Gate B Board", location: "Loading bay 3", online: true },
  { id: "d3", name: "Lobby Panel", location: "Reception", online: false },
];

export default function DisplaysScreen() {
  const navigation = useNavigation();

  return (
    <FlatList
      style={styles.list}
      contentContainerStyle={styles.content}
      data={DISPLAYS}
      keyExtractor={(item) => item.id}
      ListEmptyComponent={<Text style={styles.empty}>No displays yet</Text>}
      renderItem={({ item }) => (
        <Card
          title={item.name}
          subtitle={item.location}
          onPress={() =>
            navigation.navigate("DisplayDetail", { displayId: item.id, name: item.name })
          }
          right={
            <View style={[styles.badge, !item.online && styles.badgeOff]}>
              <Text style={styles.badgeText}>{item.online ? "Online" : "Offline"}</Text>
            </View>
          }
        />
      )}
    />
  );
}

const styles = StyleSheet.create({
  list: { flex: 1, backgroundColor: COLORS.screenBg },
  content: { padding: SPACING.md, gap: SPACING.md },
  empty: { textAlign: "center", color: COLORS.textMuted, marginTop: SPACING.xl },
  badge: {
    backgroundColor: COLORS.success,
    borderRadius: RADIUS.sm,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 2,
  },
  badgeOff: { backgroundColor: COLORS.textMuted },
  badgeText: { color: COLORS.white, fontSize: 11, fontWeight: "700" },
});
