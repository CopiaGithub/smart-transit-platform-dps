import Constants from "expo-constants";
import { StyleSheet, Text, View } from "react-native";
import Card from "../../components/Card";
import Screen from "../../components/Screen";
import { COLORS } from "../../constants/theme";

export default function SettingsScreen() {
  const extra = Constants.expoConfig?.extra ?? {};
  return (
    <Screen scroll>
      <Card title="Environment">
        <Row label="Build" value={String(extra.appEnv)} />
        <Row label="API" value={String(extra.apiUrl)} />
        <Row label="Version" value={String(Constants.expoConfig?.version)} />
      </Card>
    </Screen>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.row}>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.value} numberOfLines={1}>
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", justifyContent: "space-between", gap: 12 },
  label: { color: COLORS.textMuted },
  value: { color: COLORS.text, fontWeight: "600", flexShrink: 1 },
});
