# ZyraFit — iOS & Android build guide (Capacitor)

The web app is wrapped with Capacitor 8. Everything below runs on **your Mac**
(iOS needs Xcode; Android needs Android Studio — Android also works on
Windows/Linux).

## 0. Get the code

Either connect GitHub in the Lovable editor (top-right **GitHub → Connect**) and
`git clone` the repo, or use **Project → Export → Download zip**.

```bash
cd zyrafit
bun install          # or npm install
```

## 1. Generate the native projects (first time only)

```bash
bun run cap:add
```

This runs `npx cap add ios`, `npx cap add android`, then
`scripts/cap-configure.mjs` which injects:

| Platform | What is added |
| --- | --- |
| iOS `Info.plist` | `NSCameraUsageDescription`, `NSPhotoLibraryUsageDescription`, `NSPhotoLibraryAddUsageDescription`, `NSUserNotificationsUsageDescription`, `UIBackgroundModes: remote-notification`, `zyrafit://` URL scheme |
| Android manifest | `CAMERA`, `POST_NOTIFICATIONS`, `SCHEDULE_EXACT_ALARM`, `RECEIVE_BOOT_COMPLETED`, `VIBRATE`, `READ_MEDIA_IMAGES`, camera `uses-feature required=false`, ML Kit barcode model meta-data, `zyrafit://` intent filter, `minSdk 26` |

Commit `ios/` and `android/` to git — they are now part of the project.

## 2. Build the web bundle and sync it into the native shells

```bash
bun run cap:sync
```

= `bun run build:native` (static bundle → `dist-native/client`) +
`npx cap sync` (copies bundle, installs plugin pods/gradle deps) +
the configure script again (idempotent).

Run this **every time you pull new code** from Lovable.

## 3. Open, sign, run

```bash
bun run cap:ios       # opens Xcode
bun run cap:android   # opens Android Studio
```

### Xcode
1. Select the **App** target → *Signing & Capabilities* → pick your Team.
2. Add capability **Push Notifications** and **Background Modes → Remote notifications**.
3. Add the app icon: drag `src/assets/app-icon-1024.png` into
   `Assets.xcassets/AppIcon` (or run `npx @capacitor/assets generate --ios`).
4. Product → Archive → Distribute → App Store Connect.

### Android Studio
1. Build → Generate Signed Bundle (AAB). Create a keystore and **keep it safe**.
2. Icons/splash: `npx @capacitor/assets generate --android`
   (uses `assets/` folder — copy `src/assets/app-icon-1024.png` to
   `assets/icon.png` first).
3. Upload the AAB in Play Console.

## Native features already wired

| Feature | Plugin | Where |
| --- | --- | --- |
| Meal photo / body-scan photo | `@capacitor/camera` | `src/lib/native-camera.ts` |
| Barcode scanning | `@capacitor-mlkit/barcode-scanning` (web falls back to `html5-qrcode`) | `src/components/BarcodeScanner.tsx` |
| Offline-first storage | `@capacitor/preferences` mirrors `localStorage` | `src/lib/native-storage.ts`, `src/client.tsx` |
| Meal reminders | `@capacitor/local-notifications` (on-device) + `@capacitor/push-notifications` token → `device_push_tokens` | `src/lib/reminders.ts` |
| Haptics | `@capacitor/haptics` | `src/lib/haptics.ts` |
| Account deletion (App Store 5.1.1(v)) | `delete_own_account()` RPC | Profile → **Delete account** |
| Splash / status bar / keyboard | `@capacitor/splash-screen`, `status-bar`, `keyboard` | `capacitor.config.ts` |
| Native Google / Apple sign-in | `@capgo/capacitor-social-login` | `src/lib/native-auth.ts`, wired into `src/routes/login.tsx` |

The web OAuth redirect (`lovable.auth.signInWithOAuth`) can't complete inside
the native WebView, so `login.tsx` now branches: on native it opens the
OS-level Google/Apple sign-in sheet and hands the resulting ID token straight
to Supabase (`signInWithIdToken`) — same session, same `user_profiles` row as
the web flow. On web nothing changed. The Apple button is hidden on native
Android — Sign in with Apple is an iOS thing; Android would need a separate
web-based Service ID setup that isn't configured here.

### One-time setup for native social login

1. **Google Cloud Console** → APIs & Services → Credentials → Create OAuth
   client ID:
   - One **Web application** client → this is `VITE_GOOGLE_WEB_CLIENT_ID`
     (used on Android and as the "audience" Supabase checks).
   - One **iOS** client (bundle ID `com.zyrafit.app`) → this is
     `VITE_GOOGLE_IOS_CLIENT_ID`.
   Add both to `.env`:
   ```
   VITE_GOOGLE_WEB_CLIENT_ID="xxxxx.apps.googleusercontent.com"
   VITE_GOOGLE_IOS_CLIENT_ID="xxxxx.apps.googleusercontent.com"
   ```
   Without these, the Google button is hidden with a clear "not configured" error rather than crashing.
