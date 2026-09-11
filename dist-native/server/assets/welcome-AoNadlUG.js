import { jsx, jsxs } from "react/jsx-runtime";
import { useNavigate, Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { ArrowRight, LogIn } from "lucide-react";
import { useState, useEffect } from "react";
import { u as useAuth } from "./use-auth-gfzAGvwo.js";
import { s as supabase } from "./router-L3bJVu16.js";
import "sonner";
import "@supabase/supabase-js";
import "@capacitor/core";
import "@capacitor/haptics";
import "mcp-tanstack-start";
import "zod";
function WelcomePage() {
  const navigate = useNavigate();
  const {
    user,
    loading
  } = useAuth();
  const [checking, setChecking] = useState(true);
  useEffect(() => {
    if (loading) return;
    if (!user) {
      setChecking(false);
      return;
    }
    let cancelled = false;
    (async () => {
      const {
        data
      } = await supabase.from("user_profiles").select("onboarding_completed").eq("user_id", user.id).maybeSingle();
      if (cancelled) return;
      if (data?.onboarding_completed) {
        navigate({
          to: "/app",
          replace: true
        });
      } else {
        setChecking(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user, loading, navigate]);
  if (loading || checking) {
    return /* @__PURE__ */ jsx("div", { className: "min-h-screen bg-background flex items-center justify-center", children: /* @__PURE__ */ jsx(motion.div, { className: "w-8 h-8 rounded-full border-2 border-primary border-t-transparent", animate: {
      rotate: 360
    }, transition: {
      duration: 1,
      repeat: Infinity,
      ease: "linear"
    } }) });
  }
  return /* @__PURE__ */ jsx("div", { className: "min-h-screen bg-background flex flex-col items-center justify-center px-6", children: /* @__PURE__ */ jsx(motion.div, { className: "w-full max-w-sm text-center", initial: {
    opacity: 0,
    y: 20
  }, animate: {
    opacity: 1,
    y: 0
  }, children: /* @__PURE__ */ jsxs("div", { className: "space-y-3", children: [
    /* @__PURE__ */ jsx(Link, { to: "/onboarding", children: /* @__PURE__ */ jsxs(motion.div, { whileTap: {
      scale: 0.97
    }, className: "w-full flex items-center justify-center gap-2 py-4 rounded-2xl bg-primary text-primary-foreground font-semibold shadow-lg shadow-primary/25", children: [
      "Get Started",
      /* @__PURE__ */ jsx(ArrowRight, { className: "w-4 h-4" })
    ] }) }),
    /* @__PURE__ */ jsx(Link, { to: "/login", children: /* @__PURE__ */ jsxs(motion.div, { whileTap: {
      scale: 0.97
    }, className: "w-full flex items-center justify-center gap-2 py-4 rounded-2xl bg-card border border-border/50 text-foreground font-medium hover:bg-accent transition-colors mt-3", children: [
      /* @__PURE__ */ jsx(LogIn, { className: "w-4 h-4" }),
      "I already have an account"
    ] }) })
  ] }) }) });
}
export {
  WelcomePage as component
};
