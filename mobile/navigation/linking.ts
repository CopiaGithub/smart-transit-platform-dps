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
          Dashboard: "operations",
          GateIn: "gate-in",
          GateOut: "gate-out",
          // Kiosk-friendly: the LED controllers can deep-link straight here.
          LiveBoard: "board",
          Replace: "replace",
          Reports: "reports",
          Masters: "masters",
          Settings: "settings",
        },
      },
    },
  },
};

export default linking;