2. **Apple Developer** → Certificates, Identifiers & Profiles → your App ID
   → enable **Sign In with Apple**.
3. In Xcode (after `cap:ios`), select the App target → *Signing &
   Capabilities* → **+ Capability** → **Sign in with Apple**, once. From then
   on `scripts/cap-configure.mjs` keeps that entitlement in place on every
   `cap:sync`.
4. **Supabase Dashboard** → Authentication → Providers → enable **Google**
   and **Apple**, using the same client IDs above (Apple also needs your
   Team ID / Key ID / private key from the Apple Developer portal).

Android doesn't need extra manifest changes for this — the plugin talks to
Google Play Services directly.

## Security audit (Sept 2026)

Went through the full codebase and Supabase schema looking for anything that
would get the app rejected or leave user data exposed. Results:

**Solid — no changes needed:**
- All 9 database tables have Row Level Security enabled, and every policy is
  scoped to `auth.uid() = user_id` (no `USING (true)` catch-alls found).
- `delete_own_account()` is `SECURITY DEFINER` but pinned (`search_path =
  public`, revoked from `PUBLIC`/`anon`, only `authenticated` can call it,
  and it only ever deletes rows matching the caller's own `auth.uid()`).
- No secrets committed — `SUPABASE_SERVICE_ROLE_KEY` and API keys are only
  referenced via `process.env` / `Deno.env` server-side; `.env` only has the
  public anon key, which is meant to be public.
- No cleartext/HTTP traffic in store builds — `capacitor.config.ts` only
  allows cleartext in the dev-only live-reload path; `allowMixedContent:
  false` on Android.
- Sign in with Apple is offered wherever Google sign-in is (web + iOS
  native) — satisfies Apple's 4.8 parity requirement.
- Account deletion is in place — satisfies 5.1.1(v).
- No in-app purchases or paywalls in the code, so no Guideline 3.1.1 risk.
- No `dangerouslySetInnerHTML`/`eval` on user-controlled input.

**Fixed in this pass:**
- `scripts/cap-configure.mjs` now also bumps `compileSdkVersion` /
  `targetSdkVersion` to 36 (Android 16) if the generated project is lower —
  Google Play has required new submissions to target API 36 since Aug 31
  2026; an outdated target is an instant upload rejection.

**Worth your attention (not code I can safely guess at):**
- **No way to reset a forgotten password.** Accounts are keyed by phone
  number under the hood (`<digits>@phone.zyrafit.app`), and there's no
  "Forgot password" link or `resetPasswordForEmail` call anywhere — someone
  who forgets their password is locked out permanently. Not an automatic
  store rejection, but worth fixing before real users hit it. Say the word
  if you want this built (SMS OTP via Supabase phone auth would be the
  proper fix, or a support-driven manual reset in the meantime).
- **App Review needs a way in.** Apple/Google reviewers can't easily create
  an account through phone-number signup. Add a demo account's phone +
  password to the "App Review Information" notes in App Store Connect /
  Play Console, or the app can get rejected simply because reviewers
  couldn't sign in.
- `terms.tsx` has a "Subscriptions and pricing" section even though there's
  no subscription feature — cosmetic, but inaccurate legal copy is worth
  tidying before publishing.
- `npm audit` flags ~20 advisories, but they're all in build/dev tooling
  (vite, wrangler/miniflare, undici) that never ships inside the native
  bundle — not a store-review risk, just worth an `npm audit fix` pass at
  some point for hygiene.
- Auth tokens are mirrored into `@capacitor/preferences` (app-sandboxed
  storage) rather than the iOS Keychain / Android Keystore. Fine for store
  approval, but Keychain-backed storage (e.g.
  `@capacitor/preferences` doesn't do this; a plugin like
  `capacitor-secure-storage-plugin` would) is the stronger option if you
  want defense-in-depth against a jailbroken/rooted device reading the
  sandbox directly.

## Things you still need to do outside the code

- **Apple Developer** ($99/yr) and **Google Play Console** ($25 once) accounts.
- **Remote push (optional)**: on-device reminders work without any server. If
  you also want server-sent pushes, upload an APNs key + Firebase
  `google-services.json` / `GoogleService-Info.plist`, then a sender that
  reads `device_push_tokens` is needed.
- Store listing: screenshots (6.7" and 6.1" iPhone, 12.9" iPad optional;
  phone + 7"/10" tablet for Play), privacy policy URL
  (`https://zyrafit.app/privacy-policy`), and the App Privacy / Data Safety
  questionnaire (collects: phone number, health & fitness data, photos are
  processed but not stored).

## Live-reload during development (never ship this)

```bash
CAPACITOR_LIVE_RELOAD=1 npx cap sync && npx cap run ios
```

The shell then loads the Lovable preview URL instead of the bundled files.
