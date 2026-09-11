import { jsx, jsxs } from "react/jsx-runtime";
import { Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { s as supabase } from "./router-L3bJVu16.js";
import { motion } from "framer-motion";
import { CheckCircle, Lock, EyeOff, Eye } from "lucide-react";
import "sonner";
import "@supabase/supabase-js";
import "@capacitor/core";
import "@capacitor/haptics";
import "mcp-tanstack-start";
import "zod";
function ResetPasswordPage() {
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [isRecovery, setIsRecovery] = useState(false);
  useEffect(() => {
    const {
      data: {
        subscription
      }
    } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") {
        setIsRecovery(true);
      }
    });
    if (window.location.hash.includes("type=recovery")) {
      setIsRecovery(true);
    }
    return () => subscription.unsubscribe();
  }, []);
  const handleReset = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const {
      error: error2
    } = await supabase.auth.updateUser({
      password
    });
    setLoading(false);
    if (error2) {
      setError(error2.message);
    } else {
      setSuccess(true);
    }
  };
  if (success) {
    return /* @__PURE__ */ jsx("div", { className: "min-h-screen bg-background flex items-center justify-center px-6", children: /* @__PURE__ */ jsxs(motion.div, { className: "w-full max-w-sm text-center", initial: {
      opacity: 0,
      scale: 0.95
    }, animate: {
      opacity: 1,
      scale: 1
    }, children: [
      /* @__PURE__ */ jsx("div", { className: "w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4", children: /* @__PURE__ */ jsx(CheckCircle, { className: "w-8 h-8 text-primary" }) }),
      /* @__PURE__ */ jsx("h1", { className: "text-2xl font-bold text-foreground", children: "Password Updated" }),
      /* @__PURE__ */ jsx("p", { className: "text-sm text-muted-foreground mt-2 mb-6", children: "Your password has been reset successfully." }),
      /* @__PURE__ */ jsx(Link, { to: "/app", className: "inline-flex items-center justify-center py-3.5 px-8 rounded-2xl bg-primary text-primary-foreground font-semibold shadow-lg shadow-primary/25", children: "Go to Dashboard" })
    ] }) });
  }
  if (!isRecovery) {
    return /* @__PURE__ */ jsx("div", { className: "min-h-screen bg-background flex items-center justify-center px-6", children: /* @__PURE__ */ jsxs(motion.div, { className: "w-full max-w-sm text-center", initial: {
      opacity: 0,
      y: 20
    }, animate: {
      opacity: 1,
      y: 0
    }, children: [
      /* @__PURE__ */ jsx("h1", { className: "text-2xl font-bold text-foreground mb-2", children: "Invalid Link" }),
      /* @__PURE__ */ jsx("p", { className: "text-sm text-muted-foreground mb-6", children: "This password reset link is invalid or has expired." }),
      /* @__PURE__ */ jsx(Link, { to: "/login", className: "inline-flex items-center justify-center py-3.5 px-8 rounded-2xl bg-primary text-primary-foreground font-semibold shadow-lg shadow-primary/25", children: "Back to Sign In" })
    ] }) });
  }
  return /* @__PURE__ */ jsx("div", { className: "min-h-screen bg-background flex items-center justify-center px-6", children: /* @__PURE__ */ jsxs(motion.div, { className: "w-full max-w-sm", initial: {
    opacity: 0,
    y: 20
  }, animate: {
    opacity: 1,
    y: 0
  }, children: [
    /* @__PURE__ */ jsxs("div", { className: "text-center mb-8", children: [
      /* @__PURE__ */ jsx("h1", { className: "text-3xl font-bold text-foreground", children: "New Password" }),
      /* @__PURE__ */ jsx("p", { className: "text-sm text-muted-foreground mt-1", children: "Enter your new password below" })
    ] }),
    /* @__PURE__ */ jsxs("form", { onSubmit: handleReset, className: "space-y-4", children: [
      /* @__PURE__ */ jsxs("div", { className: "relative", children: [
        /* @__PURE__ */ jsx(Lock, { className: "absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" }),
        /* @__PURE__ */ jsx("input", { type: showPassword ? "text" : "password", placeholder: "New password", value: password, onChange: (e) => setPassword(e.target.value), required: true, minLength: 6, className: "w-full pl-11 pr-11 py-3.5 rounded-2xl bg-card border border-border/50 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30" }),
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
      } }) : "Reset Password" })
    ] })
  ] }) });
}
export {
  ResetPasswordPage as component
};
