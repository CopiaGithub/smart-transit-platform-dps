import NetInfo from "@react-native-community/netinfo";
import { useEffect, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { COLORS, SPACING } from "../constants/theme";

export default function OfflineBanner() {
  const [offline, setOffline] = useState(false);

  useEffect(
    () =>
      NetInfo.addEventListener((state) =>
        // isInternetReachable is null while unknown — only treat an explicit
        // false as offline so the strip doesn't flash on cold start.
        setOffline(state.isConnected === false || state.isInternetReachable === false),
      ),
    [],
  );

  if (!offline) return null;

  return (
    <View style={styles.bar}>
      <Text style={styles.text}>No internet connection</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    backgroundColor: COLORS.danger,
    paddingVertical: SPACING.xs,
    alignItems: "center",
  },
  text: { color: COLORS.white, fontSize: 12, fontWeight: "600" },
});
