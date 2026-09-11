import { jsx, jsxs, Fragment } from "react/jsx-runtime";
import { useState, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X, Minus, Plus, Check } from "lucide-react";
import { M as MEAL_LABELS, e as MEAL_ICONS, h as hapticLight, c as hapticMedium } from "./router-L3bJVu16.js";
import "@tanstack/react-router";
import "sonner";
import "@supabase/supabase-js";
import "@capacitor/core";
import "@capacitor/haptics";
import "mcp-tanstack-start";
import "zod";
const MEAL_TYPES = ["breakfast", "lunch", "dinner", "snack"];
function EditEntrySheet({ entry, onClose, onSave }) {
  const [quantity, setQuantity] = useState(1);
  const [calories, setCalories] = useState(0);
  const [protein, setProtein] = useState(0);
  const [carbs, setCarbs] = useState(0);
  const [fat, setFat] = useState(0);
  const [mealType, setMealType] = useState("breakfast");
  const [saving, setSaving] = useState(false);
  useEffect(() => {
    if (entry) {
      setQuantity(entry.quantity);
      setCalories(entry.calories);
      setProtein(entry.protein);
      setCarbs(entry.carbs);
      setFat(entry.fat);
      setMealType(entry.mealType);
    }
  }, [entry]);
  const stepQty = (delta) => {
    hapticLight();
    setQuantity((q) => Math.max(0.25, +(q + delta).toFixed(2)));
  };
  const handleSave = async () => {
    if (!entry) return;
    setSaving(true);
    hapticMedium();
    await onSave(entry.id, {
      quantity,
      calories,
      protein,
      carbs,
      fat,
      mealType
    });
    setSaving(false);
    onClose();
  };
  return /* @__PURE__ */ jsx(AnimatePresence, { children: entry && /* @__PURE__ */ jsxs(Fragment, { children: [
    /* @__PURE__ */ jsx(
      motion.div,
      {
        className: "fixed inset-0 z-[55] bg-foreground/40 backdrop-blur-sm",
        initial: { opacity: 0 },
        animate: { opacity: 1 },
        exit: { opacity: 0 },
        onClick: onClose
      }
    ),
    /* @__PURE__ */ jsxs(
      motion.div,
      {
        className: "fixed inset-x-0 bottom-0 z-[56] bg-card rounded-t-3xl shadow-2xl border-t border-border/40 max-h-[90vh] overflow-y-auto",
        initial: { y: "100%" },
        animate: { y: 0 },
        exit: { y: "100%" },
        transition: { type: "spring", damping: 32, stiffness: 320 },
        children: [
          /* @__PURE__ */ jsx("div", { className: "flex justify-center pt-2.5 pb-1", children: /* @__PURE__ */ jsx("div", { className: "w-9 h-1 rounded-full bg-muted-foreground/25" }) }),
          /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between px-5 pt-2 pb-3", children: [
            /* @__PURE__ */ jsxs("div", { className: "flex-1 min-w-0", children: [
              /* @__PURE__ */ jsx("p", { className: "text-[11px] font-medium text-muted-foreground uppercase tracking-wide", children: "Edit meal" }),
              /* @__PURE__ */ jsx("h2", { className: "text-[17px] font-semibold text-card-foreground truncate", children: entry.name })
            ] }),
            /* @__PURE__ */ jsx(
              "button",
              {
                onClick: onClose,
                className: "w-9 h-9 rounded-full bg-muted/60 flex items-center justify-center flex-shrink-0 ml-3",
                children: /* @__PURE__ */ jsx(X, { className: "w-4 h-4 text-muted-foreground" })
              }
            )
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "mx-5 mb-4 rounded-2xl bg-primary/5 border border-primary/15 p-3.5 flex items-baseline justify-between", children: [
            /* @__PURE__ */ jsx("span", { className: "text-[12px] font-medium text-muted-foreground", children: "Total" }),
            /* @__PURE__ */ jsxs("span", { className: "text-[22px] font-bold text-primary tabular-nums", children: [
              Math.round(calories * quantity),
              /* @__PURE__ */ jsx("span", { className: "text-[12px] font-medium text-muted-foreground ml-1", children: "cal" })
            ] })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "px-5 mb-4", children: [
            /* @__PURE__ */ jsx("p", { className: "text-[12px] font-medium text-muted-foreground mb-2", children: "Meal" }),
            /* @__PURE__ */ jsx("div", { className: "grid grid-cols-4 gap-1.5", children: MEAL_TYPES.map((m) => /* @__PURE__ */ jsxs(
              "button",
              {
                onClick: () => {
                  hapticLight();
                  setMealType(m);
                },
                className: `py-2 rounded-xl text-[11px] font-semibold border transition-colors ${mealType === m ? "bg-primary text-primary-foreground border-primary" : "bg-muted/40 text-muted-foreground border-transparent"}`,
                children: [
                  /* @__PURE__ */ jsx("span", { className: "block text-base leading-none mb-1", children: MEAL_ICONS[m] }),
                  MEAL_LABELS[m]
                ]
              },
              m
            )) })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "px-5 mb-4", children: [
            /* @__PURE__ */ jsx("p", { className: "text-[12px] font-medium text-muted-foreground mb-2", children: "Servings" }),
            /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between bg-muted/40 rounded-2xl p-1.5", children: [
              /* @__PURE__ */ jsx(
                motion.button,
                {
                  whileTap: { scale: 0.9 },
                  onClick: () => stepQty(-0.5),
                  className: "w-11 h-11 rounded-xl bg-card shadow-sm flex items-center justify-center",
                  children: /* @__PURE__ */ jsx(Minus, { className: "w-4 h-4 text-card-foreground" })
                }
              ),
              /* @__PURE__ */ jsxs("span", { className: "text-[20px] font-bold text-card-foreground tabular-nums", children: [
                "×",
                quantity % 1 === 0 ? quantity : quantity.toFixed(2)
              ] }),
              /* @__PURE__ */ jsx(
                motion.button,
                {
                  whileTap: { scale: 0.9 },
                  onClick: () => stepQty(0.5),
                  className: "w-11 h-11 rounded-xl bg-card shadow-sm flex items-center justify-center",
                  children: /* @__PURE__ */ jsx(Plus, { className: "w-4 h-4 text-card-foreground" })
                }
              )
            ] })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "px-5 mb-3", children: [
            /* @__PURE__ */ jsx("p", { className: "text-[12px] font-medium text-muted-foreground mb-2", children: "Per serving" }),
            /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
              /* @__PURE__ */ jsx(MacroInput, { label: "Calories", value: calories, onChange: setCalories, unit: "cal" }),
              /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-3 gap-2", children: [
                /* @__PURE__ */ jsx(MacroInput, { label: "Protein", value: protein, onChange: setProtein, unit: "g", compact: true }),
                /* @__PURE__ */ jsx(MacroInput, { label: "Carbs", value: carbs, onChange: setCarbs, unit: "g", compact: true }),
                /* @__PURE__ */ jsx(MacroInput, { label: "Fat", value: fat, onChange: setFat, unit: "g", compact: true })
              ] })
            ] })
          ] }),
          /* @__PURE__ */ jsx("div", { className: "px-5 pt-2 pb-[calc(env(safe-area-inset-bottom)+20px)]", children: /* @__PURE__ */ jsxs(
            motion.button,
            {
              whileTap: { scale: 0.98 },
              onClick: handleSave,
              disabled: saving,
              className: "w-full h-13 py-3.5 rounded-2xl bg-primary text-primary-foreground font-semibold text-[15px] flex items-center justify-center gap-2 shadow-lg shadow-primary/20 disabled:opacity-60",
              children: [
                /* @__PURE__ */ jsx(Check, { className: "w-4 h-4" }),
                saving ? "Saving…" : "Save changes"
              ]
            }
          ) })
        ]
      }
    )
  ] }) });
}
function MacroInput({ label, value, onChange, unit, compact }) {
  return /* @__PURE__ */ jsxs(
    "label",
    {
      className: `flex ${compact ? "flex-col gap-0.5 p-2.5" : "items-center justify-between px-3.5 py-2.5"} bg-muted/40 rounded-xl border border-transparent focus-within:border-primary/40 focus-within:bg-card transition-colors`,
      children: [
        /* @__PURE__ */ jsx("span", { className: `text-[11px] font-medium text-muted-foreground ${compact ? "" : ""}`, children: label }),
        /* @__PURE__ */ jsxs("div", { className: `flex items-baseline gap-1 ${compact ? "" : ""}`, children: [
          /* @__PURE__ */ jsx(
            "input",
            {
              type: "number",
              inputMode: "decimal",
              min: 0,
              value: value === 0 ? "" : value,
              onChange: (e) => {
                const v = e.target.value;
                onChange(v === "" ? 0 : Math.max(0, parseFloat(v) || 0));
              },
              className: `bg-transparent outline-none font-semibold text-card-foreground tabular-nums ${compact ? "text-[16px] w-full" : "text-[16px] w-20 text-right"}`,
              placeholder: "0"
            }
          ),
          /* @__PURE__ */ jsx("span", { className: "text-[11px] text-muted-foreground", children: unit })
        ] })
      ]
    }
  );
}
export {
  EditEntrySheet
};
