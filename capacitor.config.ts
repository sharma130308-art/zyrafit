import type { CapacitorConfig } from "@capacitor/cli";

// To produce a real native build that ships its assets inside the .ipa / .apk
// (instead of loading the Lovable preview URL on every launch) we set
// CAPACITOR_BUNDLED=1 in the environment before `bun run build && npx cap sync`.
//
// During Lovable in-editor development we keep the live-reload server URL so
// the native shell mirrors the preview iframe.
const useBundled = process.env.CAPACITOR_BUNDLED === "1";

const config: CapacitorConfig = {
  appId: "com.zyrafit.app",
  appName: "ZyraFit",
  webDir: "dist",
  ...(useBundled
    ? {}
    : {
        server: {
          url: "https://26243190-be17-49c7-ac1c-6de0c51231ee.lovableproject.com?forceHideBadge=true",
          cleartext: true,
        },
      }),
  ios: {
    contentInset: "always",
    backgroundColor: "#1a1b2f",
  },
  android: {
    backgroundColor: "#1a1b2f",
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 600,
      backgroundColor: "#1a1b2f",
      androidSplashResourceName: "splash",
      androidScaleType: "CENTER_CROP",
      showSpinner: false,
      splashFullScreen: true,
      splashImmersive: true,
    },
    StatusBar: {
      style: "DARK",
      backgroundColor: "#1a1b2f",
      overlaysWebView: true,
    },
    Keyboard: {
      resize: "native",
      resizeOnFullScreen: true,
    },
  },
};

export default config;
