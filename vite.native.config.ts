// Static SPA build used ONLY for the Capacitor iOS/Android shell.
// The regular `vite build` (SSR / Cloudflare) is untouched.
//
//   bun run build:native   → dist-native/client/index.html + assets
//
// The shell boots the client router at "/" and every screen is rendered
// on-device; data comes from Lovable Cloud over HTTPS as usual.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";

export default defineConfig({
  nitro: false,
  tanstackStart: {
    spa: { enabled: true, prerender: { outputPath: "/index.html" } },
  },
  vite: { build: { outDir: "dist-native" } },
});
