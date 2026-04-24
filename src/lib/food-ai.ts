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
  if (!data) throw new Error("No response from analysis service");
  if (data.ok === false) throw new Error(data.error || "Analysis failed");
  if (data.error) throw new Error(data.error);

  return data as AIFoodResult;
}

/**
 * Read a File as a data-URL, then downscale + recompress to JPEG so that
 * even multi-MB phone photos fit under the edge function's 5 MB ceiling
 * and upload quickly. Falls back to the raw base64 if anything goes wrong.
 */
export async function captureImageAsBase64(file: File): Promise<string> {
  const raw = await readFileAsDataUrl(file);
  try {
    return await downscaleDataUrl(raw, 1280, 0.82);
  } catch {
    return raw;
  }
}

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error || new Error("Read failed"));
    reader.readAsDataURL(file);
  });
}

async function downscaleDataUrl(dataUrl: string, maxDim: number, quality: number): Promise<string> {
  if (typeof document === "undefined") return dataUrl;
  const img = await loadImage(dataUrl);
  const scale = Math.min(maxDim / img.width, maxDim / img.height, 1);
  const w = Math.max(1, Math.round(img.width * scale));
  const h = Math.max(1, Math.round(img.height * scale));
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) return dataUrl;
  ctx.drawImage(img, 0, 0, w, h);
  return canvas.toDataURL("image/jpeg", quality);
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Image decode failed"));
    img.src = src;
  });
}
