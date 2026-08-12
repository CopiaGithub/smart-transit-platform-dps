import type { ComponentProps } from "react";
import { Feather } from "@expo/vector-icons";
import { ROLES, STATUS } from "../constants/domain";
import { toViewer, type Viewer } from "../src/domain/roles";
import AttendanceScreen from "../features/attendance/AttendanceScreen";
import LiveBoardScreen from "../features/board/LiveBoardScreen";
import BoardingScreen from "../features/boarding/BoardingScreen";
import DashboardScreen from "../features/dashboard/DashboardScreen";
import GateScreen from "../features/gate/GateScreen";
import { gated } from "../features/session/gated";
import MastersScreen from "../features/masters/MastersScreen";
import ParentScreen from "../features/parent/ParentScreen";
import ProfileScreen from "../features/profile/ProfileScreen";
import ReplaceScreen from "../features/replace/ReplaceScreen";
import ReportsScreen from "../features/reports/ReportsScreen";
import YardMapScreen from "../features/yard/YardMapScreen";
import type { DrawerParamList } from "./types";

export type MenuItem = {
  name: keyof DrawerParamList;
  title: string;
  icon: ComponentProps<typeof Feather>["name"];
  component: React.ComponentType<any>;
  /** undefined = everyone signed in sees it. */
  show?: (v: Viewer) => boolean;
};

const isAdmin = (v: Viewer) => v.role === ROLES.admin;
/**
 * One entry, not two. A guard's role names their home post but no longer limits
 * them to it — the direction is picked on the screen, because posts get covered
 * mid-shift and a second menu item they were forbidden to open never helped.
 */
const worksAGate = (v: Viewer) => v.role === ROLES.security || isAdmin(v);

// Single place to add/remove a section. Order matters: the first item a
// person can see becomes their home screen.
export const MENU: MenuItem[] = [
  // ponytail: admin only for now — a teacher's job is the boarding list, so
  // that is what their app opens on.
  { name: "Dashboard", title: "Home", icon: "home", component: DashboardScreen, show: isAdmin },
  {
    name: "Gate",
    title: "Gate",
    icon: "shield",
    component: gated(GateScreen),
    show: worksAGate,
  },
  {
    name: "Boarding",
    title: STATUS.boarding,
    icon: "users",
    component: gated(BoardingScreen),
    show: (v) => v.role === ROLES.teacher || isAdmin(v),
  },
  // Not gated by a dispersal session: a class is marked in the morning, hours
  // before anybody opens one.
  {
    name: "Attendance",
    title: "Attendance",
    icon: "check-square",
    component: AttendanceScreen,
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
  // Not gated by a session: the yard is a real place whether or not a dispersal
  // is running, and an admin setting the platform order wants to see the layout.
  {
    name: "YardMap",
    title: "Yard map",
    icon: "grid",
    component: YardMapScreen,
    show: isAdmin,
  },
  {
    name: "Replace",
    title: "Reserve / Replace",
    icon: "repeat",
    component: gated(ReplaceScreen),
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
];



export const visibleMenu = (viewer: Viewer) => MENU.filter((m) => !m.show || m.show(viewer));

export { toViewer, type Viewer };
