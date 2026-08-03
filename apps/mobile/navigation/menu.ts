import type { ComponentProps } from "react";
import { Feather } from "@expo/vector-icons";
import { LABELS } from "../constants/domain";
import LiveBoardScreen from "../features/board/LiveBoardScreen";
import DashboardScreen from "../features/dashboard/DashboardScreen";
import GateInScreen from "../features/gatein/GateInScreen";
import GateOutScreen from "../features/gateout/GateOutScreen";
import MastersScreen from "../features/masters/MastersScreen";
import ReplaceScreen from "../features/replace/ReplaceScreen";
import ReportsScreen from "../features/reports/ReportsScreen";
import SettingsScreen from "../features/settings/SettingsScreen";
import type { DrawerParamList } from "./types";

export type MenuItem = {
  name: keyof DrawerParamList;
  title: string;
  icon: ComponentProps<typeof Feather>["name"];
  component: React.ComponentType<any>;
  /** undefined = visible to everyone. Otherwise the roles allowed to see it. */
  roles?: string[];
};

// Single place to add/remove a hamburger section — the drawer and the
// dashboard shortcuts both read this.
export const MENU: MenuItem[] = [
  { name: "Dashboard", title: "Operations", icon: "grid", component: DashboardScreen },
  { name: "GateIn", title: LABELS.gateIn, icon: "log-in", component: GateInScreen },
  { name: "GateOut", title: LABELS.gateOut, icon: "log-out", component: GateOutScreen },
  { name: "LiveBoard", title: "Live Board", icon: "monitor", component: LiveBoardScreen },
  {
    name: "Replace",
    title: "Reserve / Replace",
    icon: "repeat",
    component: ReplaceScreen,
  },
  { name: "Reports", title: "Reports", icon: "bar-chart-2", component: ReportsScreen },
  {
    name: "Masters",
    title: "Masters",
    icon: "database",
    component: MastersScreen,
    roles: ["admin", "operator"],
  },
  { name: "Settings", title: "Settings", icon: "settings", component: SettingsScreen },
];

export const visibleMenu = (role?: string | null) =>
  MENU.filter((m) => !m.roles || (role != null && m.roles.includes(role)));
