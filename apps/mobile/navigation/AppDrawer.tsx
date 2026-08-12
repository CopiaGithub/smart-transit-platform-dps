import { Feather } from "@expo/vector-icons";
import { createDrawerNavigator } from "@react-navigation/drawer";
import { useEffect, useRef } from "react";
import { BOARD, COLORS, RADIUS } from "../constants/theme";
import { fetchGates, selectGateRows } from "../src/store/masters.slice";
import { useAppDispatch, useAppSelector } from "../src/store";
import DrawerContent from "./DrawerContent";
import HeaderTitle from "./HeaderTitle";
import { toViewer, visibleMenu } from "./menu";
import type { DrawerParamList } from "./types";

const Drawer = createDrawerNavigator<DrawerParamList>();

export default function AppDrawer() {
  const dispatch = useAppDispatch();
  const roleName = useAppSelector((s) => s.auth.user?.roleName);
  const gateRows = useAppSelector(selectGateRows);

  // The one place the posts are read. This mounts once, after sign-in, and every
  // screen that names a gate reads the result out of the store.
  useEffect(() => {
    dispatch(fetchGates());
  }, [dispatch]);

  // Signing out clears the user while this drawer is still mounted, and an
  // absent role reads as `parent` — so the menu would swap from eleven screens
  // to two in the frame before the navigator tears down. Fabric crashes trying
  // to re-parent the drawer's clipping scroll view when that many items are
  // pulled out mid-teardown ("The specified child already has a parent").
  //
  // A role only ever changes across a sign-in, and the drawer is unmounted for
  // that, so the first one it sees is the right one for its whole life.
  const roleAtMount = useRef(roleName);
  if (roleName) roleAtMount.current = roleName;

  // Deliberately does not wait for the gates. The menu and the screen a person
  // lands on come from the role alone, so a slow or dead network cannot drop a
  // guard onto a parent's menu — see toViewer.
  const items = visibleMenu(toViewer(roleAtMount.current, gateRows));

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
