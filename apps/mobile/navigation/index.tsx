import { DefaultTheme, NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { useEffect } from "react";
import { StatusBar, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import OfflineBanner from "../components/OfflineBanner";
import { COLORS } from "../constants/theme";
import SignInScreen from "../features/auth/SignInScreen";
import SplashScreen from "../features/splash/SplashScreen";
import { navigationRef } from "../src/services/navigationRef";
import { restoreSession } from "../src/store/auth.slice";
import { useAppDispatch, useAppSelector } from "../src/store";
import AppDrawer from "./AppDrawer";
import linking from "./linking";
import type { RootStackParamList } from "./types";

const AppTheme = {
  ...DefaultTheme,
  colors: { ...DefaultTheme.colors, background: COLORS.screenBg },
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function Navigation() {
  return (
    <>
      {/* App-wide status bar — screens must not mount their own. */}
      <StatusBar backgroundColor={COLORS.statusBar} barStyle="light-content" />
      <NavigationContainer ref={navigationRef} linking={linking} theme={AppTheme}>
        <View style={{ flex: 1 }}>
          <OfflineBanner />
          <RootNavigator />
        </View>
      </NavigationContainer>
      {/* Edge-to-edge Android ignores StatusBar backgroundColor, so paint it. */}
      <StatusBarUnderlay />
    </>
  );
}

function StatusBarUnderlay() {
  const insets = useSafeAreaInsets();
  return (
    <View
      pointerEvents="none"
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        height: insets.top,
        backgroundColor: COLORS.statusBar,
      }}
    />
  );
}

/**
 * Auth decides which screens exist, rather than any screen pushing the user
 * around. Dropping the token — Sign out, a 401, an expired session — unmounts
 * the whole drawer and leaves Login as the only route, so there is no way to
 * go back into the app on a dead session.
 */
function RootNavigator() {
  const dispatch = useAppDispatch();
  const token = useAppSelector((s) => s.auth.token);
  const booted = useAppSelector((s) => s.auth.booted);

  useEffect(() => {
    dispatch(restoreSession());
  }, [dispatch]);

  if (!booted) return <SplashScreen />;

  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: COLORS.primary },
        headerTintColor: COLORS.white,
        headerTitleStyle: { color: COLORS.white, fontSize: 18, fontWeight: "700" },
        headerTitleAlign: "center",
        headerShadowVisible: false,
        headerBackButtonDisplayMode: "minimal",
        // Opaque card: a transparent one bleeds the outgoing screen through
        // the incoming one for the whole push animation.
        contentStyle: { backgroundColor: COLORS.screenBg },
        animation: "slide_from_right",
      }}
    >
      {token ? (
        // Drawer brings its own header (with the hamburger).
        <Stack.Screen name="Main" component={AppDrawer} options={{ headerShown: false }} />
      ) : (
        // SignInScreen picks the MPIN pad or the password form behind this one
        // route, so auth still decides only "token or no token".
        <Stack.Screen name="Login" component={SignInScreen} options={{ headerShown: false }} />
      )}
    </Stack.Navigator>
  );
}
