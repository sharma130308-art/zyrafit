import { s as supabase } from "./router-L3bJVu16.js";
import { logScan } from "./scan-debug-BSopg_nn.js";
import "react/jsx-runtime";
import "@tanstack/react-router";
import "react";
import "framer-motion";
import "lucide-react";
import "sonner";
import "@supabase/supabase-js";
import "@capacitor/core";
import "@capacitor/haptics";
import "mcp-tanstack-start";
import "zod";
const CACHE_KEY = "zyra:fastScanCache:v1";
const CACHE_TTL_MS = 30 * 24 * 60 * 60 * 1e3;
async function sha256Hex(input) {
  try {
    if (typeof crypto === "undefined" || !crypto.subtle) return null;
    const buf = new TextEncoder().encode(input);
    const digest = await crypto.subtle.digest("SHA-256", buf);
    return Array.from(new Uint8Array(digest)).map((b) => b.toString(16).padStart(2, "0")).join("");
  } catch {
    return null;
  }
}
function readCache() {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(CACHE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}
function writeCache(entries) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(CACHE_KEY, JSON.stringify(entries));
  } catch {
    try {
      const half = entries.slice(-Math.ceil(entries.length / 2));
      window.localStorage.setItem(CACHE_KEY, JSON.stringify(half));
    } catch {
    }
  }
}
function getCachedResult(hash) {
  const now = Date.now();
  const entries = readCache().filter((e) => now - e.ts < CACHE_TTL_MS);
  const hit = entries.find((e) => e.hash === hash);
  if (!hit) {
    if (entries.length !== readCache().length) writeCache(entries);
    return null;
  }
  return hit.result;
}
function putCachedResult(hash, result) {
  const now = Date.now();
  const existing = readCache().filter((e) => e.hash !== hash && now - e.ts < CACHE_TTL_MS);
  existing.push({ hash, result, ts: now });
  const trimmed = existing.slice(-40);
  writeCache(trimmed);
}
async function analyzePhoto(imageBase64, opts = {}) {
  const fast = opts.fast === true;
  const sizeKb = Math.round(imageBase64.length * 3 / 4 / 1024);
  const started = performance.now();
  logScan(`invoke analyze-food${fast ? " (fast)" : ""}`, "info", `payload ~${sizeKb} KB`);
  let hash = null;
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
  try {
    const res = await supabase.functions.invoke("analyze-food", {
      body: { imageBase64, fast }
    });
    const ms = Math.round(performance.now() - started);
    if (res.error) {
      logScan("invoke returned error — falling back to fetch", "error", `${ms}ms — ${res.error.message || JSON.stringify(res.error)}`);
      return await analyzeViaFetch(imageBase64, started, fast, hash);
    }
    const data = res.data;
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
    const result = data;
    if (fast && hash && result.is_food && result.items?.length) {
      putCachedResult(hash, result);
    }
    return result;
  } catch (networkErr) {
    const ms = Math.round(performance.now() - started);
    logScan(
      "invoke threw — trying direct fetch",
      "error",
      `${ms}ms — ${networkErr instanceof Error ? networkErr.message : String(networkErr)}`
    );
    return await analyzeViaFetch(imageBase64, started, fast, hash);
  }
}
function clearFastScanCache() {
  if (typeof window !== "undefined") window.localStorage.removeItem(CACHE_KEY);
}
async function analyzeViaFetch(imageBase64, started, fast = false, hash = null) {
  const SUPABASE_URL = "https://kmoxjqrkcdrwvqnlyalf.supabase.co";
  const ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imttb3hqcXJrY2Ryd3Zxbmx5YWxmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU4NDIxODcsImV4cCI6MjA5MTQxODE4N30.i0WpkG3XEZ_A8VqHcejlB19WJx7ZJ7XfFluKg_ttr38";
  const { data: sessionData } = await supabase.auth.getSession();
  const accessToken = sessionData?.session?.access_token;
  if (!accessToken) {
    logScan("no auth session for fetch", "error");
    throw new Error("Sign in to use AI photo scan.");
  }
  const url = `${SUPABASE_URL}/functions/v1/analyze-food`;
  logScan("direct fetch", "info", url);
  let res;
  const controller = new AbortController();
  const timeoutMs = fast ? 25e3 : 6e4;
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  try {
    res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
        apikey: ANON_KEY
      },
      body: JSON.stringify({ imageBase64, fast }),
      signal: controller.signal
    });
  } catch (e) {
    const ms2 = Math.round(performance.now() - started);
    const aborted = e?.name === "AbortError";
    const msg = aborted ? "AI service took too long (over 60s) — try a smaller / clearer photo." : e instanceof Error ? e.message : String(e);
    logScan("direct fetch network error", "error", `${ms2}ms — ${msg}`);
    throw new Error(
      aborted ? msg : `Couldn't reach the AI service (${msg}). Try the published app URL or check your connection.`
    );
  } finally {
    clearTimeout(timeoutId);
  }
  const ms = Math.round(performance.now() - started);
  let bodyText = "";
  try {
    bodyText = await res.text();
  } catch {
  }
  if (!res.ok) {
    logScan("direct fetch HTTP error", "error", `${ms}ms — ${res.status} ${res.statusText} — ${bodyText.slice(0, 300)}`);
    throw new Error(`AI service responded ${res.status}: ${bodyText.slice(0, 200) || res.statusText}`);
  }
  let data = null;
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
  const result = data;
  if (fast && hash && result.is_food && result.items?.length) {
    putCachedResult(hash, result);
  }
  return result;
}
async function captureImageAsBase64(file) {
  logScan("capture file", "info", `${file.name || "(no name)"} • ${file.type || "?"} • ${Math.round(file.size / 1024)} KB`);
  const raw = await readFileAsDataUrl(file);
  try {
    const out = await downscaleDataUrl(raw, 768, 0.6);
    logScan("downscale ok", "ok", `${Math.round(out.length * 3 / 4 / 1024)} KB`);
    return out;
  } catch (e) {
    logScan("downscale failed — using raw", "error", e instanceof Error ? e.message : String(e));
    return raw;
  }
}
async function captureImageAsBase64Fast(file) {
  logScan("capture file (fast)", "info", `${file.name || "(no name)"} • ${Math.round(file.size / 1024)} KB`);
  const raw = await readFileAsDataUrl(file);
  try {
    const out = await downscaleDataUrl(raw, 512, 0.5);
    logScan("downscale fast ok", "ok", `${Math.round(out.length * 3 / 4 / 1024)} KB`);
    return out;
  } catch (e) {
    logScan("downscale fast failed — using raw", "error", e instanceof Error ? e.message : String(e));
    return raw;
  }
}
async function captureReceiptAsBase64(file) {
  logScan("capture receipt", "info", `${file.name || "(no name)"} • ${Math.round(file.size / 1024)} KB`);
  const raw = await readFileAsDataUrl(file);
  try {
    const out = await downscaleDataUrl(raw, 1280, 0.78);
    logScan("downscale receipt ok", "ok", `${Math.round(out.length * 3 / 4 / 1024)} KB`);
    return out;
  } catch (e) {
    logScan("downscale receipt failed — using raw", "error", e instanceof Error ? e.message : String(e));
    return raw;
  }
}
function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(reader.error || new Error("Read failed"));
    reader.readAsDataURL(file);
  });
}
async function downscaleDataUrl(dataUrl, maxDim, quality) {
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
function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Image decode failed"));
    img.src = src;
  });
}
export {
  analyzePhoto,
  captureImageAsBase64,
  captureImageAsBase64Fast,
  captureReceiptAsBase64,
  clearFastScanCache
};
