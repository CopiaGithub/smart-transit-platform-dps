import type { NavigatorScreenParams } from "@react-navigation/native";

// Drawer = the hamburger menu sections. Which of them a person actually gets
// is decided in menu.ts by their role and gate.
export type DrawerParamList = {
  Dashboard: undefined;
  /** Entry and exit in one screen — the direction is picked inside it. */
  Gate: undefined;
  Boarding: undefined;
  Attendance: undefined;
  MyChild: undefined;
  LiveBoard: undefined;
  /** The compound drawn as it is on the ground. Admin only, read only. */
  YardMap: undefined;
  Replace: undefined;
  Reports: undefined;
  Masters: undefined;
  Profile: undefined;
};

// Root stack. Exactly one of these is mounted at a time, decided by whether
// there is a token — see navigation/index.tsx.
export type RootStackParamList = {
  Login: undefined;
  Main: NavigatorScreenParams<DrawerParamList>;
};

declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}
