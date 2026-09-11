import { jsxs, jsx } from "react/jsx-runtime";
import { motion } from "framer-motion";
import { format, parseISO } from "date-fns";
function BodyCompositionCard({ latest, gender }) {
  const bmi = latest.bmi;
  const fat = latest.body_fat_percent;
  const fatMass = latest.body_fat_mass_kg;
  const leanMass = fatMass != null ? latest.weight_kg - fatMass : null;
  const bmiCategory = bmi != null ? bmi < 18.5 ? "Underweight" : bmi < 25 ? "Normal" : bmi < 30 ? "Overweight" : "Obese" : null;
  const bmiEmoji = bmi != null ? bmi < 18.5 ? "🔵" : bmi < 25 ? "🟢" : bmi < 30 ? "🟡" : "🔴" : "";
  const bmiPercent = bmi != null ? Math.min(100, Math.max(0, (bmi - 10) / 35 * 100)) : 0;
  const fatCategory = fat != null ? gender === "female" ? fat < 14 ? "Essential" : fat < 21 ? "Athletic" : fat < 25 ? "Fit" : fat < 32 ? "Average" : "Above Avg" : fat < 6 ? "Essential" : fat < 14 ? "Athletic" : fat < 18 ? "Fit" : fat < 25 ? "Average" : "Above Avg" : null;
  const fatEmoji = fat != null ? gender === "female" ? fat < 21 ? "🟢" : fat < 25 ? "🟡" : "🟠" : fat < 14 ? "🟢" : fat < 18 ? "🟡" : "🟠" : "";
  return /* @__PURE__ */ jsxs(
    motion.div,
    {
      initial: { opacity: 0, y: 10 },
      animate: { opacity: 1, y: 0 },
      transition: { delay: 0.13 },
      className: "rounded-2xl bg-card p-5 shadow-sm border border-border/50",
      children: [
        /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3 mb-4", children: [
          /* @__PURE__ */ jsx("div", { className: "w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-lg", children: "🏋️" }),
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("h3", { className: "font-semibold text-card-foreground", children: "Body Composition" }),
            /* @__PURE__ */ jsxs("p", { className: "text-xs text-muted-foreground", children: [
              "Latest assessment · ",
              format(parseISO(latest.logged_at), "MMM d, yyyy")
            ] })
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "space-y-4", children: [
          bmi != null && /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between mb-1.5", children: [
              /* @__PURE__ */ jsx("span", { className: "text-xs font-medium text-foreground", children: "BMI" }),
              /* @__PURE__ */ jsxs("span", { className: "text-xs font-semibold text-foreground", children: [
                bmiEmoji,
                " ",
                bmi,
                " — ",
                bmiCategory
              ] })
            ] }),
            /* @__PURE__ */ jsx("div", { className: "relative h-3 rounded-full overflow-hidden bg-gradient-to-r from-blue-400 via-green-400 via-50% via-yellow-400 to-red-500", children: /* @__PURE__ */ jsx(
              motion.div,
              {
                className: "absolute top-0 w-3 h-3 rounded-full bg-white border-2 border-foreground shadow-md",
                style: { left: `calc(${bmiPercent}% - 6px)` },
                initial: { scale: 0 },
                animate: { scale: 1 },
                transition: { delay: 0.3, type: "spring" }
              }
            ) }),
            /* @__PURE__ */ jsxs("div", { className: "flex justify-between mt-1", children: [
              /* @__PURE__ */ jsx("span", { className: "text-[9px] text-muted-foreground", children: "Under 18.5" }),
              /* @__PURE__ */ jsx("span", { className: "text-[9px] text-muted-foreground", children: "Normal" }),
              /* @__PURE__ */ jsx("span", { className: "text-[9px] text-muted-foreground", children: "Over 25" }),
              /* @__PURE__ */ jsx("span", { className: "text-[9px] text-muted-foreground", children: "Obese 30+" })
            ] })
          ] }),
          fat != null && /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between mb-1.5", children: [
              /* @__PURE__ */ jsx("span", { className: "text-xs font-medium text-foreground", children: "Body Fat" }),
              /* @__PURE__ */ jsxs("span", { className: "text-xs font-semibold text-foreground", children: [
                fatEmoji,
                " ",
                fat,
                "% — ",
                fatCategory
              ] })
            ] }),
            /* @__PURE__ */ jsx("div", { className: "h-3 rounded-full overflow-hidden bg-muted", children: /* @__PURE__ */ jsx(
              motion.div,
              {
                className: "h-full rounded-full",
                style: {
                  width: `${Math.min(fat, 50)}%`,
                  background: `linear-gradient(90deg, hsl(142, 70%, 45%), hsl(${Math.max(0, 142 - fat * 4)}, 70%, 50%))`
                },
                initial: { width: 0 },
                animate: { width: `${Math.min(fat * 2, 100)}%` },
                transition: { duration: 0.8, ease: "easeOut" }
              }
            ) }),
            gender === "male" && /* @__PURE__ */ jsxs("div", { className: "flex justify-between mt-1", children: [
              /* @__PURE__ */ jsx("span", { className: "text-[9px] text-muted-foreground", children: "Athletic <14%" }),
              /* @__PURE__ */ jsx("span", { className: "text-[9px] text-muted-foreground", children: "Fit 14-18%" }),
              /* @__PURE__ */ jsx("span", { className: "text-[9px] text-muted-foreground", children: "Avg 18-25%" })
            ] }),
            gender === "female" && /* @__PURE__ */ jsxs("div", { className: "flex justify-between mt-1", children: [
              /* @__PURE__ */ jsx("span", { className: "text-[9px] text-muted-foreground", children: "Athletic <21%" }),
              /* @__PURE__ */ jsx("span", { className: "text-[9px] text-muted-foreground", children: "Fit 21-25%" }),
              /* @__PURE__ */ jsx("span", { className: "text-[9px] text-muted-foreground", children: "Avg 25-32%" })
            ] })
          ] }),
          leanMass != null && fatMass != null && /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-2 gap-2", children: [
            /* @__PURE__ */ jsxs("div", { className: "rounded-xl bg-primary/10 border border-primary/20 p-3 text-center", children: [
              /* @__PURE__ */ jsx("p", { className: "text-lg font-bold text-primary", children: leanMass.toFixed(1) }),
              /* @__PURE__ */ jsx("p", { className: "text-[10px] text-muted-foreground", children: "Lean Mass (kg)" }),
              /* @__PURE__ */ jsxs("p", { className: "text-[10px] font-medium text-primary mt-0.5", children: [
                (leanMass / latest.weight_kg * 100).toFixed(0),
                "%"
              ] })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "rounded-xl bg-rose-500/10 border border-rose-500/20 p-3 text-center", children: [
              /* @__PURE__ */ jsx("p", { className: "text-lg font-bold text-rose-600", children: fatMass.toFixed(1) }),
              /* @__PURE__ */ jsx("p", { className: "text-[10px] text-muted-foreground", children: "Fat Mass (kg)" }),
              /* @__PURE__ */ jsxs("p", { className: "text-[10px] font-medium text-rose-600 mt-0.5", children: [
                (fatMass / latest.weight_kg * 100).toFixed(0),
                "%"
              ] })
            ] })
          ] })
        ] })
      ]
    }
  );
}
export {
  BodyCompositionCard,
  BodyCompositionCard as default
};
