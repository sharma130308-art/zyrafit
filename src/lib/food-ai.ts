import { supabase } from "@/integrations/supabase/client";

export interface AIFoodItem {
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  confidence: "high" | "medium" | "low";
}

export interface AIFoodResult {
  is_food: boolean;
  items: AIFoodItem[];
}

export async function analyzePhoto(imageBase64: string): Promise<AIFoodResult> {
  const { data, error } = await supabase.functions.invoke("analyze-food", {
    body: { imageBase64 },
  });

  if (error) throw new Error(error.message || "Analysis failed");

  if (data.error) throw new Error(data.error);

  return data as AIFoodResult;
}

export function captureImageAsBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
