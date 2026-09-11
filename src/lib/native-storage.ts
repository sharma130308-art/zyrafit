/**
 * Durable offline storage for the native app.
 *
 * The app is offline-first and keeps its hot cache in localStorage (sync,
 * instant reads). Inside a WebView the OS may evict localStorage under
 * storage pressure, so on iOS/Android we mirror every write into
 * @capacitor/preferences (UserDefaults / SharedPreferences), and restore any
 * missing keys from that mirror before the app renders.
 *
 * On the web this module is a no-op.
 */
import { isNative } from "./native";

const INDEX_KEY = "__zyrafit_ls_index__";
let installed = false;

export async function hydrateNativeStorage(): Promise<void> {
  if (typeof window === "undefined" || !isNative() || installed) return;
  installed = true;

  const { Preferences } = await import("@capacitor/preferences");

  // 1. Restore keys that exist in the mirror but are missing from localStorage.
  try {
    const { keys } = await Preferences.keys();
    for (const key of keys) {
      if (key === INDEX_KEY) continue;
      if (window.localStorage.getItem(key) !== null) continue;
      const { value } = await Preferences.get({ key });
      if (value !== null) window.localStorage.setItem(key, value);
    }
  } catch (err) {
    console.warn("[native-storage] restore failed:", err);
  }

  // 2. Mirror future writes (fire-and-forget, never blocks the UI thread).
  const proto = Storage.prototype;
  const origSet = proto.setItem;
  const origRemove = proto.removeItem;
  const origClear = proto.clear;

  proto.setItem = function (this: Storage, key: string, value: string) {
    origSet.call(this, key, value);
    if (this === window.localStorage) {
      Preferences.set({ key, value }).catch(() => {});
    }
  };
  proto.removeItem = function (this: Storage, key: string) {
    origRemove.call(this, key);
    if (this === window.localStorage) {
      Preferences.remove({ key }).catch(() => {});
    }
  };
  proto.clear = function (this: Storage) {
    origClear.call(this);
    if (this === window.localStorage) {
      Preferences.clear().catch(() => {});
    }
  };

  // 3. Seed the mirror with whatever is already in localStorage.
  try {
    for (let i = 0; i < window.localStorage.length; i++) {
      const key = window.localStorage.key(i);
      if (!key) continue;
      const value = window.localStorage.getItem(key);
      if (value !== null) Preferences.set({ key, value }).catch(() => {});
    }
  } catch {
    /* ignore */
  }
}
