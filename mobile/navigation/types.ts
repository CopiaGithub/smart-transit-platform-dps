import type { NavigatorScreenParams } from "@react-navigation/native";

// Drawer = the hamburger menu sections.
export type DrawerParamList = {
  Dashboard: undefined;
  Displays: undefined;
  Assets: undefined;
  Alerts: undefined;
  Settings: undefined;
};

// Root stack = auth flow + the drawer + every pushed detail screen.
export type RootStackParamList = {
  Splash: undefined;
  Login: undefined;
  Main: NavigatorScreenParams<DrawerParamList>;
  DisplayDetail: { displayId: string; name: string };
};

declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}
