import type { ComponentProps } from "react";
import { Feather } from "@expo/vector-icons";
import AlertsScreen from "../features/alerts/AlertsScreen";
import AssetsScreen from "../features/assets/AssetsScreen";
import DashboardScreen from "../features/dashboard/DashboardScreen";
import DisplaysScreen from "../features/displays/DisplaysScreen";
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

// Single place to add/remove a hamburger section — the drawer and any
// dashboard menu grid both read this.
export const MENU: MenuItem[] = [
  { name: "Dashboard", title: "Dashboard", icon: "home", component: DashboardScreen },
  { name: "Displays", title: "Displays", icon: "monitor", component: DisplaysScreen },
  { name: "Assets", title: "Assets", icon: "truck", component: AssetsScreen },
  { name: "Alerts", title: "Alerts", icon: "bell", component: AlertsScreen },
  { name: "Settings", title: "Settings", icon: "settings", component: SettingsScreen, roles: ["admin", "operator"] },
];

export const visibleMenu = (role?: string | null) =>
  MENU.filter((m) => !m.roles || (role != null && m.roles.includes(role)));
