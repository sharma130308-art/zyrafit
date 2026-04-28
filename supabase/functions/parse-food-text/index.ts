import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const FEATURE = "text_parse";
const MODEL = "google/gemini-2.5-flash-lite";

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
      return new Response(JSON.stringify({ ok: false, error: "Sign in to use AI." }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const userId = userData.user.id;
    const today = new Date().toISOString().slice(0, 10);

    // Daily AI scan limit (10/day across all AI features)
    const DAILY_LIMIT = 10;
    const { count: usedToday } = await admin
      .from("ai_usage")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("used_on", today);
    if ((usedToday ?? 0) >= DAILY_LIMIT) {
      return new Response(
        JSON.stringify({
          ok: false,
          error: `Daily AI limit reached (${DAILY_LIMIT}/day). Try again tomorrow.`,
          limit_reached: true,
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const { text } = await req.json();
    if (!text || typeof text !== "string" || text.trim().length === 0) {
      return new Response(JSON.stringify({ ok: false, error: "Please describe what you ate." }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (text.length > 500) {
      return new Response(JSON.stringify({ ok: false, error: "Description too long (max 500 chars)." }), {
        status: 400,
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
        model: MODEL,
        messages: [
          {
            role: "system",
            content:
              "You are a nutrition expert. The user describes a food or meal in natural language (e.g. '2 eggs and a slice of toast', '100g chicken breast', 'a bowl of oatmeal with banana'). Estimate the TOTAL nutritional content for the FULL described portion (sum across items if multiple). Provide a clean, capitalized food name summarizing what was eaten. Always call the parse_food tool. If the input is not food, set is_food to false.",
          },
          { role: "user", content: text.trim() },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "parse_food",
              description: "Return parsed nutritional content of the described meal",
              parameters: {
                type: "object",
                properties: {
                  is_food: { type: "boolean" },
                  name: { type: "string", description: "Clean, capitalized name (e.g. '2 Eggs & Toast')" },
                  calories: { type: "number" },
                  protein: { type: "number", description: "grams" },
                  carbs: { type: "number", description: "grams" },
                  fat: { type: "number", description: "grams" },
                  confidence: { type: "string", enum: ["high", "medium", "low"] },
                },
                required: ["is_food", "name", "calories", "protein", "carbs", "fat", "confidence"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "parse_food" } },
      }),
    });

    if (!response.ok) {
      const t = await response.text();
      console.error("Lovable AI error:", response.status, t);
      let error = "AI parsing failed";
      if (response.status === 429) error = "Rate limit reached. Please try again shortly.";
      else if (response.status === 402) error = "AI credits exhausted.";
      return new Response(JSON.stringify({ ok: false, error, status: response.status }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    const toolCall = data?.choices?.[0]?.message?.tool_calls?.[0];
    const argsStr = toolCall?.function?.arguments;

    if (!argsStr) {
      return new Response(JSON.stringify({ ok: false, error: "Couldn't understand that. Try being more specific." }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let result: any;
    try {
      result = typeof argsStr === "string" ? JSON.parse(argsStr) : argsStr;
    } catch {
      return new Response(JSON.stringify({ ok: false, error: "Invalid AI response." }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!result.is_food) {
      return new Response(JSON.stringify({ ok: false, error: "That doesn't look like food. Try again." }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    admin.from("ai_usage").insert({ user_id: userId, feature: FEATURE, used_on: today }).then();

    return new Response(JSON.stringify({ ok: true, ...result }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("parse-food-text error:", e);
    return new Response(
      JSON.stringify({ ok: false, error: "An internal error occurred. Please try again." }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
