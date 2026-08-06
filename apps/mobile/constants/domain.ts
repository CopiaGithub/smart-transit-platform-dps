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
  gateIn: "Gate In",
  gateOut: "Gate Out",
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
  arrived: "Arrived",
  boarding: "Boarding",
  departed: "Departed",
} as const;

export type Status = (typeof STATUS)[keyof typeof STATUS];
export type BusStatus = Status | null;

export const STATUS_COLOR: Record<Status, string> = {
  Arrived: "#2563EB",
  Boarding: "#E6A700",
  Departed: "#16A34A",
};

/** Board order: whoever needs attention first sits at the top. */
export const STATUS_RANK: Record<Status, number> = {
  Boarding: 0,
  Arrived: 1,
  Departed: 2,
};

// ── who is using the app ────────────────────────────────────────────────────
export const ROLES = {
  security: "security",
  teacher: "teacher",
  admin: "admin",
} as const;

export type Role = (typeof ROLES)[keyof typeof ROLES];

export const ROLE_LABEL: Record<Role, string> = {
  security: "Security",
  teacher: "Teacher",
  admin: "Admin",
};

/**
 * A security guard is posted at one gate for the shift and picks it at login.
 * Entry gates can only let buses in, exit gates can only let them out — that
 * single choice is what keeps the guard's screen down to one button.
 */
export type Gate = { id: string; label: string; kind: "in" | "out" };

// The two gates DPS actually uses: buses enter at 6, leave from 1.
// ponytail: hardcoded until the Masters API ships — add rows, nothing else.
export const GATES: Gate[] = [
  { id: "g6", label: "Gate 6", kind: "in" },
  { id: "g1", label: "Gate 1", kind: "out" },
];

export const findGate = (id?: string | null) => GATES.find((g) => g.id === id) ?? null;
