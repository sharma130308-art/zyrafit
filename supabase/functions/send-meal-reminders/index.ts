// Send daily meal reminders via Web Push.
// Cron triggers this hourly. For each user with reminders_enabled=true, we
// look at their per-meal times (breakfast/lunch/dinner/snack) and only fire
// when the user's local hour matches a meal hour AND that meal hasn't been
// logged today. Snack only fires if snack_reminder_enabled = true.

import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";
import webpush from "https://esm.sh/web-push@3.6.7";

const VAPID_PUBLIC_KEY =
  "BN1t3lLwP1qB1UU-OlEyupcjA-JX2HPjaEAv3IjX3J9pCanVLsEGn3Wo7wB9DWkKqN0-Dt4Ls3AJZ-d4vVAxpC8";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

type Meal = "breakfast" | "lunch" | "dinner" | "snack";

const MESSAGES: Record<Meal, { title: string; body: string }> = {
  breakfast: {
    title: "Good morning! 🌅",
    body: "Don't forget to log your breakfast in ZyraFit.",
  },
  lunch: {
    title: "Lunch time 🍽️",
    body: "What's on the menu? Log your lunch to stay on track.",
  },
  dinner: {
    title: "Dinner check-in 🌙",
    body: "Wrap up your day by logging dinner in ZyraFit.",
  },
  snack: {
    title: "Snack break 🍎",
    body: "Log your snack so your daily totals stay accurate.",
  },
};

function parseHour(t: string | null | undefined): number {
  if (!t) return -1;
  const h = parseInt(t.slice(0, 2), 10);
  return isNaN(h) ? -1 : h;
}

function getLocalHourAndDate(tz: string): { hour: number; date: string } {
  try {
    const fmt = new Intl.DateTimeFormat("en-CA", {
      timeZone: tz,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      hour12: false,
    });
    const parts = fmt.formatToParts(new Date());
    const get = (t: string) => parts.find((p) => p.type === t)?.value || "";
    const hour = parseInt(get("hour"), 10);
    const date = `${get("year")}-${get("month")}-${get("day")}`;
    return { hour: isNaN(hour) ? -1 : hour, date };
  } catch {
    const now = new Date();
    return { hour: now.getUTCHours(), date: now.toISOString().slice(0, 10) };
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Require a shared secret so only the cron job (or trusted callers) can trigger this.
    const expectedSecret = Deno.env.get("CRON_SECRET");
    if (!expectedSecret) {
      console.error("CRON_SECRET not configured");
      return new Response(JSON.stringify({ error: "Server not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const providedSecret =
      req.headers.get("x-cron-secret") ?? req.headers.get("X-Cron-Secret");
    if (providedSecret !== expectedSecret) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const privateKey = Deno.env.get("VAPID_PRIVATE_KEY");
    if (!privateKey) {
      return new Response(JSON.stringify({ error: "VAPID_PRIVATE_KEY not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    webpush.setVapidDetails(
      "mailto:notifications@zyrafit.com",
      VAPID_PUBLIC_KEY,
      privateKey,
    );

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const { data: enabledUsers, error: usersErr } = await supabase
      .from("user_settings")
      .select(
        "user_id, timezone, breakfast_time, lunch_time, dinner_time, snack_time, snack_reminder_enabled",
      )
      .eq("reminders_enabled", true);

    if (usersErr) throw usersErr;
    if (!enabledUsers || enabledUsers.length === 0) {
      return new Response(JSON.stringify({ sent: 0, skipped: 0 }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    type Target = { userId: string; meal: Meal; localDate: string };
    const targets: Target[] = [];
    for (const u of enabledUsers as any[]) {
      const tz = u.timezone || "UTC";
      const { hour, date } = getLocalHourAndDate(tz);
      const slots: Array<{ meal: Meal; hour: number; on: boolean }> = [
        { meal: "breakfast", hour: parseHour(u.breakfast_time), on: true },
        { meal: "lunch", hour: parseHour(u.lunch_time), on: true },
        { meal: "dinner", hour: parseHour(u.dinner_time), on: true },
        { meal: "snack", hour: parseHour(u.snack_time), on: !!u.snack_reminder_enabled },
      ];
      for (const s of slots) {
        if (s.on && s.hour === hour) {
          targets.push({ userId: u.user_id, meal: s.meal, localDate: date });
        }
      }
    }

    if (targets.length === 0) {
      return new Response(
        JSON.stringify({ sent: 0, skipped: enabledUsers.length, reason: "no users in slot" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Skip users who already logged THIS meal_type today
    const uniqueDates = [...new Set(targets.map((t) => t.localDate))];
    const userIds = [...new Set(targets.map((t) => t.userId))];
    const { data: loggedRows } = await supabase
      .from("food_entries")
      .select("user_id, date, meal_type")
      .in("date", uniqueDates)
      .in("user_id", userIds);

    const loggedSet = new Set(
      (loggedRows || []).map((r: any) => `${r.user_id}|${r.date}|${r.meal_type}`),
    );
    const finalTargets = targets.filter(
      (t) => !loggedSet.has(`${t.userId}|${t.localDate}|${t.meal}`),
    );

    if (finalTargets.length === 0) {
      return new Response(
        JSON.stringify({ sent: 0, skipped: targets.length, reason: "all logged" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const targetUserIds = [...new Set(finalTargets.map((t) => t.userId))];
    const { data: subs, error: subsErr } = await supabase
      .from("push_subscriptions")
      .select("id, user_id, endpoint, p256dh, auth")
      .in("user_id", targetUserIds);

    if (subsErr) throw subsErr;
    if (!subs || subs.length === 0) {
      return new Response(JSON.stringify({ sent: 0, skipped: targetUserIds.length }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // userId -> meal (one meal per user per hour by construction)
    const mealByUser = new Map<string, Meal>(finalTargets.map((t) => [t.userId, t.meal]));

    let sent = 0;
    let failed = 0;
    const staleIds: string[] = [];

    await Promise.all(
      subs.map(async (s: any) => {
        const meal = (mealByUser.get(s.user_id) || "breakfast") as Meal;
        const message = MESSAGES[meal];
        const payload = JSON.stringify({
          title: message.title,
          body: message.body,
          url: "/",
          tag: `zyrafit-${meal}`,
        });
        try {
          await webpush.sendNotification(
            { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
            payload,
            { TTL: 60 * 60 },
          );
          sent++;
        } catch (err: any) {
          failed++;
          const status = err?.statusCode;
          if (status === 404 || status === 410) staleIds.push(s.id);
          console.error("Push failed:", status, err?.body || err?.message);
        }
      }),
    );

    if (staleIds.length > 0) {
      await supabase.from("push_subscriptions").delete().in("id", staleIds);
    }

    return new Response(
      JSON.stringify({ sent, failed, removed_stale: staleIds.length, targets: finalTargets.length }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err: any) {
    console.error("send-meal-reminders error:", err);
    return new Response(JSON.stringify({ error: "An internal error occurred" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
