import type { ComponentProps } from "react";
import { Feather } from "@expo/vector-icons";
import { findGate, LABELS, ROLES, STATUS, type Role } from "../constants/domain";
import LiveBoardScreen from "../features/board/LiveBoardScreen";
import BoardingScreen from "../features/boarding/BoardingScreen";
import DashboardScreen from "../features/dashboard/DashboardScreen";
import GateInScreen from "../features/gate/GateInScreen";
import GateOutScreen from "../features/gate/GateOutScreen";
import MastersScreen from "../features/masters/MastersScreen";
import ParentScreen from "../features/parent/ParentScreen";
import ProfileScreen from "../features/profile/ProfileScreen";
import ReplaceScreen from "../features/replace/ReplaceScreen";
import ReportsScreen from "../features/reports/ReportsScreen";
import SettingsScreen from "../features/settings/SettingsScreen";
import type { DrawerParamList } from "./types";

/** Just enough of the session to decide what a person may see. */
export type Viewer = { role: Role; gateKind: "in" | "out" | null };

export type MenuItem = {
  name: keyof DrawerParamList;
  title: string;
  icon: ComponentProps<typeof Feather>["name"];
  component: React.ComponentType<any>;
  /** undefined = everyone signed in sees it. */
  show?: (v: Viewer) => boolean;
};

const isAdmin = (v: Viewer) => v.role === ROLES.admin;
/** A guard only ever sees the one direction their gate is for. */
const guardsGate = (kind: "in" | "out") => (v: Viewer) =>
  isAdmin(v) || (v.role === ROLES.security && v.gateKind === kind);

// Single place to add/remove a section. Order matters: the first item a
// person can see becomes their home screen.
export const MENU: MenuItem[] = [
  // ponytail: admin only for now — a teacher's job is the boarding list, so
  // that is what their app opens on.
  { name: "Dashboard", title: "Home", icon: "home", component: DashboardScreen, show: isAdmin },
  {
    name: "GateIn",
    title: LABELS.gateIn,
    icon: "log-in",
    component: GateInScreen,
    show: guardsGate("in"),
  },
  {
    name: "GateOut",
    title: LABELS.gateOut,
    icon: "log-out",
    component: GateOutScreen,
    show: guardsGate("out"),
  },
  {
    name: "Boarding",
    title: STATUS.boarding,
    icon: "users",
    component: BoardingScreen,
    show: (v) => v.role === ROLES.teacher || isAdmin(v),
  },
  {
    name: "MyChild",
    title: "My Children",
    icon: "heart",
    component: ParentScreen,
    show: (v) => v.role === ROLES.parent,
  },
  // The operations board lists every bus in the school — not a parent's view.
  {
    name: "LiveBoard",
    title: "Live Board",
    icon: "monitor",
    component: LiveBoardScreen,
    show: (v) => v.role !== ROLES.parent,
  },
  {
    name: "Replace",
    title: "Reserve / Replace",
    icon: "repeat",
    component: ReplaceScreen,
    show: isAdmin,
  },
  {
    name: "Reports",
    title: "Reports",
    icon: "bar-chart-2",
    component: ReportsScreen,
    show: (v) => v.role === ROLES.teacher || isAdmin(v),
  },
  { name: "Masters", title: "Masters", icon: "database", component: MastersScreen, show: isAdmin },
  { name: "Profile", title: "Profile", icon: "user", component: ProfileScreen },
  { name: "Settings", title: "Settings", icon: "settings", component: SettingsScreen, show: isAdmin },
];

export const toViewer = (user: { role: Role; gateId: string | null } | null): Viewer => ({
  role: user?.role ?? ROLES.security,
  gateKind: findGate(user?.gateId)?.kind ?? null,
});

export const visibleMenu = (viewer: Viewer) => MENU.filter((m) => !m.show || m.show(viewer));
