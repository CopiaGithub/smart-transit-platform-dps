import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useEffect } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { COLORS, SPACING } from "../../constants/theme";
import { restoreSession } from "../../src/store/auth.slice";
import { useAppDispatch } from "../../src/store";
import type { RootStackParamList } from "../../navigation/types";

type Props = NativeStackScreenProps<RootStackParamList, "Splash">;

export default function SplashScreen({ navigation }: Props) {
  const dispatch = useAppDispatch();

  useEffect(() => {
    dispatch(restoreSession())
      .unwrap()
      .then((token) =>
        navigation.reset({ index: 0, routes: [{ name: token ? "Main" : "Login" }] }),
      );
  }, [dispatch, navigation]);

  return (
    <View style={styles.root}>
      <Text style={styles.title}>Transit Display</Text>
      <Text style={styles.tagline}>Live arrivals for any site</Text>
      <ActivityIndicator color={COLORS.white} style={{ marginTop: SPACING.lg }} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: COLORS.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  title: { color: COLORS.white, fontSize: 28, fontWeight: "800" },
  tagline: { color: COLORS.white, opacity: 0.85, marginTop: SPACING.xs },
});
