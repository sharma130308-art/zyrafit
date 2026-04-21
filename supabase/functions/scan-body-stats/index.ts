import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const FEATURE = "body_scan";
const GEMINI_MODEL = "gemini-2.5-flash";

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

    const MAX_BYTES = 5 * 1024 * 1024;
    const contentLength = Number(req.headers.get("content-length") ?? 0);
    if (contentLength > MAX_BYTES) {
      return new Response(JSON.stringify({ ok: false, error: "Image too large (max 5MB)" }), {
        status: 413,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { imageBase64 } = await req.json();
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

    const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
    if (!GEMINI_API_KEY) throw new Error("GEMINI_API_KEY is not configured");

    const match = imageBase64.match(/^data:(image\/[a-zA-Z+]+);base64,(.+)$/);
    if (!match) {
      return new Response(JSON.stringify({ ok: false, error: "Invalid image format" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const mimeType = match[1];
    const rawBase64 = match[2];

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          systemInstruction: {
            parts: [
              {
                text: `You are a body composition data extraction expert. You read gym receipts, body scan printouts, and similar documents. Extract all available data. Convert units if needed (stones/lbs to kg, feet/inches to meters). Always call the extract_body_stats function.`,
              },
            ],
          },
          contents: [
            {
              role: "user",
              parts: [
                { text: "Extract body composition data from this gym receipt or body scan printout. Get weight, height, BMI, body fat percentage, and body fat mass if available." },
                { inlineData: { mimeType, data: rawBase64 } },
              ],
            },
          ],
          tools: [
            {
              functionDeclarations: [
                {
                  name: "extract_body_stats",
                  description: "Extract body composition stats from the image",
                  parameters: {
                    type: "OBJECT",
                    properties: {
                      found: { type: "BOOLEAN" },
                      weight_kg: { type: "NUMBER" },
                      height_m: { type: "NUMBER" },
                      bmi: { type: "NUMBER" },
                      body_fat_percent: { type: "NUMBER" },
                      body_fat_mass_kg: { type: "NUMBER" },
                      date: { type: "STRING", description: "YYYY-MM-DD if available" },
                      age: { type: "NUMBER" },
                      gender: { type: "STRING" },
                    },
                    required: ["found"],
                  },
                },
              ],
            },
          ],
          toolConfig: {
            functionCallingConfig: { mode: "ANY", allowedFunctionNames: ["extract_body_stats"] },
          },
        }),
      }
    );

    if (!response.ok) {
      const t = await response.text();
      console.error("Gemini error:", response.status, t);
      let error = "AI analysis failed";
      if (response.status === 429) error = "Gemini rate limit reached. Try again shortly.";
      else if (response.status === 401 || response.status === 403) error = "Gemini API key invalid.";
      return new Response(JSON.stringify({ ok: false, error, status: response.status }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    const fnCall = data?.candidates?.[0]?.content?.parts?.find((p: any) => p.functionCall)?.functionCall;

    if (!fnCall?.args) {
      return new Response(JSON.stringify({ ok: false, error: "No analysis returned" }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const result = fnCall.args;

    admin.from("ai_usage").insert({ user_id: userId, feature: FEATURE, used_on: today }).then();

    return new Response(JSON.stringify({ ok: true, ...result }), {
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
