/**
 * Schedules daily local notifications on native iOS/Android via Capacitor.
 * On the web this no-ops (web push handled separately by lib/push.ts).
 *
 * We schedule one repeating notification per meal at the user's chosen time.
 * Using stable numeric IDs so re-scheduling overwrites existing ones.
 */
import { Capacitor } from "@capacitor/core";
import { LocalNotifications } from "@capacitor/local-notifications";

export type MealKey = "breakfast" | "lunch" | "dinner" | "snack";

export interface MealReminderTimes {
  breakfast: string; // "HH:MM"
  lunch: string;
  dinner: string;
  snack: string;
  snackEnabled: boolean;
}

const MEAL_IDS: Record<MealKey, number> = {
  breakfast: 1001,
  lunch: 1002,
  dinner: 1003,
  snack: 1004,
};

const COPY: Record<MealKey, { title: string; body: string }> = {
  breakfast: { title: "Good morning! 🌅", body: "Time to log your breakfast." },
  lunch: { title: "Lunch time 🍽️", body: "What's on the menu? Log your lunch." },
  dinner: { title: "Dinner check-in 🌙", body: "Wrap up your day — log dinner." },
  snack: { title: "Snack break 🍎", body: "Log your snack to stay on track." },
};

function isNative(): boolean {
  try {
    return Capacitor.isNativePlatform();
  } catch {
    return false;
  }
}

function parseHHMM(t: string): { hour: number; minute: number } | null {
  const m = /^(\d{1,2}):(\d{2})/.exec(t || "");
  if (!m) return null;
  const hour = Math.min(23, Math.max(0, parseInt(m[1], 10)));
  const minute = Math.min(59, Math.max(0, parseInt(m[2], 10)));
  return { hour, minute };
}

export async function ensureLocalNotificationPermission(): Promise<boolean> {
  if (!isNative()) return false;
  try {
    const status = await LocalNotifications.checkPermissions();
    if (status.display === "granted") return true;
    const req = await LocalNotifications.requestPermissions();
    return req.display === "granted";
  } catch {
    return false;
  }
}

export async function cancelMealReminders(): Promise<void> {
  if (!isNative()) return;
  try {
    await LocalNotifications.cancel({
      notifications: Object.values(MEAL_IDS).map((id) => ({ id })),
    });
  } catch {
    /* ignore */
  }
}

export async function scheduleMealReminders(times: MealReminderTimes): Promise<void> {
  if (!isNative()) return;
  const granted = await ensureLocalNotificationPermission();
  if (!granted) return;

  await cancelMealReminders();

  const meals: MealKey[] = ["breakfast", "lunch", "dinner"];
  if (times.snackEnabled) meals.push("snack");

  const notifications = meals
    .map((meal) => {
      const t = parseHHMM(times[meal]);
      if (!t) return null;
      const copy = COPY[meal];
      return {
        id: MEAL_IDS[meal],
        title: copy.title,
        body: copy.body,
        schedule: {
          on: { hour: t.hour, minute: t.minute },
          allowWhileIdle: true,
        },
        smallIcon: "ic_stat_icon_config_sample",
      };
    })
    .filter(Boolean) as any[];

  if (notifications.length === 0) return;
  try {
    await LocalNotifications.schedule({ notifications });
  } catch (err) {
    console.error("[local-notifications] schedule failed:", err);
  }
}
