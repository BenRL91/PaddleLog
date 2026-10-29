import type { ExpoConfig } from "expo/config";
const config: ExpoConfig = {
  name: "PaddleLog",
  slug: "paddlelog",
  version: "0.1.0",
  scheme: "paddlelog",
  orientation: "portrait",
  userInterfaceStyle: "automatic",
  icon: "./assets/icon.png",
  ios: {
    supportsTablet: true,
    bundleIdentifier: process.env.PADDLELOG_APP_ID || "com.leewaypb.paddlelog",
    config: { usesNonExemptEncryption: false },
  },
  android: {
    package: process.env.PADDLELOG_APP_ID || "com.leewaypb.paddlelog",
  },
  plugins: ["expo-secure-store", "expo-web-browser"],
};
export default config;
