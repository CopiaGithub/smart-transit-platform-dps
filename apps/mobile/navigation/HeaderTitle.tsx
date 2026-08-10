import { StyleSheet, Text, View } from "react-native";
import { useAppSelector } from "../src/store";

/**
 * Screen name with the school's dispersal date under it.
 *
 * The date is the server's, never the phone's: it is the date of the open
 * session, so every guard, teacher and parent reads the same one — and a
 * session that runs past midnight still says which afternoon it belongs to.
 *
 * Staff screens have the session loaded; a parent only ever fetches the board.
 * Either carries the date, so take whichever is there.
 */
export function useSessionDate(): string | null {
  return useAppSelector(
    (s) => s.session.current?.SessionDate ?? s.ops.board?.SessionDate ?? null,
  );
}

/** "07 Aug 2026" — short enough to sit under a title without crowding it. */
export function formatShortDate(sessionDate: string): string {
  // "2026-08-07" through Date() is UTC midnight, which reads as the previous
  // day west of Greenwich. Build it from the parts instead.
  const [y, m, d] = sessionDate.slice(0, 10).split("-").map(Number);
  if (!y || !m || !d) return sessionDate;
  return new Date(y, m - 1, d).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export default function HeaderTitle({
  title,
  tint,
  subTint,
}: {
  title: string;
  tint: string;
  subTint: string;
}) {
  const sessionDate = useSessionDate();

  return (
    <View style={styles.wrap}>
      <Text style={[styles.title, { color: tint }]} numberOfLines={1}>
        {title}
      </Text>
      {!!sessionDate && (
        <Text style={[styles.date, { color: subTint }]} numberOfLines={1}>
          {formatShortDate(sessionDate)}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { justifyContent: "center" },
  title: { fontSize: 19, fontWeight: "800", letterSpacing: -0.2 },
  date: { fontSize: 11, fontWeight: "600", marginTop: 1, letterSpacing: 0.3 },
});
