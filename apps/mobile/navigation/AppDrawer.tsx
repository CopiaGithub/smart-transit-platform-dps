import { Feather } from "@expo/vector-icons";
import { createDrawerNavigator } from "@react-navigation/drawer";
import { BOARD, COLORS, RADIUS } from "../constants/theme";
import { useAppSelector } from "../src/store";
import DrawerContent from "./DrawerContent";
import { visibleMenu } from "./menu";
import type { DrawerParamList } from "./types";

const Drawer = createDrawerNavigator<DrawerParamList>();

export default function AppDrawer() {
  const role = useAppSelector((s) => s.auth.user?.role);
  const items = visibleMenu(role);

  return (
    <Drawer.Navigator
      drawerContent={(props) => <DrawerContent {...props} />}
      screenOptions={{
        headerStyle: { backgroundColor: COLORS.primary },
        headerTintColor: COLORS.white,
        headerTitleStyle: { color: COLORS.white, fontWeight: "700" },
        headerShadowVisible: false,
        drawerActiveTintColor: COLORS.white,
        drawerActiveBackgroundColor: COLORS.primary,
        drawerInactiveTintColor: COLORS.text,
        drawerItemStyle: { borderRadius: RADIUS.md },
        drawerLabelStyle: { fontWeight: "600" },
        sceneStyle: { backgroundColor: COLORS.screenBg },
      }}
    >
      {items.map((item) => (
        <Drawer.Screen
          key={item.name}
          name={item.name}
          component={item.component}
          options={{
            title: item.title,
            // The board mirrors an LED wall, so its chrome stays dark too.
            ...(item.name === "LiveBoard" && {
              headerStyle: { backgroundColor: BOARD.header },
              headerTitleStyle: { color: BOARD.amber, fontWeight: "700" as const },
            }),
            drawerIcon: ({ color, size }) => (
              <Feather name={item.icon} size={size} color={color} />
            ),
          }}
        />
      ))}
    </Drawer.Navigator>
  );
}
