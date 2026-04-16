# Project Memory

## Core
Mobile-only layout (max-width 430px), centered on desktop.
Supabase Auth (Email auto-confirm, Google, Apple) & Database.
PWA configured (manifest.json, standalone, viewport-fit=cover).
`suppressHydrationWarning` on html/head/body to prevent Vite/TanStack Start mismatch.
Offline-first: localStorage caching for instant UI, Supabase sync.
App name is **ZyraFit** (not CalTrack). Logo: src/assets/zyrafit-icon.png & zyrafit-logo.png.

## Memories
- [Design Language](mem://style/design-language) — Premium, minimalist native mobile aesthetic, iOS-style interactions
- [Navigation Flow](mem://ux/navigation-pattern) — App routing, tabs, quick add, and onboarding redirects
- [Food Logging](mem://features/food-logging) — Multi-modal entry, barcode scanning, AI photo recognition
- [Dashboard Analytics](mem://features/analytics) — Macro tracking progress ring and 7-day history chart
- [Nutritional Calculations](mem://logic/nutritional-calculations) — Mifflin-St Jeor formula, dynamic quantity calculations
- [Onboarding Flow](mem://features/onboarding) — Multi-step questionnaire for generating nutritional plan before sign-up
- [Body Composition Tracking](mem://features/body-composition-tracking) — Weight, BMI, Body Fat % tracking and AI receipt scanner
