import type { ExpoConfig } from "expo/config";

// APP_ENV selects the backend + app identity. Set it when building:
//   APP_ENV=qa npx expo start        /  eas build --profile production
type AppEnv = "dev" | "qa" | "production";

const APP_ENV = (process.env.APP_ENV as AppEnv) || "dev";

const ENV: Record<AppEnv, { apiUrl: string; appName: string; debug: boolean }> =
  {
    dev: {
      // Hosted dev API. The host and the path repeat the same three letters —
      // site tdpdev, application tdpdevapi — so they are easy to transpose, and
      // the wrong way round is a 404 that reads like a routing bug. Verified
      // against the live server: the "tdp" spelling answers 200, "tpd" is a 404.
      //
      // Local backend, for when you are running `dotnet run` on this machine.
      // apiClient swaps `localhost` for whatever host Metro is served from, so
      // the one line works on the emulator and on a phone over Wi-Fi:
      //   "http://localhost:5199/api/"
      apiUrl: "https://tdpdev.copiacs.com/tdpdevapi/api/",
      // appName: "Transit Display (Dev)",
      appName: "Transit Display",
      debug: true,
    },
    qa: {
      apiUrl: "https://tdpdev.copiacs.com/tdpdevapi/api/",
      // appName: "Transit Display (QA)",
      appName: "Transit Display",
      debug: false,
    },
    production: {
      apiUrl: "https://tdpdev.copiacs.com/tdpdevapi/api/",
      appName: "Transit Display",
      debug: false,
    },
  };

const env = ENV[APP_ENV];

const config: ExpoConfig = {
  name: env.appName,
  slug: "transit-display-platform",
  // The EAS account the project belongs to. Stated because the signed-in user is
  // a member of the organisation rather than its owner — without it the CLI looks
  // for the project under whoever happens to be logged in.
  owner: "copiacs",
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
  // Both plugins only take effect in a development or store build. In Expo Go
  // the Info.plist is Expo Go's own, so iOS Face ID is unavailable there and
  // the unlock screen falls back to the MPIN — see features/auth/unlock.ts.
  plugins: [
    "expo-secure-store",
    [
      "expo-local-authentication",
      {
        faceIDPermission:
          "Allow $(PRODUCT_NAME) to unlock with Face ID instead of a password.",
      },
    ],
  ],
  extra: {
    appEnv: APP_ENV,
    apiUrl: env.apiUrl,
    debug: env.debug,
    // Written by hand: `eas init` can edit app.json for you but not a
    // app.config.ts, because it cannot safely rewrite executable code. This ties
    // the folder to the project at expo.dev/accounts/copiacs — builds, versions
    // and credentials all hang off it, so it must not change.
    eas: {
      projectId: "766551b3-97fa-4c23-8aa1-7534cde7685a",
    },
  },
};

export default config;
