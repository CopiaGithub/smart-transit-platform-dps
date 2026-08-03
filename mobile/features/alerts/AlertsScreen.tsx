import { Text } from "react-native";
import Card from "../../components/Card";
import Screen from "../../components/Screen";

export default function AlertsScreen() {
  return (
    <Screen scroll>
      <Card title="Alerts" subtitle="Delays, outages and notices">
        <Text>Nothing to report.</Text>
      </Card>
    </Screen>
  );
}
