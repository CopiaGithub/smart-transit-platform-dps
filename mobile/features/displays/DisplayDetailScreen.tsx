import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { Text } from "react-native";
import Card from "../../components/Card";
import Screen from "../../components/Screen";
import type { RootStackParamList } from "../../navigation/types";

type Props = NativeStackScreenProps<RootStackParamList, "DisplayDetail">;

export default function DisplayDetailScreen({ route }: Props) {
  const { displayId, name } = route.params;
  return (
    <Screen scroll>
      <Card title={name} subtitle={`ID: ${displayId}`}>
        <Text>Detail content goes here.</Text>
      </Card>
    </Screen>
  );
}
