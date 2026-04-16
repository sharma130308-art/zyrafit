// Send daily meal reminders via Web Push.
// Triggered by cron 3x/day; only sends to users with reminders_enabled=true
// who have NOT logged any food today.

import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";
import webpush from "npm:web-push@3.6.7";

const VAPID_PUBLIC_KEY =
  "BN1t3lLwP1qB1UU-OlEyupcjA-JX2HPjaEAv3IjX3J9pCanVLsEGn3Wo7wB9DWkKqN0-Dt4Ls3AJZ-d4vVAxpC8";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const MESSAGES: Record<string, { title: string; body: string }> = {
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
  default: {
    title: "ZyraFit reminder",
    body: "Don't forget to log your meals today.",
  },
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
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

    // Determine current local hour for each user's timezone
    // Cron invokes this hourly; we send reminders when local hour is 8, 13, or 19
    const MEAL_BY_HOUR: Record<number, string> = { 8: "breakfast", 13: "lunch", 19: "dinner" };

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

    // Get all users with reminders enabled + their timezone
    const { data: enabledUsers, error: usersErr } = await supabase
      .from("user_settings")
      .select("user_id, timezone")
      .eq("reminders_enabled", true);

    if (usersErr) throw usersErr;
    if (!enabledUsers || enabledUsers.length === 0) {
      return new Response(JSON.stringify({ sent: 0, skipped: 0 }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Group users by (meal, localDate) — only those whose local hour matches a meal slot
    type Target = { userId: string; meal: string; localDate: string };
    const targets: Target[] = [];
    for (const u of enabledUsers) {
      const tz = (u as any).timezone || "UTC";
      const { hour, date } = getLocalHourAndDate(tz);
      const meal = MEAL_BY_HOUR[hour];
      if (meal) targets.push({ userId: u.user_id, meal, localDate: date });
    }

    if (targets.length === 0) {
      return new Response(
        JSON.stringify({ sent: 0, skipped: enabledUsers.length, reason: "no users in slot" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Skip users who already logged today (in their local date)
    const uniqueDates = [...new Set(targets.map((t) => t.localDate))];
    const { data: loggedRows } = await supabase
      .from("food_entries")
      .select("user_id, date")
      .in("date", uniqueDates)
      .in("user_id", targets.map((t) => t.userId));

    const loggedSet = new Set((loggedRows || []).map((r) => `${r.user_id}|${r.date}`));
    const finalTargets = targets.filter(
      (t) => !loggedSet.has(`${t.userId}|${t.localDate}`),
    );

    if (finalTargets.length === 0) {
      return new Response(
        JSON.stringify({ sent: 0, skipped: targets.length, reason: "all logged" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Fetch push subscriptions for target users
    const userIds = [...new Set(finalTargets.map((t) => t.userId))];
    const { data: subs, error: subsErr } = await supabase
      .from("push_subscriptions")
      .select("id, user_id, endpoint, p256dh, auth")
      .in("user_id", userIds);

    if (subsErr) throw subsErr;
    if (!subs || subs.length === 0) {
      return new Response(JSON.stringify({ sent: 0, skipped: userIds.length }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Map userId -> meal
    const mealByUser = new Map(finalTargets.map((t) => [t.userId, t.meal]));

    let sent = 0;
    let failed = 0;
    const staleIds: string[] = [];

    await Promise.all(
      subs.map(async (s) => {
        const meal = mealByUser.get(s.user_id) || "default";
        const message = MESSAGES[meal] || MESSAGES.default;
        const payload = JSON.stringify({
          title: message.title,
          body: message.body,
          url: "/",
          tag: `zyrafit-${meal}`,
        });
        try {
          await webpush.sendNotification(
            {
              endpoint: s.endpoint,
              keys: { p256dh: s.p256dh, auth: s.auth },
            },
            payload,
            { TTL: 60 * 60 },
          );
          sent++;
        } catch (err: any) {
          failed++;
          // 404/410 = subscription gone, remove from DB
          const status = err?.statusCode;
          if (status === 404 || status === 410) {
            staleIds.push(s.id);
          }
          console.error("Push failed:", status, err?.body || err?.message);
        }
      }),
    );

    if (staleIds.length > 0) {
      await supabase.from("push_subscriptions").delete().in("id", staleIds);
    }

    return new Response(
      JSON.stringify({ sent, failed, removed_stale: staleIds.length, meal }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err: any) {
    console.error("send-meal-reminders error:", err);
    return new Response(JSON.stringify({ error: err?.message || String(err) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
