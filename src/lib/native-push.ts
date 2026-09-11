/**
 * Native push registration via @capacitor/push-notifications.
 * Stores the APNs/FCM device token in `device_push_tokens` so the backend
 * can target this device. No-op on the web (web push lives in lib/push.ts).
 */
import { supabase } from "@/integrations/supabase/client";
import { isNative, nativePlatform } from "./native";

let listenersBound = false;

export async function registerNativePush(): Promise<{ ok: boolean; error?: string }> {
  if (!isNative()) return { ok: false, error: "Not native" };
  try {
    const { PushNotifications } = await import("@capacitor/push-notifications");

    let perm = await PushNotifications.checkPermissions();
    if (perm.receive === "prompt" || perm.receive === "prompt-with-rationale") {
      perm = await PushNotifications.requestPermissions();
    }
    if (perm.receive !== "granted") return { ok: false, error: "Permission denied" };

    if (!listenersBound) {
      listenersBound = true;
      await PushNotifications.addListener("registration", async ({ value }) => {
        const { data: u } = await supabase.auth.getUser();
        if (!u.user) return;
        await (supabase.from("device_push_tokens") as any).upsert(
          {
            user_id: u.user.id,
            token: value,
            platform: nativePlatform(),
            last_seen_at: new Date().toISOString(),
          },
          { onConflict: "user_id,token" },
        );
      });
      await PushNotifications.addListener("registrationError", (err) => {
        console.error("[native-push] registration error:", err);
      });
    }

    await PushNotifications.register();
    return { ok: true };
  } catch (err: any) {
    return { ok: false, error: err?.message || "Push registration failed" };
  }
}

export async function unregisterNativePush(): Promise<void> {
  if (!isNative()) return;
  try {
    const { PushNotifications } = await import("@capacitor/push-notifications");
    const { data: u } = await supabase.auth.getUser();
    if (u.user) {
      await (supabase.from("device_push_tokens") as any)
        .delete()
        .eq("user_id", u.user.id)
        .eq("platform", nativePlatform());
    }
    await PushNotifications.removeAllDeliveredNotifications().catch(() => {});
  } catch {
    /* ignore */
  }
}
