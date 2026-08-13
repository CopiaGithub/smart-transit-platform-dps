/**
 * Server timestamps, and the one way to read them.
 *
 * Port of apps/mobile/src/services/time.ts — same problem, same fix, so the two
 * clients agree on what time a bus arrived.
 *
 * Anything the API reads back from the database arrives as UTC with no zone
 * marker: SQL Server's `datetime2` does not store `DateTimeKind`, so EF hands
 * System.Text.Json an `Unspecified` DateTime and it writes
 * `2026-08-07T11:43:40.4592986` — no `Z`. A value that never went to the
 * database keeps its marker (the board's `GeneratedAt` ends in `Z`), so both
 * forms turn up side by side in a single response.
 *
 * JavaScript reads a date-time with no offset as *local* time. In IST that
 * renders a 17:13 arrival as 11:43 — five and a half hours before it happened.
 *
 * So every server timestamp goes through here, and nothing calls `new Date()`
 * on an API field directly.
 */

/** True when the string already says which zone it is in. */
const hasZone = (iso: string): boolean => /(?:Z|[+-]\d{2}:?\d{2})$/.test(iso);

export function parseServerTime(iso: string | null | undefined): Date | null {
  if (!iso) return null;

  // A bare date ("2026-08-07") carries no time to correct, and appending a
  // marker to it only produces something unparseable.
  const stamped = iso.includes('T') && !hasZone(iso) ? `${iso}Z` : iso;

  const at = new Date(stamped);
  return Number.isNaN(at.getTime()) ? null : at;
}

/** "17:13" in the browser's own zone, which is the school's. */
export function formatServerTime(
  iso: string | null | undefined,
  locale = 'en-GB',
): string | null {
  const at = parseServerTime(iso);
  return (
    at?.toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' }) ?? null
  );
}

/** Milliseconds between two server timestamps, or null if either is missing. */
export function elapsedMs(
  from: string | null | undefined,
  to: string | null | undefined,
): number | null {
  const a = parseServerTime(from);
  const z = parseServerTime(to);
  return a && z ? z.getTime() - a.getTime() : null;
}
