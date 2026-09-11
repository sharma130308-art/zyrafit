import { jsx, jsxs } from "react/jsx-runtime";
import { Sparkles } from "lucide-react";
import { c as calculateMacros, G as GOALS } from "./macro-calc-CwiqaSuT.js";
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
import "./zyrafit-icon-ZHgf3VwX.js";
function ResultsStep({
  age,
  weight,
  height,
  gender,
  workoutDays,
  goal
}) {
  const macros = calculateMacros({
    age: parseInt(age),
    weight: parseFloat(weight),
    height: parseFloat(height),
    gender,
    workoutDays,
    goal
  });
  const goalLabel = GOALS.find((g) => g.value === goal)?.label ?? "Your Goal";
  return /* @__PURE__ */ jsx(
    StepContainer,
    {
      icon: /* @__PURE__ */ jsx(Sparkles, { className: "w-6 h-6" }),
      title: "Your Personalized Plan",
      subtitle: `Based on your profile — ${goalLabel}`,
      children: /* @__PURE__ */ jsxs("div", { className: "space-y-4", children: [
        /* @__PURE__ */ jsxs("div", { className: "rounded-2xl bg-primary/10 border border-primary/20 p-5 text-center", children: [
          /* @__PURE__ */ jsx("p", { className: "text-sm text-muted-foreground mb-1", children: "Daily Calories" }),
          /* @__PURE__ */ jsx("p", { className: "text-5xl font-bold text-primary", children: macros.calories }),
          /* @__PURE__ */ jsx("p", { className: "text-xs text-muted-foreground mt-1", children: "kcal / day" })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-3 gap-3", children: [
          /* @__PURE__ */ jsxs("div", { className: "rounded-2xl bg-card border border-border/50 p-4 text-center", children: [
            /* @__PURE__ */ jsxs("p", { className: "text-2xl font-bold text-foreground", children: [
              macros.protein,
              "g"
            ] }),
            /* @__PURE__ */ jsx("p", { className: "text-xs text-muted-foreground mt-1", children: "Protein" }),
            /* @__PURE__ */ jsx("div", { className: "w-full h-1.5 rounded-full bg-muted mt-2 overflow-hidden", children: /* @__PURE__ */ jsx("div", { className: "h-full rounded-full bg-blue-500", style: { width: "100%" } }) })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "rounded-2xl bg-card border border-border/50 p-4 text-center", children: [
            /* @__PURE__ */ jsxs("p", { className: "text-2xl font-bold text-foreground", children: [
              macros.carbs,
              "g"
            ] }),
            /* @__PURE__ */ jsx("p", { className: "text-xs text-muted-foreground mt-1", children: "Carbs" }),
            /* @__PURE__ */ jsx("div", { className: "w-full h-1.5 rounded-full bg-muted mt-2 overflow-hidden", children: /* @__PURE__ */ jsx("div", { className: "h-full rounded-full bg-amber-500", style: { width: "100%" } }) })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "rounded-2xl bg-card border border-border/50 p-4 text-center", children: [
            /* @__PURE__ */ jsxs("p", { className: "text-2xl font-bold text-foreground", children: [
              macros.fat,
              "g"
            ] }),
            /* @__PURE__ */ jsx("p", { className: "text-xs text-muted-foreground mt-1", children: "Fat" }),
            /* @__PURE__ */ jsx("div", { className: "w-full h-1.5 rounded-full bg-muted mt-2 overflow-hidden", children: /* @__PURE__ */ jsx("div", { className: "h-full rounded-full bg-rose-500", style: { width: "100%" } }) })
          ] })
        ] }),
        /* @__PURE__ */ jsxs("p", { className: "text-xs text-muted-foreground text-center leading-relaxed", children: [
          goal === "lose_weight" && "High protein preserves muscle while in a calorie deficit.",
          goal === "muscle_gain" && "Extra protein & calories support muscle growth and recovery.",
          goal === "gain_weight" && "A balanced surplus helps you gain weight steadily.",
          goal === "maintain" && "A balanced split keeps you energized and healthy.",
          " ",
          "You can adjust these anytime in Settings."
        ] })
      ] })
    }
  );
}
export {
  ResultsStep
};
