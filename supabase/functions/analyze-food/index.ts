import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const FEATURE = "photo_scan";
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
      return new Response(JSON.stringify({ ok: false, error: "Sign in to use AI photo scan." }), {
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

    const MAX_BYTES = 5 * 1024 * 1024;
    const contentLength = Number(req.headers.get("content-length") ?? 0);
    if (contentLength > MAX_BYTES) {
      return new Response(JSON.stringify({ ok: false, error: "Image too large (max 5MB)" }), {
        status: 413,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { imageBase64, fast } = await req.json();
    const fastMode = fast === true;
    if (!imageBase64 || typeof imageBase64 !== "string" || !imageBase64.startsWith("data:image/")) {
      return new Response(JSON.stringify({ ok: false, error: "Invalid image" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (imageBase64.length > MAX_BYTES) {
      return new Response(JSON.stringify({ ok: false, error: "Image too large (max 5MB)" }), {
        status: 413,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const systemPrompt = fastMode
      ? "You are a fast nutrition estimator. Glance at the photo and return a SINGLE summary food item that totals everything visible. Speed over precision — round numbers are fine. If not food, set is_food=false. Always call analyze_food."
      : "You are a nutrition analysis expert. Analyze food photos and estimate calories and macronutrients per typical serving shown. If the image doesn't contain food, set is_food to false. Identify each distinct food item visible. Always call the analyze_food tool.";

    const userPrompt = fastMode
      ? "Quickly estimate ONE summary item with total calories/protein/carbs/fat for everything in this photo."
      : "Analyze this food photo. Identify all food items and estimate their nutritional content per typical serving shown.";

    const itemProps: any = {
      name: { type: "string" },
      calories: { type: "number" },
      protein: { type: "number" },
      carbs: { type: "number" },
      fat: { type: "number" },
    };
    const requiredItem = ["name", "calories", "protein", "carbs", "fat"];
    if (!fastMode) {
      itemProps.confidence = { type: "string", enum: ["high", "medium", "low"] };
      requiredItem.push("confidence");
    }

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [
          { role: "system", content: systemPrompt },
          {
            role: "user",
            content: [
              { type: "text", text: userPrompt },
              { type: "image_url", image_url: { url: imageBase64 } },
            ],
          },
        ],
        ...(fastMode ? { reasoning: { effort: "none" } } : {}),
        tools: [
          {
            type: "function",
            function: {
              name: "analyze_food",
              description: fastMode
                ? "Return ONE summary food item totaling everything in the photo"
                : "Return nutritional analysis of food items in the photo",
              parameters: {
                type: "object",
                properties: {
                  is_food: { type: "boolean", description: "Whether the image contains food" },
                  items: {
                    type: "array",
                    ...(fastMode ? { maxItems: 1 } : {}),
                    items: {
                      type: "object",
                      properties: itemProps,
                      required: requiredItem,
                      additionalProperties: false,
                    },
                  },
                },
                required: ["is_food", "items"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "analyze_food" } },
      }),
    });

    if (!response.ok) {
      const t = await response.text();
      console.error("Lovable AI error:", response.status, t);
      let error = "AI analysis failed";
      if (response.status === 429) error = "Rate limit reached. Please try again shortly.";
      else if (response.status === 402)
        error = "AI credits exhausted. Add funds in Lovable workspace settings.";
      else if (response.status === 401 || response.status === 403)
        error = "AI service auth error.";
      return new Response(JSON.stringify({ ok: false, error, status: response.status }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    const toolCall = data?.choices?.[0]?.message?.tool_calls?.[0];
    const argsStr = toolCall?.function?.arguments;

    if (!argsStr) {
      console.error("No tool call in response:", JSON.stringify(data).slice(0, 500));
      return new Response(JSON.stringify({ ok: false, error: "No analysis returned" }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let result: any;
    try {
      result = typeof argsStr === "string" ? JSON.parse(argsStr) : argsStr;
    } catch (e) {
      console.error("Failed to parse tool args:", argsStr);
      return new Response(JSON.stringify({ ok: false, error: "Invalid AI response format" }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (fastMode && Array.isArray(result?.items)) {
      result.items = result.items.map((it: any) => ({ ...it, confidence: it.confidence ?? "low" }));
    }

    {
      const { error: usageErr } = await admin
        .from("ai_usage")
        .insert({ user_id: userId, feature: fastMode ? "photo_scan_fast" : FEATURE, used_on: today });
      if (usageErr) console.error("ai_usage insert failed:", usageErr);
    }


    return new Response(JSON.stringify({ ok: true, ...result }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("analyze-food error:", e);
    return new Response(
      JSON.stringify({ ok: false, error: "An internal error occurred. Please try again." }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
