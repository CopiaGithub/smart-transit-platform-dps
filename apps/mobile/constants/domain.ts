// Domain vocabulary lives here so the same app can ship to a school (Bus /
// Station) or a warehouse (Vehicle / Bay) by editing this file only.
export const LABELS = {
  vehicle: "Bus",
  vehiclePlural: "Buses",
  vehicleNo: "Bus No.",
  slot: "Station",
  slotPlural: "Stations",
  route: "Route",
  gateIn: "Gate In",
  gateOut: "Gate Out",
};

/** Physical slots marked along the compound, boarding point -> exit gate. */
export const SLOT_COUNT = 23;

export const STATUS = {
  waiting: "Waiting",
  arrived: "Arrived",
  boarding: "Boarding",
  departed: "Departed",
  replaced: "Replaced",
} as const;

export type Status = (typeof STATUS)[keyof typeof STATUS];

export const STATUS_COLOR: Record<Status, string> = {
  Waiting: "#64748B",
  Arrived: "#3B82F6",
  Boarding: "#F59E0B",
  Departed: "#22C55E",
  Replaced: "#A855F7",
};

/** Order used for sorting the live board: active work first. */
export const STATUS_RANK: Record<Status, number> = {
  Boarding: 0,
  Arrived: 1,
  Waiting: 2,
  Replaced: 3,
  Departed: 4,
};
