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

// ── Fast Scan result cache (localStorage, keyed by SHA-256 of base64 image)
const CACHE_KEY = "zyra:fastScanCache:v1";
const CACHE_MAX_ENTRIES = 40;
const CACHE_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

type CacheEntry = { hash: string; result: AIFoodResult; ts: number };

async function sha256Hex(input: string): Promise<string | null> {
  try {
    if (typeof crypto === "undefined" || !crypto.subtle) return null;
    const buf = new TextEncoder().encode(input);
    const digest = await crypto.subtle.digest("SHA-256", buf);
    return Array.from(new Uint8Array(digest))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
  } catch {
    return null;
  }
}

function readCache(): CacheEntry[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(CACHE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as CacheEntry[]) : [];
  } catch {
    return [];
  }
}

function writeCache(entries: CacheEntry[]) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(CACHE_KEY, JSON.stringify(entries));
  } catch {
    // quota exceeded — drop oldest half and retry once
    try {
      const half = entries.slice(-Math.ceil(entries.length / 2));
      window.localStorage.setItem(CACHE_KEY, JSON.stringify(half));
    } catch {
      /* give up */
    }
  }
}

function getCachedResult(hash: string): AIFoodResult | null {
  const now = Date.now();
  const entries = readCache().filter((e) => now - e.ts < CACHE_TTL_MS);
  const hit = entries.find((e) => e.hash === hash);
  if (!hit) {
    // Prune expired entries opportunistically
    if (entries.length !== readCache().length) writeCache(entries);
    return null;
  }
  return hit.result;
}

function putCachedResult(hash: string, result: AIFoodResult) {
  const now = Date.now();
  const existing = readCache().filter((e) => e.hash !== hash && now - e.ts < CACHE_TTL_MS);
  existing.push({ hash, result, ts: now });
  // Keep only the most recent CACHE_MAX_ENTRIES
  const trimmed = existing.slice(-CACHE_MAX_ENTRIES);
  writeCache(trimmed);
}

export async function analyzePhoto(
  imageBase64: string,
  opts: { fast?: boolean } = {},
): Promise<AIFoodResult> {
  const fast = opts.fast === true;
  const sizeKb = Math.round((imageBase64.length * 3) / 4 / 1024);
  const started = performance.now();
  logScan(`invoke analyze-food${fast ? " (fast)" : ""}`, "info", `payload ~${sizeKb} KB`);

  // Cache lookup (fast mode only — full mode may return more detailed items
  // and we don't want to lock users into a stale "fast" response).
  let hash: string | null = null;
  if (fast) {
    hash = await sha256Hex(imageBase64);
    if (hash) {
      const cached = getCachedResult(hash);
      if (cached) {
        const ms = Math.round(performance.now() - started);
        logScan("analyze-food cache hit", "ok", `${ms}ms — items=${cached.items?.length ?? 0}`);
        return cached;
      }
    }
  }

  // Try the supabase-js invoke first.
  try {
    const res = await supabase.functions.invoke("analyze-food", {
      body: { imageBase64, fast },
    });
    const ms = Math.round(performance.now() - started);

    if (res.error) {
      logScan("invoke returned error — falling back to fetch", "error", `${ms}ms — ${res.error.message || JSON.stringify(res.error)}`);
      return await analyzeViaFetch(imageBase64, started, fast, hash);
    }
    const data = res.data as any;
    if (!data) {
      logScan("invoke empty — falling back to fetch", "error", `${ms}ms`);
      return await analyzeViaFetch(imageBase64, started, fast, hash);
    }
    if (data.ok === false || data.error) {
      logScan("analyze-food rejected", "error", `${ms}ms — ${data.error || "unknown"}`);
      throw new Error(data.error || "Analysis failed");
    }
    const itemCount = Array.isArray(data.items) ? data.items.length : 0;
    logScan(`analyze-food ok (invoke${fast ? ", fast" : ""})`, "ok", `${ms}ms — is_food=${data.is_food} items=${itemCount}`);
    const result = data as AIFoodResult;
    if (fast && hash && result.is_food && result.items?.length) {
      putCachedResult(hash, result);
    }
    return result;
  } catch (networkErr) {
    const ms = Math.round(performance.now() - started);
    logScan(
      "invoke threw — trying direct fetch",
      "error",
      `${ms}ms — ${networkErr instanceof Error ? networkErr.message : String(networkErr)}`,
    );
    return await analyzeViaFetch(imageBase64, started, fast, hash);
  }
}

export function clearFastScanCache() {
  if (typeof window !== "undefined") window.localStorage.removeItem(CACHE_KEY);
}

/**
 * Direct fetch fallback. Bypasses supabase-js so we can see the real HTTP
 * status code and surface useful error messages instead of the opaque
 * "Failed to send a request to the Edge Function".
 */
async function analyzeViaFetch(imageBase64: string, started: number, fast = false, hash: string | null = null): Promise<AIFoodResult> {
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
  const result = data as AIFoodResult;
  if (fast && hash && result.is_food && result.items?.length) {
    putCachedResult(hash, result);
  }
  return result;
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
