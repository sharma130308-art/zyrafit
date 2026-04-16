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

    const body = await req.json().catch(() => ({}));
    const meal = (body.meal as string) || "default";
    const message = MESSAGES[meal] || MESSAGES.default;

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    // Get all users with reminders enabled
    const { data: enabledUsers, error: usersErr } = await supabase
      .from("user_settings")
      .select("user_id")
      .eq("reminders_enabled", true);

    if (usersErr) throw usersErr;
    if (!enabledUsers || enabledUsers.length === 0) {
      return new Response(JSON.stringify({ sent: 0, skipped: 0 }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Filter out users who already logged food today (UTC date)
    const today = new Date().toISOString().slice(0, 10);
    const { data: loggedToday } = await supabase
      .from("food_entries")
      .select("user_id")
      .eq("date", today);

    const loggedSet = new Set((loggedToday || []).map((r) => r.user_id));
    const targetUserIds = enabledUsers
      .map((u) => u.user_id)
      .filter((id) => !loggedSet.has(id));

    if (targetUserIds.length === 0) {
      return new Response(
        JSON.stringify({ sent: 0, skipped: enabledUsers.length, reason: "all logged" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Fetch their push subscriptions
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

    const payload = JSON.stringify({
      title: message.title,
      body: message.body,
      url: "/",
      tag: `zyrafit-${meal}`,
    });

    let sent = 0;
    let failed = 0;
    const staleIds: string[] = [];

    await Promise.all(
      subs.map(async (s) => {
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
