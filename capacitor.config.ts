import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "ai.civicfix.app",
  appName: "CivicFix AI",
  webDir: "public",
  server: {
    // For live native testing against the Next.js server (e.g. 10.0.2.2 for Android emulator, localhost for iOS simulator)
    url: process.env.CAPACITOR_SERVER_URL || undefined,
    cleartext: true,
    androidScheme: "https",
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      launchAutoHide: true,
      backgroundColor: "#10243A",
      androidSplashResourceName: "splash",
      androidScaleType: "CENTER_CROP",
      showSpinner: false,
      splashFullScreen: true,
      splashImmersive: true,
    },
    StatusBar: {
      backgroundColor: "#10243A",
      style: "DARK" as any,
    },
  },
};

export default config;
