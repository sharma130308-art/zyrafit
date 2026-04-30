// Send re-engagement push reminders ~1 day and ~3 days after signup.
// Cron triggers this hourly. For each user we check:
//  - signup age window (D1: 22-26h, D3: 70-74h)
//  - whether they've logged any food yet (personalizes copy)
//  - whether the same reminder has already been sent (idempotent)

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import webpush from "https://esm.sh/web-push@3.6.7";

const VAPID_PUBLIC_KEY =
  "BN1t3lLwP1qB1UU-OlEyupcjA-JX2HPjaEAv3IjX3J9pCanVLsEGn3Wo7wB9DWkKqN0-Dt4Ls3AJZ-d4vVAxpC8";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-cron-secret",
};

type Kind = "day1_no_log" | "day1_logged" | "day3_no_log" | "day3_logged";

const MESSAGES: Record<Kind, { title: string; body: string }> = {
  day1_no_log: {
    title: "Ready for your first meal? 🍽️",
    body: "Snap a photo or scan a barcode — your first log takes 5 seconds.",
  },
  day1_logged: {
    title: "Great start in ZyraFit! 🔥",
    body: "Keep the streak going — log today's meals to stay on track.",
  },
  day3_no_log: {
    title: "Your plan is waiting 💪",
    body: "Log just one meal today to see your macros come to life.",
  },
  day3_logged: {
    title: "3 days in — nice work! ✨",
    body: "Consistency wins. Don't forget to log today's meals.",
  },
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const expectedSecret = Deno.env.get("CRON_SECRET");
    if (!expectedSecret) {
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

    const now = Date.now();
    // Window edges (hours since signup)
    const D1_START = new Date(now - 26 * 3600_000).toISOString();
    const D1_END = new Date(now - 22 * 3600_000).toISOString();
    const D3_START = new Date(now - 74 * 3600_000).toISOString();
    const D3_END = new Date(now - 70 * 3600_000).toISOString();

    // Find candidate user_ids via push_subscriptions joined with user_profiles for created_at signal.
    // We use user_profiles.created_at as the signup proxy (created on first session).
    const { data: d1Users } = await supabase
      .from("user_profiles")
      .select("user_id, created_at")
      .gte("created_at", D1_START)
      .lt("created_at", D1_END);

    const { data: d3Users } = await supabase
      .from("user_profiles")
      .select("user_id, created_at")
      .gte("created_at", D3_START)
      .lt("created_at", D3_END);

    type Candidate = { userId: string; window: "day1" | "day3" };
    const candidates: Candidate[] = [
      ...((d1Users || []).map((u: any) => ({ userId: u.user_id, window: "day1" as const }))),
      ...((d3Users || []).map((u: any) => ({ userId: u.user_id, window: "day3" as const }))),
    ];

    if (candidates.length === 0) {
      return new Response(JSON.stringify({ sent: 0, reason: "no candidates" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userIds = [...new Set(candidates.map((c) => c.userId))];

    // Filter out users who already received the reminder for this window
    const { data: alreadySent } = await supabase
      .from("onboarding_reminders_sent")
      .select("user_id, reminder_kind")
      .in("user_id", userIds);
    const sentSet = new Set(
      (alreadySent || []).map((r: any) => `${r.user_id}|${r.reminder_kind.startsWith("day1") ? "day1" : "day3"}`),
    );

    // Check whether each candidate has logged any food
    const { data: anyLogs } = await supabase
      .from("food_entries")
      .select("user_id")
      .in("user_id", userIds);
    const loggedUsers = new Set((anyLogs || []).map((r: any) => r.user_id));

    type Target = { userId: string; kind: Kind };
    const targets: Target[] = [];
    for (const c of candidates) {
      if (sentSet.has(`${c.userId}|${c.window}`)) continue;
      const logged = loggedUsers.has(c.userId);
      const kind: Kind =
        c.window === "day1"
          ? logged ? "day1_logged" : "day1_no_log"
          : logged ? "day3_logged" : "day3_no_log";
      targets.push({ userId: c.userId, kind });
    }

    if (targets.length === 0) {
      return new Response(JSON.stringify({ sent: 0, reason: "all already sent" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const targetUserIds = [...new Set(targets.map((t) => t.userId))];
    const { data: subs } = await supabase
      .from("push_subscriptions")
      .select("id, user_id, endpoint, p256dh, auth")
      .in("user_id", targetUserIds);

    if (!subs || subs.length === 0) {
      return new Response(JSON.stringify({ sent: 0, reason: "no subscriptions" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const kindByUser = new Map<string, Kind>(targets.map((t) => [t.userId, t.kind]));

    let sent = 0;
    let failed = 0;
    const staleIds: string[] = [];
    const successfulSends: Array<{ user_id: string; reminder_kind: Kind }> = [];
    const seenLogged = new Set<string>();

    await Promise.all(
      subs.map(async (s: any) => {
        const kind = kindByUser.get(s.user_id);
        if (!kind) return;
        const message = MESSAGES[kind];
        const payload = JSON.stringify({
          title: message.title,
          body: message.body,
          url: "/",
          tag: `zyrafit-${kind}`,
        });
        try {
          await webpush.sendNotification(
            { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
            payload,
            { TTL: 24 * 60 * 60 },
          );
          sent++;
          const dedupeKey = `${s.user_id}|${kind}`;
          if (!seenLogged.has(dedupeKey)) {
            seenLogged.add(dedupeKey);
            successfulSends.push({ user_id: s.user_id, reminder_kind: kind });
          }
        } catch (err: any) {
          failed++;
          const status = err?.statusCode;
          if (status === 404 || status === 410) staleIds.push(s.id);
          console.error("Push failed:", status, err?.body || err?.message);
        }
      }),
    );

    if (successfulSends.length > 0) {
      await supabase
        .from("onboarding_reminders_sent")
        .upsert(successfulSends, { onConflict: "user_id,reminder_kind" });
    }

    if (staleIds.length > 0) {
      await supabase.from("push_subscriptions").delete().in("id", staleIds);
    }

    return new Response(
      JSON.stringify({
        sent,
        failed,
        removed_stale: staleIds.length,
        targets: targets.length,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err: any) {
    console.error("send-onboarding-reminders error:", err);
    return new Response(JSON.stringify({ error: "An internal error occurred" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
