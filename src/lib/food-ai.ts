import { supabase } from "@/integrations/supabase/client";
import { logScan } from "@/lib/scan-debug";

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
  const sizeKb = Math.round((imageBase64.length * 3) / 4 / 1024);
  const started = performance.now();
  logScan("invoke analyze-food", "info", `payload ~${sizeKb} KB`);

  let data: any = null;
  let error: any = null;
  try {
    const res = await supabase.functions.invoke("analyze-food", {
      body: { imageBase64 },
    });
    data = res.data;
    error = res.error;
  } catch (networkErr) {
    const ms = Math.round(performance.now() - started);
    logScan(
      "analyze-food network error",
      "error",
      `${ms}ms — ${networkErr instanceof Error ? networkErr.message : String(networkErr)}`,
    );
    throw networkErr;
  }

  const ms = Math.round(performance.now() - started);

  if (error) {
    logScan("analyze-food returned error", "error", `${ms}ms — ${error.message || JSON.stringify(error)}`);
    throw new Error(error.message || "Analysis failed");
  }
  if (!data) {
    logScan("analyze-food empty response", "error", `${ms}ms`);
    throw new Error("No response from analysis service");
  }
  if (data.ok === false || data.error) {
    logScan("analyze-food rejected", "error", `${ms}ms — ${data.error || "unknown"}`);
    throw new Error(data.error || "Analysis failed");
  }

  const itemCount = Array.isArray(data.items) ? data.items.length : 0;
  logScan("analyze-food ok", "ok", `${ms}ms — is_food=${data.is_food} items=${itemCount}`);
  return data as AIFoodResult;
}

/**
 * Read a File as a data-URL, then downscale + recompress to JPEG so that
 * even multi-MB phone photos fit under the edge function's 5 MB ceiling
 * and upload quickly. Falls back to the raw base64 if anything goes wrong.
 */
export async function captureImageAsBase64(file: File): Promise<string> {
  logScan("capture file", "info", `${file.name || "(no name)"} • ${file.type || "?"} • ${Math.round(file.size / 1024)} KB`);
  const raw = await readFileAsDataUrl(file);
  try {
    const out = await downscaleDataUrl(raw, 1280, 0.82);
    logScan("downscale ok", "ok", `${Math.round((out.length * 3) / 4 / 1024)} KB`);
    return out;
  } catch (e) {
    logScan("downscale failed — using raw", "error", e instanceof Error ? e.message : String(e));
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
