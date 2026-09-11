import { jsx, jsxs, Fragment } from "react/jsx-runtime";
import { useNavigate, Link } from "@tanstack/react-router";
import { useState } from "react";
import { s as supabase } from "./router-L3bJVu16.js";
import { l as lovable, i as isValidPhoneNumber, p as phoneToEmail } from "./phone-auth-CMP2Nvmq.js";
import { motion } from "framer-motion";
import { Phone, Lock, EyeOff, Eye, ArrowRight } from "lucide-react";
import { z as zyrafitIcon } from "./zyrafit-icon-ZHgf3VwX.js";
import "sonner";
import "@supabase/supabase-js";
import "@capacitor/core";
import "@capacitor/haptics";
import "mcp-tanstack-start";
import "zod";
import "@lovable.dev/cloud-auth-js";
function LoginPage() {
  const navigate = useNavigate();
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const redirectAfterAuth = async (userId) => {
    if (!userId) {
      navigate({
        to: "/app"
      });
      return;
    }
    const {
      data
    } = await supabase.from("user_profiles").select("onboarding_completed").eq("user_id", userId).maybeSingle();
    if (data?.onboarding_completed) {
      navigate({
        to: "/app"
      });
    } else {
      navigate({
        to: "/onboarding"
      });
    }
  };
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    if (!isValidPhoneNumber(phone)) {
      setError("Enter a valid phone number.");
      return;
    }
    setLoading(true);
    const {
      data: signInData,
      error: error2
    } = await supabase.auth.signInWithPassword({
      email: phoneToEmail(phone),
      password
    });
    setLoading(false);
    if (error2) {
      setError("That number and password don't match an account.");
    } else {
      await redirectAfterAuth(signInData.user?.id);
    }
  };
  return /* @__PURE__ */ jsx("div", { className: "min-h-screen bg-background flex items-center justify-center px-6", children: /* @__PURE__ */ jsxs(motion.div, { className: "w-full max-w-sm", initial: {
    opacity: 0,
    y: 20
  }, animate: {
    opacity: 1,
    y: 0
  }, children: [
    /* @__PURE__ */ jsxs("div", { className: "text-center mb-8", children: [
      /* @__PURE__ */ jsx("img", { src: zyrafitIcon, alt: "ZyraFit", className: "w-16 h-16 rounded-2xl mx-auto mb-3" }),
      /* @__PURE__ */ jsx("h1", { className: "text-3xl font-bold text-foreground", children: "ZyraFit" }),
      /* @__PURE__ */ jsx("p", { className: "text-sm text-muted-foreground mt-1", children: "Welcome back" })
    ] }),
    /* @__PURE__ */ jsxs("form", { onSubmit: handleSubmit, className: "space-y-4", children: [
      /* @__PURE__ */ jsxs("div", { className: "relative", children: [
        /* @__PURE__ */ jsx(Phone, { className: "absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" }),
        /* @__PURE__ */ jsx("input", { type: "tel", inputMode: "tel", autoComplete: "tel", placeholder: "Phone number", value: phone, onChange: (e) => setPhone(e.target.value), required: true, className: "w-full pl-11 pr-4 py-3.5 rounded-2xl bg-card border border-border/50 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30" })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "relative", children: [
        /* @__PURE__ */ jsx(Lock, { className: "absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" }),
        /* @__PURE__ */ jsx("input", { type: showPassword ? "text" : "password", placeholder: "Password", value: password, onChange: (e) => setPassword(e.target.value), required: true, minLength: 6, className: "w-full pl-11 pr-11 py-3.5 rounded-2xl bg-card border border-border/50 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30" }),
        /* @__PURE__ */ jsx("button", { type: "button", onClick: () => setShowPassword(!showPassword), className: "absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground", children: showPassword ? /* @__PURE__ */ jsx(EyeOff, { className: "w-4 h-4" }) : /* @__PURE__ */ jsx(Eye, { className: "w-4 h-4" }) })
      ] }),
      error && /* @__PURE__ */ jsx(motion.p, { initial: {
        opacity: 0
      }, animate: {
        opacity: 1
      }, className: "text-sm text-destructive text-center bg-destructive/10 rounded-xl px-4 py-2", children: error }),
      /* @__PURE__ */ jsx(motion.button, { type: "submit", disabled: loading, whileTap: {
        scale: 0.97
      }, className: "w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-primary text-primary-foreground font-semibold shadow-lg shadow-primary/25 disabled:opacity-50", children: loading ? /* @__PURE__ */ jsx(motion.div, { className: "w-5 h-5 rounded-full border-2 border-primary-foreground border-t-transparent", animate: {
        rotate: 360
      }, transition: {
        duration: 1,
        repeat: Infinity,
        ease: "linear"
      } }) : /* @__PURE__ */ jsxs(Fragment, { children: [
        "Sign In",
        /* @__PURE__ */ jsx(ArrowRight, { className: "w-4 h-4" })
      ] }) })
    ] }),
    /* @__PURE__ */ jsxs(Fragment, { children: [
      /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3 my-6", children: [
        /* @__PURE__ */ jsx("div", { className: "flex-1 h-px bg-border" }),
        /* @__PURE__ */ jsx("span", { className: "text-xs text-muted-foreground", children: "or continue with" }),
        /* @__PURE__ */ jsx("div", { className: "flex-1 h-px bg-border" })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "flex gap-3", children: [
        /* @__PURE__ */ jsxs(motion.button, { whileTap: {
          scale: 0.95
        }, onClick: async () => {
          setError(null);
          const result = await lovable.auth.signInWithOAuth("google", {
            redirect_uri: window.location.origin
          });
          if (result.error) {
            setError(result.error instanceof Error ? result.error.message : "Google sign-in failed");
          }
        }, className: "flex-1 flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-card border border-border/50 text-foreground font-medium hover:bg-accent transition-colors", children: [
          /* @__PURE__ */ jsxs("svg", { className: "w-5 h-5", viewBox: "0 0 24 24", children: [
            /* @__PURE__ */ jsx("path", { d: "M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z", fill: "#4285F4" }),
            /* @__PURE__ */ jsx("path", { d: "M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z", fill: "#34A853" }),
            /* @__PURE__ */ jsx("path", { d: "M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z", fill: "#FBBC05" }),
            /* @__PURE__ */ jsx("path", { d: "M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z", fill: "#EA4335" })
          ] }),
          "Google"
        ] }),
        /* @__PURE__ */ jsxs(motion.button, { whileTap: {
          scale: 0.95
        }, onClick: async () => {
          setError(null);
          const result = await lovable.auth.signInWithOAuth("apple", {
            redirect_uri: window.location.origin
          });
          if (result.error) {
            setError(result.error instanceof Error ? result.error.message : "Apple sign-in failed");
          }
        }, className: "flex-1 flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-card border border-border/50 text-foreground font-medium hover:bg-accent transition-colors", children: [
          /* @__PURE__ */ jsx("svg", { className: "w-5 h-5", viewBox: "0 0 24 24", fill: "currentColor", children: /* @__PURE__ */ jsx("path", { d: "M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" }) }),
          "Apple"
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsxs("p", { className: "text-center text-sm text-muted-foreground mt-6", children: [
      "Don't have an account?",
      " ",
      /* @__PURE__ */ jsx(Link, { to: "/onboarding", className: "text-primary font-medium", children: "Sign Up" })
    ] })
  ] }) });
}
export {
  LoginPage as component
};
