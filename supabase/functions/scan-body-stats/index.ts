import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { imageBase64 } = await req.json();
    if (!imageBase64) {
      return new Response(JSON.stringify({ error: "No image provided" }), {
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

    return new Response(JSON.stringify({ ok: true, ...result }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("scan-body-stats error:", e);
    return new Response(
      JSON.stringify({ ok: false, error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
