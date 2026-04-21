import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const DAILY_LIMIT = 3;
const FEATURE = "body_scan";

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization") ?? "";
    const token = authHeader.replace("Bearer ", "");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const admin = createClient(SUPABASE_URL, SERVICE_KEY);

    const { data: userData, error: userErr } = await admin.auth.getUser(token);
    if (userErr || !userData?.user) {
      return new Response(JSON.stringify({ ok: false, error: "Sign in to use the body scanner." }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const userId = userData.user.id;

    const today = new Date().toISOString().slice(0, 10);
    const { count } = await admin
      .from("ai_usage")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("feature", FEATURE)
      .eq("used_on", today);

    if ((count ?? 0) >= DAILY_LIMIT) {
      return new Response(
        JSON.stringify({
          ok: false,
          error: `Daily limit reached (${DAILY_LIMIT} body scans). Try again tomorrow.`,
          limit_reached: true,
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { imageBase64 } = await req.json();
    if (!imageBase64) {
      return new Response(JSON.stringify({ ok: false, error: "No image provided" }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "system",
            content: `You are a body composition data extraction expert. You read gym receipts, body scan printouts, and similar documents to extract body stats. Always respond by calling the extract_body_stats function. Extract all available data from the image. Convert units if needed (stones/lbs to kg, feet/inches to meters).`,
          },
          {
            role: "user",
            content: [
              { type: "text", text: "Extract body composition data from this gym receipt or body scan printout. Get weight, height, BMI, body fat percentage, and body fat mass if available." },
              { type: "image_url", image_url: { url: imageBase64 } },
            ],
          },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "extract_body_stats",
              description: "Extract body composition stats from the image",
              parameters: {
                type: "object",
                properties: {
                  found: { type: "boolean", description: "Whether body stats were found in the image" },
                  weight_kg: { type: "number", description: "Weight in kilograms" },
                  height_m: { type: "number", description: "Height in meters" },
                  bmi: { type: "number", description: "BMI value" },
                  body_fat_percent: { type: "number", description: "Body fat percentage" },
                  body_fat_mass_kg: { type: "number", description: "Body fat mass in kg" },
                  date: { type: "string", description: "Date from the receipt in YYYY-MM-DD format if available" },
                  age: { type: "number", description: "Age if shown" },
                  gender: { type: "string", description: "Gender if shown (male/female)" },
                },
                required: ["found"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "extract_body_stats" } },
      }),
    });

    if (!response.ok) {
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      let error = "AI analysis failed";
      if (response.status === 429) error = "Rate limited, please try again shortly.";
      else if (response.status === 402) error = "AI credits exhausted. Please add funds.";
      return new Response(JSON.stringify({ ok: false, error, status: response.status }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];

    if (!toolCall) {
      return new Response(JSON.stringify({ ok: false, error: "No analysis returned" }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const result = JSON.parse(toolCall.function.arguments);

    await admin.from("ai_usage").insert({ user_id: userId, feature: FEATURE, used_on: today });

    const remaining = Math.max(0, DAILY_LIMIT - ((count ?? 0) + 1));
    return new Response(JSON.stringify({ ok: true, remaining, ...result }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("scan-body-stats error:", e);
    return new Response(
      JSON.stringify({ ok: false, error: "An internal error occurred. Please try again." }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
