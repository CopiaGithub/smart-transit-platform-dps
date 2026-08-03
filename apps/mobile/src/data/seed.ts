import type { Status } from "../../constants/domain";

export type Bus = {
  id: string;
  no: string;
  route: string;
  reserve: boolean;
  /** Slot assigned on arrival. Kept after departure so reports can show it. */
  slot: number | null;
  status: Status;
  arrivedAt: number | null;
  departedAt: number | null;
  /** Set on the bus that was pulled out of service. */
  replacedByNo?: string;
};

const ROUTES = [
  "Nerul East – Sector 12",
  "Nerul West – Palm Beach",
  "Seawoods – Darave",
  "Vashi – Sector 17",
  "Sanpada – Juinagar",
  "Kharghar – Sector 20",
  "CBD Belapur – Artist Village",
  "Kopar Khairane – Sector 15",
  "Airoli – Rabale",
  "Ghansoli – Sector 9",
  "Panvel – Khanda Colony",
  "Ulwe – Sector 19",
  "Taloja – Phase 2",
  "Turbhe – Sector 21",
  "Sarsole – Karave",
  "Shiravane – NRI Complex",
  "Millennium Towers",
  "Sector 44 – Seawoods Grand",
  "Kukshet – Nerul Gaon",
  "Sector 27 – Vashi Plaza",
  "Kalamboli – Roadpali",
  "Kamothe – Sector 34",
  "Dronagiri – Sector 4",
  "Nerul – Sector 6 Market",
];

// 24 running buses against 23 marked slots — the yard genuinely overflows,
// which is the case the operator console has to handle gracefully.
export const SEED_FLEET: Bus[] = [
  ...ROUTES.map((route, i) => ({
    id: `b${i + 1}`,
    no: String(i + 1).padStart(2, "0"),
    route,
    reserve: false,
    slot: null,
    status: "Waiting" as Status,
    arrivedAt: null,
    departedAt: null,
  })),
  ...["R1", "R2"].map((no, i) => ({
    id: `r${i + 1}`,
    no,
    route: "Reserve – unassigned",
    reserve: true,
    slot: null,
    status: "Waiting" as Status,
    arrivedAt: null,
    departedAt: null,
  })),
];

export type Operator = { id: string; name: string; role: string; post: string };

export const SEED_USERS: Operator[] = [
  { id: "u1", name: "R. Kamble", role: "Gate In Security", post: "Gate No. 6" },
  { id: "u2", name: "S. Pawar", role: "Gate Out Security", post: "Gate No. 1" },
  { id: "u3", name: "A. Deshmukh", role: "Transport Admin", post: "Office" },
];
