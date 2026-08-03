import type { NavigatorScreenParams } from "@react-navigation/native";

// Drawer = the hamburger menu sections.
export type DrawerParamList = {
  Dashboard: undefined;
  GateIn: undefined;
  GateOut: undefined;
  LiveBoard: undefined;
  Replace: undefined;
  Reports: undefined;
  Masters: undefined;
  Settings: undefined;
};

// Root stack = auth flow + the drawer.
export type RootStackParamList = {
  Splash: undefined;
  Login: undefined;
  Main: NavigatorScreenParams<DrawerParamList>;
};

declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}
