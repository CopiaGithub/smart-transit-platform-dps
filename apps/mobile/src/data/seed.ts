import { ROLES, type BusStatus, type Role } from "../../constants/domain";

export type Driver = { name: string; mobile: string };

export type Bus = {
  id: string;
  no: string;
  route: string;
  reserve: boolean;
  /** Shown to parents. Optional: a bus added in Masters may not have one yet. */
  driver?: Driver;
  /** Station assigned on arrival. Kept after departure so reports can show it. */
  slot: number | null;
  /** null until the bus reaches the entry gate. */
  status: BusStatus;
  arrivedAt: number | null;
  departedAt: number | null;
  /** Set on the bus that was pulled out of service. */
  replacedByNo?: string;
};

// 45 running buses, as per the DPS fleet list.
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
  "Nerul – Sector 48 Seawoods",
  "Belapur – Sector 11",
  "Kharghar – Owe Camp",
  "Kharghar – Sector 35",
  "Vashi – Sector 9 Hospital",
  "Koperkhairane – Sector 20",
  "Airoli – Sector 8A",
  "Ghansoli – Talavali",
  "Sanpada – Sector 5",
  "Nerul – Sector 21 Jewel",
  "Seawoods – Sector 54",
  "Panvel – New Panvel East",
  "Kamothe – Sector 20",
  "Ulwe – Sector 23",
  "Taloja – Padghe",
  "Turbhe – Sector 26",
  "Juinagar – Sector 16",
  "Vashi – Sector 28",
  "Belapur – Parsik Hill",
  "Nerul – Sector 3 Karave Gaon",
  "Kharghar – Hiranandani",
];

const DRIVERS = [
  "R. Shinde", "V. More", "S. Jadhav", "P. Gaikwad", "A. Chavan", "M. Bhosale",
  "D. Kadam", "N. Salunkhe", "K. Waghmare", "T. Patil", "G. Sawant", "B. Thorat",
];

export const SEED_FLEET: Bus[] = [
  ...ROUTES.map((route, i) => ({
    id: `b${i + 1}`,
    no: String(i + 1).padStart(2, "0"),
    route,
    reserve: false,
    driver: {
      name: DRIVERS[i % DRIVERS.length],
      mobile: `98200${11000 + i}`,
    },
    slot: null,
    status: null as BusStatus,
    arrivedAt: null,
    departedAt: null,
  })),
  // Spares keep plain numbers so a guard can type them on the keypad too.
  ...["46", "47"].map((no, i) => ({
    id: `r${i + 1}`,
    no,
    route: "Reserve – unassigned",
    reserve: true,
    slot: null,
    status: null as BusStatus,
    arrivedAt: null,
    departedAt: null,
  })),
];

/**
 * The user master doubles as the login directory: role and gate are properties
 * of the person, not something they pick at sign-in. A guard transferred from
 * Gate 6 to Gate 1 is an admin edit here, nothing the guard can get wrong.
 */
export type Operator = {
  id: string;
  name: string;
  username: string;
  mobile: string;
  role: Role;
  /** Which gate a guard is posted at. null for everyone else. */
  gateId: string | null;
};

export const SEED_USERS: Operator[] = [
  { id: "u1", name: "R. Kamble", username: "kamble", mobile: "1111111111", role: ROLES.security, gateId: "g6" },
  { id: "u2", name: "M. Iyer", username: "iyer", mobile: "2222222222", role: ROLES.teacher, gateId: null },
  { id: "u3", name: "S. Pawar", username: "pawar", mobile: "3333333333", role: ROLES.security, gateId: "g1" },
  { id: "u4", name: "A. Deshmukh", username: "admin", mobile: "4444444444", role: ROLES.admin, gateId: null },
  { id: "u5", name: "S. Joshi", username: "parent", mobile: "5555555555", role: ROLES.parent, gateId: null },
];

/**
 * A parent only ever sees the buses their own children ride, so the link goes
 * on the student. Several parents can watch the same child (mother, father,
 * guardian) — hence a list.
 */
export type Student = {
  id: string;
  name: string;
  grade: string;
  division: string;
  busId: string;
  parentIds: string[];
};

export const SEED_STUDENTS: Student[] = [
  { id: "s1", name: "Aarav Joshi", grade: "4", division: "B", busId: "b24", parentIds: ["u5"] },
  { id: "s2", name: "Anaya Joshi", grade: "1", division: "A", busId: "b11", parentIds: ["u5"] },
];
