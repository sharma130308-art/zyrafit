/**
 * Native Google / Apple sign-in for the Capacitor shell, via
 * @capgo/capacitor-social-login. This exists because the web OAuth
 * redirect flow (lovable.auth.signInWithOAuth, used on web) can't complete
 * inside the native WebView — there's no https origin for the provider to
 * redirect back to. Here we get a native ID token from the OS-level
 * Google/Apple sign-in sheet and hand it to Supabase directly, so the
 * resulting session is identical to the web flow (same RLS, same
 * user_profiles row, etc.). No-op on web — login.tsx keeps using the
 * existing redirect flow there.
 *
 * Setup required before this works (see docs/native-build.md):
 *  - Google: create an OAuth "Web application" client ID for
 *    VITE_GOOGLE_WEB_CLIENT_ID, and (for iOS) an "iOS" client ID for
 *    VITE_GOOGLE_IOS_CLIENT_ID, both in Google Cloud Console.
 *  - Apple: enable "Sign in with Apple" for the app's bundle ID in the
 *    Apple Developer portal. scripts/cap-configure.mjs adds the
 *    entitlement to the Xcode project automatically once ios/ exists.
 *  - Supabase: enable the Google and Apple providers under
 *    Authentication -> Providers (Sign in with Apple needs your Services
 *    ID / Team ID / Key set there too).
 */
import { supabase } from "@/integrations/supabase/client";
import { isNative, nativePlatform } from "./native";

const GOOGLE_WEB_CLIENT_ID = import.meta.env.VITE_GOOGLE_WEB_CLIENT_ID as string | undefined;
const GOOGLE_IOS_CLIENT_ID = import.meta.env.VITE_GOOGLE_IOS_CLIENT_ID as string | undefined;

export type NativeAuthResult = { ok: boolean; error?: string; userId?: string };

let initPromise: Promise<void> | null = null;

async function ensureInitialized(): Promise<void> {
  if (!initPromise) {
    initPromise = (async () => {
      const { SocialLogin } = await import("@capgo/capacitor-social-login");
      await SocialLogin.initialize({
        google: {
          webClientId: GOOGLE_WEB_CLIENT_ID,
          iOSClientId: GOOGLE_IOS_CLIENT_ID,
        },
        apple: {},
      });
    })();
  }
  return initPromise;
}

function isUserCancelled(err: unknown): boolean {
  const message = err instanceof Error ? err.message : String(err ?? "");
  const msg = message.toLowerCase();
  return msg.includes("cancel") || msg.includes("1001") /* ASAuthorizationError.canceled */;
}

/** True once the env vars needed for native Google sign-in are present. */
export function isNativeGoogleConfigured(): boolean {
  return !!GOOGLE_WEB_CLIENT_ID;
}

/**
 * Sign in with Apple is an iOS-only expectation — the native
 * AuthenticationServices sheet only exists there. On Android we'd need a
 * separate web-based OAuth config (Service ID + backend redirect) that
 * isn't set up here, so the Apple button is hidden on native Android.
 */
export function isNativeAppleAvailable(): boolean {
  return isNative() && nativePlatform() === "ios";
}

export async function signInNativeGoogle(): Promise<NativeAuthResult> {
  if (!isNative()) return { ok: false, error: "Not native" };
  if (!isNativeGoogleConfigured()) {
    return {
      ok: false,
      error: "Google sign-in isn't configured yet — add VITE_GOOGLE_WEB_CLIENT_ID.",
    };
  }
  try {
    await ensureInitialized();
    const { SocialLogin } = await import("@capgo/capacitor-social-login");
    const res = await SocialLogin.login({
      provider: "google",
      options: { scopes: ["email", "profile"] },
    });
    const idToken = res.result.responseType === "online" ? res.result.idToken : null;
    if (!idToken) {
      return { ok: false, error: "Google didn't return a sign-in token. Try again." };
    }
    const { data, error } = await supabase.auth.signInWithIdToken({ provider: "google", token: idToken });
    if (error) return { ok: false, error: error.message };
    return { ok: true, userId: data.user?.id };
  } catch (err) {
    if (isUserCancelled(err)) return { ok: false };
    console.error("[native-auth] Google sign-in failed:", err);
    return { ok: false, error: "Google sign-in failed. Please try again." };
  }
}

export async function signInNativeApple(): Promise<NativeAuthResult> {
  if (!isNative()) return { ok: false, error: "Not native" };
  try {
    await ensureInitialized();
    const { SocialLogin } = await import("@capgo/capacitor-social-login");
    const res = await SocialLogin.login({
      provider: "apple",
      options: { scopes: ["email", "name"] },
    });
    const idToken = res.result.idToken;
    if (!idToken) {
      return { ok: false, error: "Apple didn't return a sign-in token. Try again." };
    }
    const { data, error } = await supabase.auth.signInWithIdToken({ provider: "apple", token: idToken });
    if (error) return { ok: false, error: error.message };
    return { ok: true, userId: data.user?.id };
  } catch (err) {
    if (isUserCancelled(err)) return { ok: false };
    console.error("[native-auth] Apple sign-in failed:", err);
    return { ok: false, error: "Apple sign-in failed. Please try again." };
  }
}
