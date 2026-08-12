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
          Dashboard: "home",
          Gate: "gate",
          Boarding: "boarding",
          Attendance: "attendance",
          MyChild: "my-children",
          // Kiosk-friendly: the LED controllers can deep-link straight here.
          LiveBoard: "board",
          Replace: "replace",
          Reports: "reports",
          Masters: "masters",
          Profile: "profile",
        },
      },
    },
  },
};

export default linking;
