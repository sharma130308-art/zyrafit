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

export async function analyzePhoto(
  imageBase64: string,
  opts: { fast?: boolean } = {},
): Promise<AIFoodResult> {
  const fast = opts.fast === true;
  const sizeKb = Math.round((imageBase64.length * 3) / 4 / 1024);
  const started = performance.now();
  logScan(`invoke analyze-food${fast ? " (fast)" : ""}`, "info", `payload ~${sizeKb} KB`);

  // Try the supabase-js invoke first.
  try {
    const res = await supabase.functions.invoke("analyze-food", {
      body: { imageBase64, fast },
    });
    const ms = Math.round(performance.now() - started);

    if (res.error) {
      logScan("invoke returned error — falling back to fetch", "error", `${ms}ms — ${res.error.message || JSON.stringify(res.error)}`);
      return await analyzeViaFetch(imageBase64, started, fast);
    }
    const data = res.data as any;
    if (!data) {
      logScan("invoke empty — falling back to fetch", "error", `${ms}ms`);
      return await analyzeViaFetch(imageBase64, started, fast);
    }
    if (data.ok === false || data.error) {
      logScan("analyze-food rejected", "error", `${ms}ms — ${data.error || "unknown"}`);
      throw new Error(data.error || "Analysis failed");
    }
    const itemCount = Array.isArray(data.items) ? data.items.length : 0;
    logScan(`analyze-food ok (invoke${fast ? ", fast" : ""})`, "ok", `${ms}ms — is_food=${data.is_food} items=${itemCount}`);
    return data as AIFoodResult;
  } catch (networkErr) {
    const ms = Math.round(performance.now() - started);
    logScan(
      "invoke threw — trying direct fetch",
      "error",
      `${ms}ms — ${networkErr instanceof Error ? networkErr.message : String(networkErr)}`,
    );
    return await analyzeViaFetch(imageBase64, started, fast);
  }
}

/**
 * Direct fetch fallback. Bypasses supabase-js so we can see the real HTTP
 * status code and surface useful error messages instead of the opaque
 * "Failed to send a request to the Edge Function".
 */
async function analyzeViaFetch(imageBase64: string, started: number, fast = false): Promise<AIFoodResult> {
  const SUPABASE_URL = (import.meta as any).env?.VITE_SUPABASE_URL as string | undefined;
  const ANON_KEY = (import.meta as any).env?.VITE_SUPABASE_PUBLISHABLE_KEY as string | undefined;
  if (!SUPABASE_URL || !ANON_KEY) {
    logScan("missing supabase env", "error", `url=${!!SUPABASE_URL} key=${!!ANON_KEY}`);
    throw new Error("Backend not configured");
  }

  const { data: sessionData } = await supabase.auth.getSession();
  const accessToken = sessionData?.session?.access_token;
  if (!accessToken) {
    logScan("no auth session for fetch", "error");
    throw new Error("Sign in to use AI photo scan.");
  }

  const url = `${SUPABASE_URL}/functions/v1/analyze-food`;
  logScan("direct fetch", "info", url);

  let res: Response;
  const controller = new AbortController();
  const timeoutMs = fast ? 25000 : 60000;
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  try {
    res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
        apikey: ANON_KEY,
      },
      body: JSON.stringify({ imageBase64, fast }),
      signal: controller.signal,
    });
  } catch (e) {
    const ms = Math.round(performance.now() - started);
    const aborted = (e as any)?.name === "AbortError";
    const msg = aborted
      ? "AI service took too long (over 60s) — try a smaller / clearer photo."
      : e instanceof Error ? e.message : String(e);
    logScan("direct fetch network error", "error", `${ms}ms — ${msg}`);
    throw new Error(
      aborted ? msg : `Couldn't reach the AI service (${msg}). Try the published app URL or check your connection.`,
    );
  } finally {
    clearTimeout(timeoutId);
  }

  const ms = Math.round(performance.now() - started);
  let bodyText = "";
  try {
    bodyText = await res.text();
  } catch {
    // ignore
  }

  if (!res.ok) {
    logScan("direct fetch HTTP error", "error", `${ms}ms — ${res.status} ${res.statusText} — ${bodyText.slice(0, 300)}`);
    throw new Error(`AI service responded ${res.status}: ${bodyText.slice(0, 200) || res.statusText}`);
  }

  let data: any = null;
  try {
    data = bodyText ? JSON.parse(bodyText) : null;
  } catch {
    logScan("direct fetch invalid JSON", "error", `${ms}ms — ${bodyText.slice(0, 300)}`);
    throw new Error("AI service returned an invalid response");
  }

  if (!data || data.ok === false || data.error) {
    logScan("direct fetch rejected", "error", `${ms}ms — ${data?.error || "unknown"}`);
    throw new Error(data?.error || "Analysis failed");
  }

  const itemCount = Array.isArray(data.items) ? data.items.length : 0;
  logScan("analyze-food ok (fetch)", "ok", `${ms}ms — is_food=${data.is_food} items=${itemCount}`);
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
    // Aggressive downscale for speed: 768px is plenty for vision models to
    // identify food, and ~0.6 quality cuts payload by ~3× vs 0.9.
    const out = await downscaleDataUrl(raw, 768, 0.6);
    logScan("downscale ok", "ok", `${Math.round((out.length * 3) / 4 / 1024)} KB`);
    return out;
  } catch (e) {
    logScan("downscale failed — using raw", "error", e instanceof Error ? e.message : String(e));
    return raw;
  }
}

/**
 * Ultra-aggressive downscale for "Fast Scan" mode — prioritizes upload speed
 * over visual fidelity. 512px / quality 0.5 typically yields ~30-80 KB.
 */
export async function captureImageAsBase64Fast(file: File): Promise<string> {
  logScan("capture file (fast)", "info", `${file.name || "(no name)"} • ${Math.round(file.size / 1024)} KB`);
  const raw = await readFileAsDataUrl(file);
  try {
    const out = await downscaleDataUrl(raw, 512, 0.5);
    logScan("downscale fast ok", "ok", `${Math.round((out.length * 3) / 4 / 1024)} KB`);
    return out;
  } catch (e) {
    logScan("downscale fast failed — using raw", "error", e instanceof Error ? e.message : String(e));
    return raw;
  }
}

/**
 * Higher-resolution variant for receipts / body scan printouts where
 * text legibility matters. Still well under the 5 MB ceiling.
 */
export async function captureReceiptAsBase64(file: File): Promise<string> {
  logScan("capture receipt", "info", `${file.name || "(no name)"} • ${Math.round(file.size / 1024)} KB`);
  const raw = await readFileAsDataUrl(file);
  try {
    const out = await downscaleDataUrl(raw, 1280, 0.78);
    logScan("downscale receipt ok", "ok", `${Math.round((out.length * 3) / 4 / 1024)} KB`);
    return out;
  } catch (e) {
    logScan("downscale receipt failed — using raw", "error", e instanceof Error ? e.message : String(e));
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
