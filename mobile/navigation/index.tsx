import { DefaultTheme, NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { StatusBar, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import OfflineBanner from "../components/OfflineBanner";
import { COLORS } from "../constants/theme";
import LoginScreen from "../features/auth/LoginScreen";
import DisplayDetailScreen from "../features/displays/DisplayDetailScreen";
import SplashScreen from "../features/splash/SplashScreen";
import { navigationRef } from "../src/services/navigationRef";
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

function RootNavigator() {
  return (
    <Stack.Navigator
      initialRouteName="Splash"
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
      <Stack.Screen name="Splash" component={SplashScreen} options={{ headerShown: false }} />
      <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
      {/* Drawer brings its own header (with the hamburger). */}
      <Stack.Screen name="Main" component={AppDrawer} options={{ headerShown: false }} />
      <Stack.Screen
        name="DisplayDetail"
        component={DisplayDetailScreen}
        options={({ route }) => ({ title: route.params.name })}
      />
    </Stack.Navigator>
  );
}
