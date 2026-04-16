import { supabase } from "@/integrations/supabase/client";

export const VAPID_PUBLIC_KEY =
  "BN1t3lLwP1qB1UU-OlEyupcjA-JX2HPjaEAv3IjX3J9pCanVLsEGn3Wo7wB9DWkKqN0-Dt4Ls3AJZ-d4vVAxpC8";

const STORAGE_KEY = "zyrafit-push-prompt-shown";

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(base64);
  const output = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; ++i) output[i] = raw.charCodeAt(i);
  return output;
}

function bufferToBase64Url(buffer: ArrayBuffer | null): string {
  if (!buffer) return "";
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
  return btoa(binary)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

export function isPushSupported(): boolean {
  if (typeof window === "undefined") return false;
  return (
    "serviceWorker" in navigator &&
    "PushManager" in window &&
    "Notification" in window
  );
}

export function isPreviewEnvironment(): boolean {
  if (typeof window === "undefined") return true;
  const host = window.location.hostname;
  if (
    host.includes("id-preview--") ||
    host.includes("lovableproject.com") ||
    host === "localhost" ||
    host === "127.0.0.1"
  ) {
    return true;
  }
  try {
    return window.self !== window.top;
  } catch {
    return true;
  }
}

export function hasShownPrompt(): boolean {
  try {
    return localStorage.getItem(STORAGE_KEY) === "1";
  } catch {
    return true;
  }
}

export function markPromptShown(): void {
  try {
    localStorage.setItem(STORAGE_KEY, "1");
  } catch {}
}

export async function subscribeToPush(): Promise<{
  ok: boolean;
  error?: string;
}> {
  if (!isPushSupported()) return { ok: false, error: "Not supported" };
  if (isPreviewEnvironment())
    return { ok: false, error: "Push is only available in the published app." };

  const permission = await Notification.requestPermission();
  if (permission !== "granted")
    return { ok: false, error: "Permission denied" };

  const registration = await navigator.serviceWorker.ready;
  let subscription = await registration.pushManager.getSubscription();
  if (!subscription) {
    const key = urlBase64ToUint8Array(VAPID_PUBLIC_KEY);
    subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      // Cast to satisfy TS lib mismatch on Uint8Array<ArrayBufferLike>
      applicationServerKey: key.buffer as ArrayBuffer,
    });
  }

  const json = subscription.toJSON();
  const endpoint = json.endpoint || subscription.endpoint;
  const p256dh = json.keys?.p256dh || bufferToBase64Url(subscription.getKey("p256dh"));
  const auth = json.keys?.auth || bufferToBase64Url(subscription.getKey("auth"));

  const { data: userRes } = await supabase.auth.getUser();
  const userId = userRes.user?.id;
  if (!userId) return { ok: false, error: "Not signed in" };

  const { error: subErr } = await supabase.from("push_subscriptions").upsert(
    {
      user_id: userId,
      endpoint,
      p256dh,
      auth,
      user_agent: navigator.userAgent,
    },
    { onConflict: "user_id,endpoint" },
  );
  if (subErr) return { ok: false, error: subErr.message };

  let timezone = "UTC";
  try {
    timezone = Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
  } catch {}

  const { error: setErr } = await supabase
    .from("user_settings")
    .update({ reminders_enabled: true, timezone })
    .eq("user_id", userId);
  if (setErr) return { ok: false, error: setErr.message };

  return { ok: true };
}

export async function unsubscribeFromPush(): Promise<{ ok: boolean; error?: string }> {
  if (!isPushSupported()) return { ok: true };

  const { data: userRes } = await supabase.auth.getUser();
  const userId = userRes.user?.id;
  if (!userId) return { ok: false, error: "Not signed in" };

  try {
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();
    if (subscription) {
      await supabase
        .from("push_subscriptions")
        .delete()
        .eq("user_id", userId)
        .eq("endpoint", subscription.endpoint);
      await subscription.unsubscribe();
    }
  } catch {}

  await supabase
    .from("user_settings")
    .update({ reminders_enabled: false })
    .eq("user_id", userId);

  return { ok: true };
}

export async function getRemindersEnabled(): Promise<boolean> {
  const { data: userRes } = await supabase.auth.getUser();
  if (!userRes.user) return false;
  const { data } = await supabase
    .from("user_settings")
    .select("reminders_enabled")
    .eq("user_id", userRes.user.id)
    .maybeSingle();
  return Boolean(data?.reminders_enabled);
}
