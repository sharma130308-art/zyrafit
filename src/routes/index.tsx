import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/")({
  component: IndexRedirect,
});

function IndexRedirect() {
  const navigate = useNavigate();
  const { user, loading } = useAuth();

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
      if (data?.onboarding_completed) {
        navigate({ to: "/app", replace: true });
      } else {
        navigate({ to: "/onboarding", replace: true });
      }
    })();
    return () => { cancelled = true; };
  }, [user, loading, navigate]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <motion.div
        className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent"
        animate={{ rotate: 360 }}
        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
      />
    </div>
  );
}
