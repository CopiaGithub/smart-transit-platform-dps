import type { ReactNode } from "react";
import { ScrollView, StyleSheet, View, type ViewStyle } from "react-native";
import { COLORS, SPACING } from "../constants/theme";

type Props = {
  children: ReactNode;
  /** Wrap in a ScrollView. Off for screens that own a FlatList. */
  scroll?: boolean;
  style?: ViewStyle;
};

// Standard screen padding/background so no screen re-invents it.
export default function Screen({ children, scroll = false, style }: Props) {
  if (scroll) {
    return (
      <ScrollView
        style={styles.root}
        contentContainerStyle={[styles.content, style]}
        keyboardShouldPersistTaps="handled"
      >
        {children}
      </ScrollView>
    );
  }
  return <View style={[styles.root, styles.content, style]}>{children}</View>;
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.screenBg },
  content: { padding: SPACING.md, gap: SPACING.md },
});
