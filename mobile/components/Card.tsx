import type { ReactNode } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { COLORS, RADIUS, SPACING } from "../constants/theme";

type Props = {
  title?: string;
  subtitle?: string;
  right?: ReactNode;
  children?: ReactNode;
  onPress?: () => void;
};

export default function Card({ title, subtitle, right, children, onPress }: Props) {
  const Container = onPress ? Pressable : View;
  return (
    <Container style={styles.card} onPress={onPress}>
      {(title || right) && (
        <View style={styles.header}>
          <View style={{ flex: 1 }}>
            {!!title && <Text style={styles.title}>{title}</Text>}
            {!!subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
          </View>
          {right}
        </View>
      )}
      {children}
    </Container>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: COLORS.border,
    gap: SPACING.sm,
  },
  header: { flexDirection: "row", alignItems: "center", gap: SPACING.sm },
  title: { fontSize: 15, fontWeight: "700", color: COLORS.text },
  subtitle: { fontSize: 12, color: COLORS.textMuted, marginTop: 2 },
});
