import { Text } from "react-native";
import Card from "../../components/Card";
import Screen from "../../components/Screen";

// Generic "things that move": buses, forklifts, delivery vans.
export default function AssetsScreen() {
  return (
    <Screen scroll>
      <Card title="Assets" subtitle="Vehicles and tracked units">
        <Text>No assets registered.</Text>
      </Card>
    </Screen>
  );
}
