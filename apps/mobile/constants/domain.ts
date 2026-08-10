// Domain vocabulary lives here so the same app can ship to a school (Bus /
// Station) or a warehouse (Vehicle / Bay) by editing this file only.
export const LABELS = {
  app: "Transit Display Platform",
  school: "DPS Nerul",
  vehicle: "Bus",
  vehiclePlural: "Buses",
  vehicleNo: "Bus No.",
  slot: "Station",
  slotPlural: "Stations",
  route: "Route",
  // Two different things, deliberately named apart. The first pair names the
  // guard's post — that is what a menu entry is, a place you go. The second
  // names what they do there, so a button reads as an instruction. "Gate Out"
  // was doing both jobs and sounded like freight terminal wording either way.
  // The verbs match the manual's own §5.1 wording, "Record a bus in / out".
  gateIn: "Entry Gate",
  gateOut: "Exit Gate",
  recordIn: "Record In",
  recordOut: "Record Out",
};

/** Station numbers painted on the ground, boarding point -> exit gate. */
export const SLOT_COUNT = 21;

/**
 * Only three statuses exist, one per person who can cause it:
 *   entry-gate security -> Arrived, teacher/driver -> Boarding,
 *   exit-gate security  -> Departed.
 * A bus that has not reached the gate yet has `null` — it is on no board.
 */
export const STATUS = {
  waiting: "Waiting",
  arrived: "Arrived",
  boarding: "Boarding",
  departed: "Departed",
  replaced: "Replaced",
} as const;

export type Status = (typeof STATUS)[keyof typeof STATUS];
export type BusStatus = Status | null;

export const STATUS_COLOR: Record<Status, string> = {
  Waiting: "#64748B",
  Arrived: "#2563EB",
  Boarding: "#E6A700",
  Departed: "#16A34A",
  Replaced: "#A855F7",
};

/** Board order (§5.9): whoever students must act on first sits at the top. */
export const STATUS_RANK: Record<Status, number> = {
  Boarding: 0,
  Arrived: 1,
  Waiting: 2,
  Replaced: 3,
  Departed: 4,
};

/** What each status means to the person reading it, in their own words. */
export const STATUS_HINT: Record<Status, string> = {
  Waiting: "Inside, holding — every platform is occupied",
  Arrived: "At its platform, students walking to it",
  Boarding: "Students are getting in now",
  Departed: "Left through the exit gate",
  Replaced: "Pulled out of service, a reserve took over",
};

// ── who is using the app ────────────────────────────────────────────────────
export const ROLES = {
  security: "security",
  teacher: "teacher",
  parent: "parent",
  admin: "admin",
} as const;

export type Role = (typeof ROLES)[keyof typeof ROLES];

export const ROLE_LABEL: Record<Role, string> = {
  security: "Security",
  teacher: "Teacher",
  parent: "Parent",
  admin: "Admin",
};

/**
 * A security guard is posted at one gate for the shift and picks it at login.
 * Entry gates can only let buses in, exit gates can only let them out — that
 * single choice is what keeps the guard's screen down to one button.
 *
 * The gates themselves are no longer listed here. They come from GateMaster and
 * are mapped by `toGates` in src/domain/roles.ts, so adding Gate 3 is a row in
 * the database rather than a release.
 */
export type Gate = { id: string; label: string; kind: "in" | "out" };

export const findGate = (gates: Gate[], id?: string | null) =>
  gates.find((g) => g.id === id) ?? null;
