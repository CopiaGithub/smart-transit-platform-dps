/**
 * Server timestamps, and the one way to read them.
 *
 * Anything the API reads back from the database arrives as UTC with no zone
 * marker: SQL Server's `datetime2` does not store `DateTimeKind`, so EF hands
 * System.Text.Json an `Unspecified` DateTime and it writes
 * `2026-08-07T11:43:40.4592986` — no `Z`. A value that never went to the
 * database keeps its marker (the board's `GeneratedAt` ends in `Z`), so both
 * forms turn up side by side in a single response.
 *
 * JavaScript reads a date-time with no offset as *local* time. On an IST phone
 * that renders a 17:13 arrival as 11:43 — telling a parent their child's bus
 * came in five and a half hours before it did.
 *
 * So every server timestamp goes through here, and nothing calls `new Date()`
 * on an API field directly.
 */

/** True when the string already says which zone it is in. */
const hasZone = (iso: string) => /(?:Z|[+-]\d{2}:?\d{2})$/.test(iso);

export function parseServerTime(iso: string | null | undefined): Date | null {
  if (!iso) return null;

  // A bare date ("2026-08-07") carries no time to correct, and appending a
  // marker to it only produces something unparseable.
  const stamped = iso.includes("T") && !hasZone(iso) ? iso + "Z" : iso;

  const at = new Date(stamped);
  return Number.isNaN(at.getTime()) ? null : at;
}

/** "5:13 pm" in the phone's own zone, which is the school's. */
export function formatTime(iso: string | null | undefined, locale = "en-IN"): string | null {
  const at = parseServerTime(iso);
  return at?.toLocaleTimeString(locale, { hour: "2-digit", minute: "2-digit" }) ?? null;
}

/** Milliseconds between two server timestamps, or null if either is missing. */
export function elapsedMs(from: string | null | undefined, to: string | null | undefined) {
  const a = parseServerTime(from);
  const z = parseServerTime(to);
  return a && z ? z.getTime() - a.getTime() : null;
}

// ponytail: run with `npx tsx src/services/time.ts` — no test framework.
export function selfCheck() {
  const assert = (cond: boolean, msg: string) => {
    if (!cond) throw new Error("time: " + msg);
  };

  // The shape the database actually returns, and the whole reason this exists.
  const unmarked = parseServerTime("2026-08-07T11:43:40.4592986");
  assert(unmarked?.toISOString() === "2026-08-07T11:43:40.459Z", "unmarked is read as UTC");

  // A value that never touched the database already says so; leave it alone.
  const marked = parseServerTime("2026-08-07T13:20:29.3959326Z");
  assert(marked?.toISOString() === "2026-08-07T13:20:29.395Z", "an explicit Z is kept");

  // Both forms in one response must land on the same instant.
  assert(
    parseServerTime("2026-08-07T11:43:40Z")!.getTime() ===
      parseServerTime("2026-08-07T11:43:40")!.getTime(),
    "marked and unmarked agree",
  );

  // An offset other than Z is equally trustworthy.
  assert(
    parseServerTime("2026-08-07T17:13:40+05:30")!.toISOString() === "2026-08-07T11:43:40.000Z",
    "an explicit offset is kept",
  );

  // A bare date must not be mangled into something unparseable.
  assert(parseServerTime("2026-08-07") !== null, "a date-only value still parses");

  // Nothing in, nothing out — every caller has nullable columns.
  for (const empty of [null, undefined, "", "not a date"]) {
    assert(parseServerTime(empty) === null, `"${empty}" gives null`);
    assert(formatTime(empty) === null, `"${empty}" formats to null`);
  }

  // Durations were never wrong — both ends shift together — but they must keep
  // working through the parser.
  assert(
    elapsedMs("2026-08-07T11:00:00", "2026-08-07T11:12:30") === 12.5 * 60 * 1000,
    "elapsed is measured across the pair",
  );
  assert(elapsedMs("2026-08-07T11:00:00", null) === null, "elapsed needs both ends");

  return "time: all checks passed";
}

if (typeof require !== "undefined" && require.main === module) console.log(selfCheck());
