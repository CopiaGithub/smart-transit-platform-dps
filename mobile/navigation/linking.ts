import * as Linking from "expo-linking";
import type { LinkingOptions } from "@react-navigation/native";
import type { RootStackParamList } from "./types";

const linking: LinkingOptions<RootStackParamList> = {
  prefixes: [Linking.createURL("/")],
  config: {
    screens: {
      Login: "login",
      Main: {
        screens: {
          Dashboard: "dashboard",
          Displays: "displays",
          Assets: "assets",
          Alerts: "alerts",
          Settings: "settings",
        },
      },
      DisplayDetail: "displays/:displayId",
    },
  },
};

export default linking;
