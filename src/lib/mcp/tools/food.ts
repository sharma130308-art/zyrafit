import { defineTool } from "mcp-tanstack-start";
import { z } from "zod";
import { createClient } from "@supabase/supabase-js";

function userClient(token: string) {
  return createClient(
    process.env.VITE_SUPABASE_URL ?? process.env.SUPABASE_URL!,
    process.env.VITE_SUPABASE_PUBLISHABLE_KEY ?? process.env.SUPABASE_PUBLISHABLE_KEY!,
    { global: { headers: { Authorization: `Bearer ${token}` } } },
  );
}

export const listFoodEntriesTool = defineTool({
  name: "list_food_entries",
  description: "List the user's logged food entries for a given date (YYYY-MM-DD). Defaults to today.",
  parameters: z.object({
    date: z.string().optional().describe("Date in YYYY-MM-DD format. Defaults to today (UTC)."),
  }),
  execute: async ({ date }, { auth }: any) => {
    if (!auth?.token) return "Not authenticated.";
    const day = date ?? new Date().toISOString().slice(0, 10);
    const supabase = userClient(auth.token);
    const { data, error } = await supabase
      .from("food_entries")
      .select("id,name,calories,protein,carbs,fat,meal,created_at")
      .gte("created_at", `${day}T00:00:00Z`)
      .lt("created_at", `${day}T23:59:59Z`)
      .order("created_at", { ascending: true });
    if (error) return `Error: ${error.message}`;
    if (!data?.length) return `No food entries for ${day}.`;
    const totals = data.reduce(
      (a, e: any) => ({
        calories: a.calories + (e.calories ?? 0),
        protein: a.protein + (e.protein ?? 0),
        carbs: a.carbs + (e.carbs ?? 0),
        fat: a.fat + (e.fat ?? 0),
      }),
      { calories: 0, protein: 0, carbs: 0, fat: 0 },
    );
    return JSON.stringify({ date: day, entries: data, totals }, null, 2);
  },
});

export const getDailySummaryTool = defineTool({
  name: "get_daily_summary",
  description: "Get total calories and macros for the user on a given date.",
  parameters: z.object({
    date: z.string().optional(),
  }),
  execute: async ({ date }, { auth }: any) => {
    if (!auth?.token) return "Not authenticated.";
    const day = date ?? new Date().toISOString().slice(0, 10);
    const supabase = userClient(auth.token);
    const { data, error } = await supabase
      .from("food_entries")
      .select("calories,protein,carbs,fat")
      .gte("created_at", `${day}T00:00:00Z`)
      .lt("created_at", `${day}T23:59:59Z`);
    if (error) return `Error: ${error.message}`;
    const totals = (data ?? []).reduce(
      (a, e: any) => ({
        calories: a.calories + (e.calories ?? 0),
        protein: a.protein + (e.protein ?? 0),
        carbs: a.carbs + (e.carbs ?? 0),
        fat: a.fat + (e.fat ?? 0),
      }),
      { calories: 0, protein: 0, carbs: 0, fat: 0 },
    );
    return JSON.stringify({ date: day, ...totals }, null, 2);
  },
});

export const getBodyStatsTool = defineTool({
  name: "get_body_stats",
  description: "Get the user's most recent body composition stats (weight, BMI, body fat %).",
  parameters: z.object({}),
  execute: async (_args, { auth }: any) => {
    if (!auth?.token) return "Not authenticated.";
    const supabase = userClient(auth.token);
    const { data, error } = await supabase
      .from("body_stats")
      .select("*")
      .order("recorded_at", { ascending: false })
      .limit(5);
    if (error) return `Error: ${error.message}`;
    return JSON.stringify(data, null, 2);
  },
});
