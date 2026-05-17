import { useEffect, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";

/**
 * Guards a protected route. Redirects:
 *  - to /welcome  when there is no signed-in user
 *  - to /onboarding when the user hasn't completed onboarding
 * Returns { user, ready } — `ready` is true once the guard has cleared the user.
 */
export function useRequireAuth() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (loading) return;
    if (!user) {
      navigate({ to: "/welcome", replace: true });
      return;
    }
    let cancelled = false;
    (async () => {
      const { data } = await supabase
        .from("user_profiles")
        .select("onboarding_completed")
        .eq("user_id", user.id)
        .maybeSingle();
      if (cancelled) return;
      if (!data?.onboarding_completed) {
        navigate({ to: "/onboarding", replace: true });
        return;
      }
      setReady(true);
    })();
    return () => { cancelled = true; };
  }, [user, loading, navigate]);

  return { user, ready: ready && !!user };
}
