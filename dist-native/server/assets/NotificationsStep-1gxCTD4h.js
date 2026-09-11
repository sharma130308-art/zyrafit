import { jsxs, jsx, Fragment } from "react/jsx-runtime";
import { useState } from "react";
import { motion } from "framer-motion";
import { Bell, Clock, Flame, TrendingUp, Check, ArrowRight } from "lucide-react";
import { S as StepContainer } from "./onboarding-BZMoBYRn.js";
import { a as isPreviewEnvironment, s as subscribeToPush, i as isPushSupported } from "./push-CbfwDtlI.js";
import { c as hapticMedium, h as hapticLight } from "./router-L3bJVu16.js";
import "@tanstack/react-router";
import "./use-auth-gfzAGvwo.js";
import "./macro-calc-CwiqaSuT.js";
import "./zyrafit-icon-ZHgf3VwX.js";
import "sonner";
import "@supabase/supabase-js";
import "@capacitor/core";
import "@capacitor/haptics";
import "mcp-tanstack-start";
import "zod";
const BENEFITS = [
  {
    icon: Clock,
    title: "Gentle meal-time nudges",
    desc: "A quick tap at breakfast, lunch and dinner so you never forget to log."
  },
  {
    icon: Flame,
    title: "Stay on your streak",
    desc: "People who enable reminders log 3× more often and hit their macros."
  },
  {
    icon: TrendingUp,
    title: "Hit your goal faster",
    desc: "Consistent tracking is the #1 predictor of reaching your weight goal."
  }
];
function NotificationsStep({ onDone }) {
  const [status, setStatus] = useState("idle");
  const [errorMsg, setErrorMsg] = useState(null);
  const supported = isPushSupported();
  const preview = isPreviewEnvironment();
  const handleEnable = async () => {
    hapticMedium();
    setStatus("loading");
    setErrorMsg(null);
    if (!supported) {
      setErrorMsg("Notifications aren't supported on this device.");
      setStatus("denied");
      return;
    }
    if (preview) {
      setStatus("granted");
      setTimeout(onDone, 600);
      return;
    }
    const result = await subscribeToPush();
    if (result.ok) {
      setStatus("granted");
      setTimeout(onDone, 600);
    } else {
      setErrorMsg(result.error || "Couldn't enable notifications.");
      setStatus("denied");
    }
  };
  const handleSkip = () => {
    hapticLight();
    onDone();
  };
  return /* @__PURE__ */ jsxs(
    StepContainer,
    {
      icon: /* @__PURE__ */ jsx(Bell, { className: "w-6 h-6" }),
      title: "Never miss a meal",
      subtitle: "Turn on reminders to stay on track",
      children: [
        /* @__PURE__ */ jsxs("div", { className: "space-y-4", children: [
          /* @__PURE__ */ jsx(
            motion.div,
            {
              initial: { opacity: 0, y: 12 },
              animate: { opacity: 1, y: 0 },
              transition: { duration: 0.35 },
              className: "rounded-3xl bg-gradient-to-br from-primary/15 via-primary/5 to-transparent border border-primary/20 p-5",
              children: /* @__PURE__ */ jsxs("div", { className: "flex items-start gap-3", children: [
                /* @__PURE__ */ jsx("div", { className: "w-12 h-12 rounded-2xl bg-primary/20 flex items-center justify-center shrink-0", children: /* @__PURE__ */ jsx(Bell, { className: "w-6 h-6 text-primary" }) }),
                /* @__PURE__ */ jsxs("div", { children: [
                  /* @__PURE__ */ jsxs("p", { className: "text-sm font-semibold text-foreground leading-tight", children: [
                    "Logging takes 5 seconds —",
                    /* @__PURE__ */ jsx("br", {}),
                    "remembering is the hard part."
                  ] }),
                  /* @__PURE__ */ jsx("p", { className: "text-xs text-muted-foreground mt-1.5 leading-relaxed", children: "Reminders gently tap you at meal times so tracking becomes effortless." })
                ] })
              ] })
            }
          ),
          /* @__PURE__ */ jsx("div", { className: "space-y-2.5", children: BENEFITS.map((b, i) => /* @__PURE__ */ jsxs(
            motion.div,
            {
              initial: { opacity: 0, x: -8 },
              animate: { opacity: 1, x: 0 },
              transition: { duration: 0.3, delay: 0.1 + i * 0.06 },
              className: "flex items-start gap-3 p-3.5 rounded-2xl bg-card border border-border/50",
              children: [
                /* @__PURE__ */ jsx("div", { className: "w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0", children: /* @__PURE__ */ jsx(b.icon, { className: "w-4 h-4" }) }),
                /* @__PURE__ */ jsxs("div", { className: "min-w-0", children: [
                  /* @__PURE__ */ jsx("p", { className: "text-sm font-semibold text-foreground", children: b.title }),
                  /* @__PURE__ */ jsx("p", { className: "text-xs text-muted-foreground leading-relaxed mt-0.5", children: b.desc })
                ] })
              ]
            },
            b.title
          )) }),
          /* @__PURE__ */ jsx("p", { className: "text-[11px] text-muted-foreground text-center px-4 leading-relaxed", children: "We only send reminders for meals you haven't logged. You can turn them off anytime in Profile." }),
          errorMsg && /* @__PURE__ */ jsx("p", { className: "text-xs text-destructive text-center bg-destructive/10 rounded-xl px-3 py-2", children: errorMsg })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "mt-6 space-y-2.5", children: [
          /* @__PURE__ */ jsx(
            motion.button,
            {
              onClick: handleEnable,
              disabled: status === "loading",
              whileTap: { scale: 0.97 },
              className: "w-full flex items-center justify-center gap-2 py-4 rounded-2xl bg-primary text-primary-foreground font-semibold shadow-lg shadow-primary/25 disabled:opacity-60 transition-opacity",
              children: status === "loading" ? /* @__PURE__ */ jsx(
                motion.div,
                {
                  className: "w-5 h-5 rounded-full border-2 border-primary-foreground border-t-transparent",
                  animate: { rotate: 360 },
                  transition: { duration: 1, repeat: Infinity, ease: "linear" }
                }
              ) : status === "granted" ? /* @__PURE__ */ jsxs(Fragment, { children: [
                /* @__PURE__ */ jsx(Check, { className: "w-5 h-5" }),
                "Notifications enabled"
              ] }) : /* @__PURE__ */ jsxs(Fragment, { children: [
                /* @__PURE__ */ jsx(Bell, { className: "w-5 h-5" }),
                "Enable reminders",
                /* @__PURE__ */ jsx(ArrowRight, { className: "w-4 h-4" })
              ] })
            }
          ),
          /* @__PURE__ */ jsx(
            "button",
            {
              onClick: handleSkip,
              disabled: status === "loading",
              className: "w-full py-3 text-sm text-muted-foreground hover:text-foreground transition-colors",
              children: "Maybe later"
            }
          )
        ] })
      ]
    }
  );
}
export {
  NotificationsStep
};
