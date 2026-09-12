import type { CapacitorConfig } from "@capacitor/cli";

// Store builds (default) ship the static web bundle inside the .ipa / .apk.
// Build it with `bun run build:native` (outputs to dist-native/client).
//
// For in-editor live reload against the Lovable preview instead, run
// `CAPACITOR_LIVE_RELOAD=1 npx cap sync` — the shell then loads the preview
// URL on every launch. Never ship a live-reload build to the stores.
const liveReload = process.env.CAPACITOR_LIVE_RELOAD === "1";

const config: CapacitorConfig = {
  appId: "com.zyrafit.app",
  appName: "ZyraFit",
  webDir: "dist-native/client",
  ...(liveReload
    ? {
        server: {
          url: "https://26243190-be17-49c7-ac1c-6de0c51231ee.lovableproject.com?forceHideBadge=true",
          cleartext: true,
        },
      }
    : {}),
  ios: {
    contentInset: "always",
    backgroundColor: "#1a1b2f",
    scheme: "ZyraFit",
  },
  android: {
    backgroundColor: "#1a1b2f",
    allowMixedContent: false,
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 600,
      launchAutoHide: true,
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
    PushNotifications: {
      presentationOptions: ["badge", "sound", "alert"],
    },
    LocalNotifications: {
      smallIcon: "ic_stat_icon_config_sample",
      iconColor: "#1a1b2f",
    },
  },
};

export default config;
