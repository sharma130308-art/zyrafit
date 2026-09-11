import { jsxs, jsx } from "react/jsx-runtime";
import { useState } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, ScanBarcode, Minus, Plus } from "lucide-react";
import { calculateNutrition } from "./barcode-api-BgOojJAX.js";
import { M as MEAL_LABELS } from "./router-L3bJVu16.js";
import "@tanstack/react-router";
import "sonner";
import "@supabase/supabase-js";
import "@capacitor/core";
import "@capacitor/haptics";
import "mcp-tanstack-start";
import "zod";
const mealTypes = ["breakfast", "lunch", "dinner", "snack"];
function FoodPreview({ food, onAdd, onBack }) {
  const [grams, setGrams] = useState(food.servingGrams || 100);
  const [mealType, setMealType] = useState("lunch");
  const [adding, setAdding] = useState(false);
  const nutrition = calculateNutrition(food, grams);
  const adjustGrams = (delta) => {
    setGrams((prev) => Math.max(10, prev + delta));
  };
  const handleAdd = async () => {
    setAdding(true);
    await onAdd({
      name: food.brand ? `${food.name} (${food.brand})` : food.name,
      calories: nutrition.calories,
      protein: nutrition.protein,
      carbs: nutrition.carbs,
      fat: nutrition.fat,
      quantity: 1,
      mealType,
      barcode: food.barcode
    });
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
          /* @__PURE__ */ jsx(
            motion.button,
            {
              whileTap: { scale: 0.9 },
              onClick: onBack,
              className: "w-10 h-10 rounded-full bg-muted flex items-center justify-center",
              children: /* @__PURE__ */ jsx(ArrowLeft, { className: "w-5 h-5 text-foreground" })
            }
          ),
          /* @__PURE__ */ jsx("h2", { className: "text-lg font-bold text-foreground", children: "Food Found" })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "flex-1 overflow-y-auto px-6 pb-6", children: [
          /* @__PURE__ */ jsxs(
            motion.div,
            {
              initial: { opacity: 0, y: 20 },
              animate: { opacity: 1, y: 0 },
              transition: { delay: 0.1 },
              className: "rounded-3xl bg-card border border-border/40 shadow-sm overflow-hidden mb-5",
              children: [
                food.imageUrl ? /* @__PURE__ */ jsx("div", { className: "h-48 bg-muted flex items-center justify-center overflow-hidden", children: /* @__PURE__ */ jsx(
                  "img",
                  {
                    src: food.imageUrl,
                    alt: food.name,
                    className: "w-full h-full object-contain p-4",
                    onError: (e) => {
                      e.target.style.display = "none";
                    }
                  }
                ) }) : /* @__PURE__ */ jsx("div", { className: "h-32 bg-muted/50 flex items-center justify-center", children: /* @__PURE__ */ jsx(ScanBarcode, { className: "w-12 h-12 text-muted-foreground/30" }) }),
                /* @__PURE__ */ jsxs("div", { className: "p-5", children: [
                  /* @__PURE__ */ jsx("h3", { className: "text-xl font-bold text-card-foreground", children: food.name }),
                  food.brand && /* @__PURE__ */ jsx("p", { className: "text-sm text-muted-foreground mt-0.5", children: food.brand }),
                  /* @__PURE__ */ jsxs("p", { className: "text-xs text-muted-foreground/60 mt-1", children: [
                    "Barcode: ",
                    food.barcode
                  ] })
                ] })
              ]
            }
          ),
          /* @__PURE__ */ jsxs(
            motion.div,
            {
              initial: { opacity: 0, y: 20 },
              animate: { opacity: 1, y: 0 },
              transition: { delay: 0.15 },
              className: "rounded-2xl bg-card border border-border/40 shadow-sm p-5 mb-5",
              children: [
                /* @__PURE__ */ jsx("label", { className: "text-[13px] font-medium text-muted-foreground uppercase tracking-wide block mb-3", children: "Serving Size" }),
                /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between", children: [
                  /* @__PURE__ */ jsx(
                    motion.button,
                    {
                      whileTap: { scale: 0.9 },
                      onClick: () => adjustGrams(-10),
                      className: "w-12 h-12 rounded-xl bg-muted flex items-center justify-center",
                      children: /* @__PURE__ */ jsx(Minus, { className: "w-5 h-5 text-foreground" })
                    }
                  ),
                  /* @__PURE__ */ jsxs("div", { className: "text-center", children: [
                    /* @__PURE__ */ jsx(
                      "input",
                      {
                        type: "number",
                        value: grams,
                        onChange: (e) => setGrams(Math.max(1, parseInt(e.target.value) || 0)),
                        className: "text-3xl font-bold text-foreground bg-transparent text-center w-24 outline-none"
                      }
                    ),
                    /* @__PURE__ */ jsx("p", { className: "text-xs text-muted-foreground", children: "grams" })
                  ] }),
                  /* @__PURE__ */ jsx(
                    motion.button,
                    {
                      whileTap: { scale: 0.9 },
                      onClick: () => adjustGrams(10),
                      className: "w-12 h-12 rounded-xl bg-muted flex items-center justify-center",
                      children: /* @__PURE__ */ jsx(Plus, { className: "w-5 h-5 text-foreground" })
                    }
                  )
                ] }),
                food.servingSize && food.servingSize !== "100g" && /* @__PURE__ */ jsxs(
                  "button",
                  {
                    onClick: () => setGrams(food.servingGrams),
                    className: "mt-3 w-full py-2 text-sm text-primary font-medium bg-primary/5 rounded-xl",
                    children: [
                      "Use serving size (",
                      food.servingSize,
                      ")"
                    ]
                  }
                )
              ]
            }
          ),
          /* @__PURE__ */ jsxs(
            motion.div,
            {
              initial: { opacity: 0, y: 20 },
              animate: { opacity: 1, y: 0 },
              transition: { delay: 0.2 },
              className: "rounded-2xl bg-card border border-border/40 shadow-sm p-5 mb-5",
              children: [
                /* @__PURE__ */ jsxs("label", { className: "text-[13px] font-medium text-muted-foreground uppercase tracking-wide block mb-4", children: [
                  "Nutrition for ",
                  grams,
                  "g"
                ] }),
                /* @__PURE__ */ jsxs("div", { className: "text-center mb-4", children: [
                  /* @__PURE__ */ jsx(
                    motion.span,
                    {
                      initial: { scale: 0.8 },
                      animate: { scale: 1 },
                      className: "text-4xl font-extrabold text-calories",
                      children: nutrition.calories
                    },
                    nutrition.calories
                  ),
                  /* @__PURE__ */ jsx("p", { className: "text-sm text-muted-foreground", children: "calories" })
                ] }),
                /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-3 gap-4", children: [
                  /* @__PURE__ */ jsxs("div", { className: "text-center p-3 rounded-xl bg-protein/8", children: [
                    /* @__PURE__ */ jsxs("span", { className: "text-lg font-bold text-protein", children: [
                      nutrition.protein,
                      "g"
                    ] }),
                    /* @__PURE__ */ jsx("p", { className: "text-[11px] text-muted-foreground mt-0.5", children: "Protein" })
                  ] }),
                  /* @__PURE__ */ jsxs("div", { className: "text-center p-3 rounded-xl bg-carbs/8", children: [
                    /* @__PURE__ */ jsxs("span", { className: "text-lg font-bold text-carbs", children: [
                      nutrition.carbs,
                      "g"
                    ] }),
                    /* @__PURE__ */ jsx("p", { className: "text-[11px] text-muted-foreground mt-0.5", children: "Carbs" })
                  ] }),
                  /* @__PURE__ */ jsxs("div", { className: "text-center p-3 rounded-xl bg-fat/8", children: [
                    /* @__PURE__ */ jsxs("span", { className: "text-lg font-bold text-fat", children: [
                      nutrition.fat,
                      "g"
                    ] }),
                    /* @__PURE__ */ jsx("p", { className: "text-[11px] text-muted-foreground mt-0.5", children: "Fat" })
                  ] })
                ] })
              ]
            }
          ),
          /* @__PURE__ */ jsxs(
            motion.div,
            {
              initial: { opacity: 0, y: 20 },
              animate: { opacity: 1, y: 0 },
              transition: { delay: 0.25 },
              className: "mb-5",
              children: [
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
              ]
            }
          )
        ] }),
        /* @__PURE__ */ jsx("div", { className: "px-6 pb-[max(1.5rem,env(safe-area-inset-bottom))]", children: /* @__PURE__ */ jsxs(
          motion.button,
          {
            whileTap: { scale: 0.97 },
            disabled: adding,
            onClick: handleAdd,
            className: "w-full py-4 rounded-2xl bg-primary text-primary-foreground font-semibold text-[15px] flex items-center justify-center gap-2 shadow-lg shadow-primary/25 disabled:opacity-60",
            children: [
              /* @__PURE__ */ jsx(Plus, { className: "w-5 h-5" }),
              adding ? "Adding..." : `Add ${nutrition.calories} cal to diary`
            ]
          }
        ) })
      ]
    }
  );
}
export {
  FoodPreview
};
