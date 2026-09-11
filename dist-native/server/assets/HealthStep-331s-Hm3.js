import { jsx, jsxs } from "react/jsx-runtime";
import { Check, Heart } from "lucide-react";
import { S as StepContainer } from "./onboarding-BZMoBYRn.js";
import "@tanstack/react-router";
import "react";
import "framer-motion";
import "./router-L3bJVu16.js";
import "sonner";
import "@supabase/supabase-js";
import "@capacitor/core";
import "@capacitor/haptics";
import "mcp-tanstack-start";
import "zod";
import "./use-auth-gfzAGvwo.js";
import "./macro-calc-CwiqaSuT.js";
import "./zyrafit-icon-ZHgf3VwX.js";
function HealthStep({
  appleHealth,
  setAppleHealth
}) {
  return /* @__PURE__ */ jsx(
    StepContainer,
    {
      icon: /* @__PURE__ */ jsx(Heart, { className: "w-6 h-6" }),
      title: "Connect Apple Health?",
      subtitle: "Sync your activity and nutrition data",
      children: /* @__PURE__ */ jsxs("div", { className: "space-y-4", children: [
        /* @__PURE__ */ jsxs(
          "button",
          {
            onClick: () => setAppleHealth(!appleHealth),
            className: `w-full flex items-center gap-4 p-5 rounded-2xl border-2 transition-all ${appleHealth ? "border-primary bg-primary/10" : "border-border/50 bg-card"}`,
            children: [
              /* @__PURE__ */ jsx("div", { className: "text-3xl", children: "🍎" }),
              /* @__PURE__ */ jsxs("div", { className: "text-left flex-1", children: [
                /* @__PURE__ */ jsx("h3", { className: "font-semibold text-foreground", children: "Apple Health" }),
                /* @__PURE__ */ jsx("p", { className: "text-xs text-muted-foreground", children: "Sync steps, workouts & more" })
              ] }),
              appleHealth && /* @__PURE__ */ jsx("div", { className: "w-7 h-7 rounded-full bg-primary flex items-center justify-center", children: /* @__PURE__ */ jsx(Check, { className: "w-4 h-4 text-primary-foreground" }) })
            ]
          }
        ),
        /* @__PURE__ */ jsx("p", { className: "text-xs text-muted-foreground text-center", children: "You can always connect it later in Settings" })
      ] })
    }
  );
}
export {
  HealthStep
};
