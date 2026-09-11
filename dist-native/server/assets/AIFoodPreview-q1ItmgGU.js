import { jsxs, jsx } from "react/jsx-runtime";
import { useState } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, Sparkles, Check, Plus } from "lucide-react";
import { M as MEAL_LABELS } from "./router-L3bJVu16.js";
import "@tanstack/react-router";
import "sonner";
import "@supabase/supabase-js";
import "@capacitor/core";
import "@capacitor/haptics";
import "mcp-tanstack-start";
import "zod";
const mealTypes = ["breakfast", "lunch", "dinner", "snack"];
const confidenceColors = {
  high: "text-green-600 bg-green-500/10",
  medium: "text-yellow-600 bg-yellow-500/10",
  low: "text-red-500 bg-red-500/10"
};
function AIFoodPreview({ items, imageUrl, onAdd, onBack }) {
  const [selected, setSelected] = useState(() => new Set(items.map((_, i) => i)));
  const [mealType, setMealType] = useState("lunch");
  const [adding, setAdding] = useState(false);
  const toggleItem = (idx) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(idx)) next.delete(idx);
      else next.add(idx);
      return next;
    });
  };
  const selectedItems = items.filter((_, i) => selected.has(i));
  const totals = selectedItems.reduce(
    (acc, item) => ({
      calories: acc.calories + item.calories,
      protein: acc.protein + item.protein,
      carbs: acc.carbs + item.carbs,
      fat: acc.fat + item.fat
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0 }
  );
  const handleAdd = async () => {
    if (selectedItems.length === 0) return;
    setAdding(true);
    await onAdd(
      selectedItems.map((item) => ({
        name: item.name,
        calories: Math.round(item.calories),
        protein: Math.round(item.protein * 10) / 10,
        carbs: Math.round(item.carbs * 10) / 10,
        fat: Math.round(item.fat * 10) / 10,
        quantity: 1,
        mealType,
        source: "ai"
      }))
    );
    setAdding(false);
  };
  return /* @__PURE__ */ jsxs(
    motion.div,
    {
      className: "fixed inset-0 z-50 bg-background flex flex-col",
      initial: { x: "100%" },
      animate: { x: 0 },
      exit: { x: "100%" },
      transition: { type: "spring", damping: 30, stiffness: 300 },
      children: [
        /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3 px-5 pt-14 pb-4", children: [
          /* @__PURE__ */ jsx(motion.button, { whileTap: { scale: 0.9 }, onClick: onBack, className: "w-10 h-10 rounded-full bg-muted flex items-center justify-center", children: /* @__PURE__ */ jsx(ArrowLeft, { className: "w-5 h-5 text-foreground" }) }),
          /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
            /* @__PURE__ */ jsx(Sparkles, { className: "w-5 h-5 text-primary" }),
            /* @__PURE__ */ jsx("h2", { className: "text-lg font-bold text-foreground", children: "AI Analysis" })
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "flex-1 overflow-y-auto px-6 pb-6", children: [
          /* @__PURE__ */ jsx(motion.div, { initial: { opacity: 0, y: 20 }, animate: { opacity: 1, y: 0 }, className: "rounded-3xl overflow-hidden mb-5 border border-border/40 shadow-sm", children: /* @__PURE__ */ jsx("img", { src: imageUrl, alt: "Food photo", className: "w-full h-48 object-cover" }) }),
          /* @__PURE__ */ jsxs(motion.div, { initial: { opacity: 0, y: 20 }, animate: { opacity: 1, y: 0 }, transition: { delay: 0.1 }, children: [
            /* @__PURE__ */ jsxs("label", { className: "text-[13px] font-medium text-muted-foreground uppercase tracking-wide block mb-3", children: [
              "Detected Items (",
              items.length,
              ")"
            ] }),
            /* @__PURE__ */ jsx("div", { className: "space-y-2 mb-5", children: items.map((item, i) => /* @__PURE__ */ jsxs(
              motion.button,
              {
                initial: { opacity: 0, y: 10 },
                animate: { opacity: 1, y: 0 },
                transition: { delay: 0.1 + i * 0.05 },
                whileTap: { scale: 0.98 },
                onClick: () => toggleItem(i),
                className: `w-full flex items-center gap-3 p-4 rounded-2xl border transition-all text-left ${selected.has(i) ? "bg-primary/5 border-primary/30" : "bg-muted/30 border-border/20 opacity-50"}`,
                children: [
                  /* @__PURE__ */ jsx("div", { className: `w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${selected.has(i) ? "bg-primary text-primary-foreground" : "bg-muted border border-border"}`, children: selected.has(i) && /* @__PURE__ */ jsx(Check, { className: "w-3.5 h-3.5" }) }),
                  /* @__PURE__ */ jsxs("div", { className: "flex-1 min-w-0", children: [
                    /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
                      /* @__PURE__ */ jsx("p", { className: "text-[14px] font-medium text-card-foreground truncate", children: item.name }),
                      /* @__PURE__ */ jsx("span", { className: `text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${confidenceColors[item.confidence]}`, children: item.confidence })
                    ] }),
                    /* @__PURE__ */ jsxs("p", { className: "text-[11px] text-muted-foreground mt-0.5", children: [
                      Math.round(item.calories),
                      " cal · P ",
                      Math.round(item.protein),
                      "g · C ",
                      Math.round(item.carbs),
                      "g · F ",
                      Math.round(item.fat),
                      "g"
                    ] })
                  ] })
                ]
              },
              i
            )) })
          ] }),
          selectedItems.length > 0 && /* @__PURE__ */ jsxs(motion.div, { initial: { opacity: 0, y: 20 }, animate: { opacity: 1, y: 0 }, transition: { delay: 0.2 }, className: "rounded-2xl bg-card border border-border/40 shadow-sm p-5 mb-5", children: [
            /* @__PURE__ */ jsx("label", { className: "text-[13px] font-medium text-muted-foreground uppercase tracking-wide block mb-4", children: "Total" }),
            /* @__PURE__ */ jsxs("div", { className: "text-center mb-4", children: [
              /* @__PURE__ */ jsx(motion.span, { initial: { scale: 0.8 }, animate: { scale: 1 }, className: "text-4xl font-extrabold text-calories", children: Math.round(totals.calories) }, totals.calories),
              /* @__PURE__ */ jsx("p", { className: "text-sm text-muted-foreground", children: "calories" })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-3 gap-4", children: [
              /* @__PURE__ */ jsxs("div", { className: "text-center p-3 rounded-xl bg-protein/8", children: [
                /* @__PURE__ */ jsxs("span", { className: "text-lg font-bold text-protein", children: [
                  Math.round(totals.protein),
                  "g"
                ] }),
                /* @__PURE__ */ jsx("p", { className: "text-[11px] text-muted-foreground mt-0.5", children: "Protein" })
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "text-center p-3 rounded-xl bg-carbs/8", children: [
                /* @__PURE__ */ jsxs("span", { className: "text-lg font-bold text-carbs", children: [
                  Math.round(totals.carbs),
                  "g"
                ] }),
                /* @__PURE__ */ jsx("p", { className: "text-[11px] text-muted-foreground mt-0.5", children: "Carbs" })
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "text-center p-3 rounded-xl bg-fat/8", children: [
                /* @__PURE__ */ jsxs("span", { className: "text-lg font-bold text-fat", children: [
                  Math.round(totals.fat),
                  "g"
                ] }),
                /* @__PURE__ */ jsx("p", { className: "text-[11px] text-muted-foreground mt-0.5", children: "Fat" })
              ] })
            ] })
          ] }),
          /* @__PURE__ */ jsxs(motion.div, { initial: { opacity: 0, y: 20 }, animate: { opacity: 1, y: 0 }, transition: { delay: 0.25 }, className: "mb-5", children: [
            /* @__PURE__ */ jsx("label", { className: "text-[13px] font-medium text-muted-foreground uppercase tracking-wide block mb-2", children: "Meal" }),
            /* @__PURE__ */ jsx("div", { className: "grid grid-cols-4 gap-2", children: mealTypes.map((type) => /* @__PURE__ */ jsx(
              motion.button,
              {
                whileTap: { scale: 0.95 },
                onClick: () => setMealType(type),
                className: `px-3 py-2.5 rounded-2xl text-[13px] font-semibold transition-all ${mealType === type ? "bg-primary text-primary-foreground shadow-md shadow-primary/20" : "bg-muted/60 text-muted-foreground border border-border/30"}`,
                children: MEAL_LABELS[type]
              },
              type
            )) })
          ] })
        ] }),
        /* @__PURE__ */ jsx("div", { className: "px-6 pb-[max(1.5rem,env(safe-area-inset-bottom))]", children: /* @__PURE__ */ jsxs(
          motion.button,
          {
            whileTap: { scale: 0.97 },
            disabled: adding || selectedItems.length === 0,
            onClick: handleAdd,
            className: "w-full py-4 rounded-2xl bg-primary text-primary-foreground font-semibold text-[15px] flex items-center justify-center gap-2 shadow-lg shadow-primary/25 disabled:opacity-60",
            children: [
              /* @__PURE__ */ jsx(Plus, { className: "w-5 h-5" }),
              adding ? "Adding..." : `Add ${selectedItems.length} item${selectedItems.length !== 1 ? "s" : ""} (${Math.round(totals.calories)} cal)`
            ]
          }
        ) })
      ]
    }
  );
}
export {
  AIFoodPreview
};
