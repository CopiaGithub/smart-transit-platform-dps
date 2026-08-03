import { Feather } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { Pressable, StyleSheet, Text, View } from "react-native";
import Card from "../../components/Card";
import Screen from "../../components/Screen";
import { COLORS, RADIUS, SPACING } from "../../constants/theme";
import { visibleMenu } from "../../navigation/menu";
import { useAppSelector } from "../../src/store";

export default function DashboardScreen() {
  const navigation = useNavigation();
  const user = useAppSelector((s) => s.auth.user);
  // Same source as the drawer, minus Dashboard itself.
  const tiles = visibleMenu(user?.role).filter((m) => m.name !== "Dashboard");

  return (
    <Screen scroll>
      <Card title={`Hello, ${user?.name ?? "there"}`} subtitle="Site overview" />

      <View style={styles.grid}>
        {tiles.map((tile) => (
          <Pressable
            key={tile.name}
            style={styles.tile}
            onPress={() => navigation.navigate(tile.name as never)}
          >
            <Feather name={tile.icon} size={22} color={COLORS.primary} />
            <Text style={styles.tileText}>{tile.title}</Text>
          </Pressable>
        ))}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  grid: { flexDirection: "row", flexWrap: "wrap", gap: SPACING.md },
  tile: {
    flexGrow: 1,
    flexBasis: "45%",
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: COLORS.border,
    padding: SPACING.md,
    gap: SPACING.sm,
  },
  tileText: { fontWeight: "700", color: COLORS.text },
});
