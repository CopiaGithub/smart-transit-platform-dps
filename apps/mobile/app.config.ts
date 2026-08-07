import type { ExpoConfig } from "expo/config";

// APP_ENV selects the backend + app identity. Set it when building:
//   APP_ENV=qa npx expo start        /  eas build --profile production
type AppEnv = "dev" | "qa" | "production";

const APP_ENV = (process.env.APP_ENV as AppEnv) || "dev";

const ENV: Record<AppEnv, { apiUrl: string; appName: string; debug: boolean }> = {
  dev: {
    // The API listens on 5199. 10.0.2.2 is the Android emulator's loopback to
    // the host — on a physical device swap it for the dev machine's LAN IP.
    apiUrl: "http://10.0.2.2:5199/api/",
    appName: "Transit Display (Dev)",
    debug: true,
  },
  qa: {
    apiUrl: "https://qa.example.com/api/",
    appName: "Transit Display (QA)",
    debug: true,
  },
  production: {
    apiUrl: "https://api.example.com/api/",
    appName: "Transit Display",
    debug: false,
  },
};

const env = ENV[APP_ENV];

const config: ExpoConfig = {
  name: env.appName,
  slug: "transit-display-platform",
  version: "1.0.0",
  orientation: "portrait",
  userInterfaceStyle: "light",
  scheme: "transitdisplay",
  icon: "./assets/icon.png",
  assetBundlePatterns: ["**/*"],
  ios: {
    supportsTablet: true,
    bundleIdentifier: "com.copiacs.transitdisplay",
  },
  android: {
    package: "com.copiacs.transitdisplay",
    versionCode: 1,
    // SDK 57 is edge-to-edge by default — no flag needed.
    predictiveBackGestureEnabled: false,
    adaptiveIcon: {
      backgroundColor: "#E6F4FE",
      foregroundImage: "./assets/android-icon-foreground.png",
      backgroundImage: "./assets/android-icon-background.png",
      monochromeImage: "./assets/android-icon-monochrome.png",
    },
  },
  web: {
    favicon: "./assets/favicon.png",
  },
  extra: {
    appEnv: APP_ENV,
    apiUrl: env.apiUrl,
    debug: env.debug,
  },
};

export default config;
