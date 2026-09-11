/**
 * One entry point for "turn meal reminders on/off" that works on:
 *  - web / installed PWA  → Web Push (lib/push.ts)
 *  - native iOS/Android   → on-device local notifications + native push token
 */
import { supabase } from "@/integrations/supabase/client";
import { isNative } from "./native";
import {
  isPreviewEnvironment,
  isPushSupported,
  subscribeToPush,
  unsubscribeFromPush,
} from "./push";
import {
  cancelMealReminders,
  ensureLocalNotificationPermission,
  scheduleMealReminders,
} from "./local-notifications";
import { registerNativePush, unregisterNativePush } from "./native-push";

/** Can this device show reminders at all? */
export function remindersSupported(): boolean {
  return isNative() || isPushSupported();
}

/** Reminders are blocked only in the Lovable preview iframe on the web. */
export function remindersBlockedByPreview(): boolean {
  return !isNative() && isPreviewEnvironment();
}

export async function enableReminders(): Promise<{ ok: boolean; error?: string }> {
  if (isNative()) {
    const granted = await ensureLocalNotificationPermission();
    if (!granted) return { ok: false, error: "Notification permission denied" };

    const { data: u } = await supabase.auth.getUser();
    if (!u.user) return { ok: false, error: "Not signed in" };

    const { data } = await (supabase.from("user_settings") as any)
      .select("breakfast_time, lunch_time, dinner_time, snack_time, snack_reminder_enabled")
      .eq("user_id", u.user.id)
      .maybeSingle();

    await scheduleMealReminders({
      breakfast: (data?.breakfast_time || "08:00:00").slice(0, 5),
      lunch: (data?.lunch_time || "13:00:00").slice(0, 5),
      dinner: (data?.dinner_time || "19:00:00").slice(0, 5),
      snack: (data?.snack_time || "16:00:00").slice(0, 5),
      snackEnabled: !!data?.snack_reminder_enabled,
    });

    // Best-effort remote push token (needs APNs/FCM configured server-side).
    registerNativePush().catch(() => {});

    let timezone = "UTC";
    try {
      timezone = Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
    } catch {}
    await (supabase.from("user_settings") as any)
      .update({ reminders_enabled: true, timezone })
      .eq("user_id", u.user.id);
    return { ok: true };
  }

  if (isPreviewEnvironment()) {
    return { ok: false, error: "Push is only available in the published app." };
  }
  return subscribeToPush();
}

export async function disableReminders(): Promise<{ ok: boolean; error?: string }> {
  if (isNative()) {
    await cancelMealReminders();
    await unregisterNativePush();
    const { data: u } = await supabase.auth.getUser();
    if (u.user) {
      await (supabase.from("user_settings") as any)
        .update({ reminders_enabled: false })
        .eq("user_id", u.user.id);
    }
    return { ok: true };
  }
  return unsubscribeFromPush();
}
