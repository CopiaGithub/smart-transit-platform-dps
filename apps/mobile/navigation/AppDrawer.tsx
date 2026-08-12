import { Feather } from "@expo/vector-icons";
import { createDrawerNavigator } from "@react-navigation/drawer";
import { useEffect } from "react";
import { BOARD, COLORS, RADIUS } from "../constants/theme";
import { useViewer } from "../features/auth/useViewer";
import { fetchGates } from "../src/store/masters.slice";
import { useAppDispatch } from "../src/store";
import DrawerContent from "./DrawerContent";
import HeaderTitle from "./HeaderTitle";
import { visibleMenu } from "./menu";
import type { DrawerParamList } from "./types";

const Drawer = createDrawerNavigator<DrawerParamList>();

export default function AppDrawer() {
  const dispatch = useAppDispatch();
  // Through useViewer rather than the store directly, so the menu holds still
  // while the session is torn down — see the note there.
  const viewer = useViewer();

  // The one place the posts are read. This mounts once, after sign-in, and every
  // screen that names a gate reads the result out of the store.
  useEffect(() => {
    dispatch(fetchGates());
  }, [dispatch]);

  // Deliberately does not wait for the gates. The menu and the screen a person
  // lands on come from the role alone, so a slow or dead network cannot drop a
  // guard onto a parent's menu — see toViewer.
  const items = visibleMenu(viewer);

  return (
    <Drawer.Navigator
      // First section a person can see is their home — a guard lands straight
      // on their gate screen instead of a dashboard they cannot act on.
      initialRouteName={items[0]?.name}
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
            // Every screen carries the dispersal date under its name, so a
            // guard glancing down always knows which afternoon they are in.
            headerTitle: () => (
              <HeaderTitle
                title={item.title}
                tint={item.name === "LiveBoard" ? BOARD.amber : COLORS.white}
                subTint={item.name === "LiveBoard" ? BOARD.dim : "#FFFFFFB3"}
              />
            ),
            // The board mirrors an LED wall, so its chrome stays dark too.
            ...(item.name === "LiveBoard" && {
              headerStyle: { backgroundColor: BOARD.header },
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
