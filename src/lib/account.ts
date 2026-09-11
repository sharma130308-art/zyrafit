/**
 * In-app account deletion (required by App Store guideline 5.1.1(v)).
 * Calls a security-definer database function that wipes all of the caller's
 * rows and removes the auth user, then clears every local cache.
 */
import { supabase } from "@/integrations/supabase/client";

export async function deleteOwnAccount(): Promise<{ ok: boolean; error?: string }> {
  const { error } = await (supabase.rpc as any)("delete_own_account");
  if (error) return { ok: false, error: error.message };

  // The auth user is gone server-side; drop the local session + caches.
  try {
    await supabase.auth.signOut({ scope: "local" });
  } catch {}
  try {
    if (typeof window !== "undefined") {
      window.localStorage.clear();
      window.sessionStorage.clear();
    }
  } catch {}
  return { ok: true };
}
