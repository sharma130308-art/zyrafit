import { jsx, jsxs, Fragment } from "react/jsx-runtime";
import { useState, useEffect, useCallback } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { t as searchFoodHistory, M as MEAL_LABELS, a as hapticSuccess, h as hapticLight, s as supabase } from "./router-L3bJVu16.js";
import { Sparkles, ScanBarcode, X, Clock, Plus, Search, ChevronRight, Wand2, Loader2 } from "lucide-react";
import "@tanstack/react-router";
import "sonner";
import "@supabase/supabase-js";
import "@capacitor/core";
import "@capacitor/haptics";
import "mcp-tanstack-start";
import "zod";
const mealTypes = ["breakfast", "lunch", "dinner", "snack"];
function AddFoodDialog({ open, onClose, onAdd, onScanClick, onAiClick, initialMealType }) {
  const [mode, setMode] = useState("history");
  const [name, setName] = useState("");
  const [calories, setCalories] = useState("");
  const [protein, setProtein] = useState("");
  const [carbs, setCarbs] = useState("");
  const [fat, setFat] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [mealType, setMealType] = useState("breakfast");
  const [saving, setSaving] = useState(false);
  const [nlInput, setNlInput] = useState("");
  const [parsing, setParsing] = useState(false);
  const [parseError, setParseError] = useState(null);
  const [parsedConfidence, setParsedConfidence] = useState(null);
  const handleParseNL = async () => {
    const text = nlInput.trim();
    if (!text || parsing) return;
    setParsing(true);
    setParseError(null);
    hapticLight();
    try {
      const { data, error } = await supabase.functions.invoke("parse-food-text", {
        body: { text }
      });
      if (error) throw error;
      if (!data?.ok) {
        setParseError(data?.error ?? "Couldn't parse that. Try again.");
        return;
      }
      setName(data.name ?? text);
      setCalories(String(Math.round(data.calories ?? 0)));
      setProtein(String(Math.round(data.protein ?? 0)));
      setCarbs(String(Math.round(data.carbs ?? 0)));
      setFat(String(Math.round(data.fat ?? 0)));
      setQuantity("1");
      setParsedConfidence(data.confidence ?? null);
      hapticSuccess();
    } catch (e) {
      console.error("parse-food-text failed", e);
      setParseError("Network error. Please try again.");
    } finally {
      setParsing(false);
    }
  };
  useEffect(() => {
    if (open && initialMealType) {
      setMealType(initialMealType);
    }
  }, [open, initialMealType]);
  const [searchQuery, setSearchQuery] = useState("");
  const [history, setHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const loadHistory = useCallback(async (q) => {
    setLoadingHistory(true);
    const results = await searchFoodHistory(q);
    setHistory(results);
    setLoadingHistory(false);
  }, []);
  useEffect(() => {
    if (open && mode === "history") {
      const timeout = setTimeout(() => loadHistory(searchQuery), 150);
      return () => clearTimeout(timeout);
    }
  }, [open, searchQuery, mode, loadHistory]);
  const resetForm = () => {
    setName("");
    setCalories("");
    setProtein("");
    setCarbs("");
    setFat("");
    setQuantity("1");
    setMealType("breakfast");
    setSearchQuery("");
    setMode("history");
    setNlInput("");
    setParseError(null);
    setParsedConfidence(null);
  };
  const handleSelectFromHistory = (food) => {
    setName(food.name);
    setCalories(String(food.calories));
    setProtein(String(food.protein));
    setCarbs(String(food.carbs));
    setFat(String(food.fat));
    setQuantity("1");
    setMode("manual");
  };
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name || !calories || saving) return;
    hapticSuccess();
    setSaving(true);
    await onAdd({
      name,
      calories: parseFloat(calories) || 0,
      protein: parseFloat(protein) || 0,
      carbs: parseFloat(carbs) || 0,
      fat: parseFloat(fat) || 0,
      quantity: parseInt(quantity, 10) || 1,
      mealType
    });
    setSaving(false);
    resetForm();
    onClose();
  };
  const inputClass = "w-full px-4 py-3.5 rounded-2xl bg-muted/60 text-foreground placeholder:text-muted-foreground/50 border border-border/30 outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 transition-all text-[15px]";
  return /* @__PURE__ */ jsx(AnimatePresence, { children: open && /* @__PURE__ */ jsxs(Fragment, { children: [
    /* @__PURE__ */ jsx(
      motion.div,
      {
        className: "fixed inset-0 bg-foreground/15 backdrop-blur-md z-40",
        initial: { opacity: 0 },
        animate: { opacity: 1 },
        exit: { opacity: 0 },
        onClick: onClose
      }
    ),
    /* @__PURE__ */ jsxs(
      motion.div,
      {
        className: "fixed inset-x-0 bottom-0 z-50 bg-card rounded-t-[28px] shadow-[0_-8px_40px_rgba(0,0,0,0.08)] max-h-[92vh] overflow-y-auto",
        initial: { y: "100%" },
        animate: { y: 0 },
        exit: { y: "100%" },
        transition: { type: "spring", damping: 28, stiffness: 300, mass: 0.8 },
        children: [
          /* @__PURE__ */ jsx("div", { className: "flex justify-center pt-3 pb-1", children: /* @__PURE__ */ jsx("div", { className: "w-10 h-1 rounded-full bg-muted-foreground/20" }) }),
          /* @__PURE__ */ jsxs("div", { className: "px-6 pb-2", children: [
            /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between mb-4", children: [
              /* @__PURE__ */ jsx("h2", { className: "text-xl font-bold text-card-foreground", children: "Add Food" }),
              /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
                onAiClick && /* @__PURE__ */ jsx(
                  motion.button,
                  {
                    whileTap: { scale: 0.9 },
                    onClick: () => {
                      resetForm();
                      onClose();
                      onAiClick();
                    },
                    className: "p-2 rounded-full bg-primary/10 text-primary",
                    children: /* @__PURE__ */ jsx(Sparkles, { className: "w-5 h-5" })
                  }
                ),
                onScanClick && /* @__PURE__ */ jsx(
                  motion.button,
                  {
                    whileTap: { scale: 0.9 },
                    onClick: () => {
                      resetForm();
                      onClose();
                      onScanClick();
                    },
                    className: "p-2 rounded-full bg-primary/10 text-primary",
                    children: /* @__PURE__ */ jsx(ScanBarcode, { className: "w-5 h-5" })
                  }
                ),
                /* @__PURE__ */ jsx(
                  motion.button,
                  {
                    whileTap: { scale: 0.9 },
                    onClick: () => {
                      resetForm();
                      onClose();
                    },
                    className: "p-2 rounded-full bg-muted/60 text-muted-foreground",
                    children: /* @__PURE__ */ jsx(X, { className: "w-5 h-5" })
                  }
                )
              ] })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "flex gap-1 p-1 bg-muted/50 rounded-2xl mb-4", children: [
              /* @__PURE__ */ jsxs(
                "button",
                {
                  onClick: () => setMode("history"),
                  className: `flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-[13px] font-semibold transition-all ${mode === "history" ? "bg-card text-card-foreground shadow-sm" : "text-muted-foreground"}`,
                  children: [
                    /* @__PURE__ */ jsx(Clock, { className: "w-4 h-4" }),
                    "Recent"
                  ]
                }
              ),
              /* @__PURE__ */ jsxs(
                "button",
                {
                  onClick: () => setMode("manual"),
                  className: `flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-[13px] font-semibold transition-all ${mode === "manual" ? "bg-card text-card-foreground shadow-sm" : "text-muted-foreground"}`,
                  children: [
                    /* @__PURE__ */ jsx(Plus, { className: "w-4 h-4" }),
                    "Manual"
                  ]
                }
              )
            ] }),
            /* @__PURE__ */ jsx(AnimatePresence, { mode: "wait", children: mode === "history" ? /* @__PURE__ */ jsxs(
              motion.div,
              {
                initial: { opacity: 0, x: -20 },
                animate: { opacity: 1, x: 0 },
                exit: { opacity: 0, x: -20 },
                transition: { duration: 0.15 },
                children: [
                  /* @__PURE__ */ jsxs("div", { className: "relative mb-3", children: [
                    /* @__PURE__ */ jsx(Search, { className: "absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/50" }),
                    /* @__PURE__ */ jsx(
                      "input",
                      {
                        type: "text",
                        value: searchQuery,
                        onChange: (e) => setSearchQuery(e.target.value),
                        placeholder: "Search past foods...",
                        className: `${inputClass} pl-11`,
                        autoFocus: true
                      }
                    )
                  ] }),
                  /* @__PURE__ */ jsx("div", { className: "space-y-1 max-h-[45vh] overflow-y-auto -mx-2 px-2", children: loadingHistory ? /* @__PURE__ */ jsx("div", { className: "flex justify-center py-8", children: /* @__PURE__ */ jsx(
                    motion.div,
                    {
                      className: "w-6 h-6 rounded-full border-2 border-primary border-t-transparent",
                      animate: { rotate: 360 },
                      transition: { duration: 1, repeat: Infinity, ease: "linear" }
                    }
                  ) }) : history.length === 0 ? /* @__PURE__ */ jsxs("div", { className: "text-center py-8", children: [
                    /* @__PURE__ */ jsx("p", { className: "text-muted-foreground/60 text-sm", children: searchQuery ? "No matching foods found" : "No food history yet" }),
                    /* @__PURE__ */ jsx(
                      "button",
                      {
                        onClick: () => setMode("manual"),
                        className: "mt-2 text-sm text-primary font-medium",
                        children: "Add manually →"
                      }
                    )
                  ] }) : history.map((food, i) => /* @__PURE__ */ jsxs(
                    motion.button,
                    {
                      initial: { opacity: 0, y: 8 },
                      animate: { opacity: 1, y: 0 },
                      transition: { delay: i * 0.03 },
                      whileTap: { scale: 0.98 },
                      onClick: () => handleSelectFromHistory(food),
                      className: "w-full flex items-center justify-between p-3.5 rounded-2xl bg-muted/30 hover:bg-muted/60 border border-border/20 transition-colors text-left",
                      children: [
                        /* @__PURE__ */ jsxs("div", { className: "flex-1 min-w-0", children: [
                          /* @__PURE__ */ jsx("p", { className: "text-[14px] font-medium text-card-foreground truncate", children: food.name }),
                          /* @__PURE__ */ jsxs("p", { className: "text-[11px] text-muted-foreground mt-0.5", children: [
                            food.calories,
                            " cal",
                            /* @__PURE__ */ jsx("span", { className: "mx-1", children: "·" }),
                            "P ",
                            food.protein,
                            "g",
                            /* @__PURE__ */ jsx("span", { className: "mx-1", children: "·" }),
                            "C ",
                            food.carbs,
                            "g",
                            /* @__PURE__ */ jsx("span", { className: "mx-1", children: "·" }),
                            "F ",
                            food.fat,
                            "g"
                          ] })
                        ] }),
                        /* @__PURE__ */ jsx(ChevronRight, { className: "w-4 h-4 text-muted-foreground/40 ml-2 flex-shrink-0" })
                      ]
                    },
                    `${food.name}-${i}`
                  )) }),
                  history.length > 0 && /* @__PURE__ */ jsx(
                    "button",
                    {
                      onClick: () => setMode("manual"),
                      className: "w-full mt-3 py-3 text-sm text-primary font-medium",
                      children: "Or add a new food manually"
                    }
                  )
                ]
              },
              "history"
            ) : /* @__PURE__ */ jsx(
              motion.div,
              {
                initial: { opacity: 0, x: 20 },
                animate: { opacity: 1, x: 0 },
                exit: { opacity: 0, x: 20 },
                transition: { duration: 0.15 },
                children: /* @__PURE__ */ jsxs("form", { onSubmit: handleSubmit, className: "space-y-4", children: [
                  /* @__PURE__ */ jsxs("div", { className: "rounded-2xl bg-gradient-to-br from-primary/10 via-primary/5 to-transparent border border-primary/20 p-3.5", children: [
                    /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-1.5 mb-2", children: [
                      /* @__PURE__ */ jsx(Wand2, { className: "w-3.5 h-3.5 text-primary" }),
                      /* @__PURE__ */ jsx("span", { className: "text-[12px] font-semibold text-primary uppercase tracking-wide", children: "Quick Fill with AI" })
                    ] }),
                    /* @__PURE__ */ jsxs("div", { className: "flex gap-2", children: [
                      /* @__PURE__ */ jsx(
                        "input",
                        {
                          type: "text",
                          value: nlInput,
                          onChange: (e) => {
                            setNlInput(e.target.value);
                            setParseError(null);
                          },
                          onKeyDown: (e) => {
                            if (e.key === "Enter") {
                              e.preventDefault();
                              handleParseNL();
                            }
                          },
                          placeholder: "e.g. 2 eggs and toast",
                          disabled: parsing,
                          className: "flex-1 px-3.5 py-2.5 rounded-xl bg-card text-foreground placeholder:text-muted-foreground/50 border border-border/40 outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition-all text-[14px] disabled:opacity-60"
                        }
                      ),
                      /* @__PURE__ */ jsx(
                        motion.button,
                        {
                          type: "button",
                          whileTap: { scale: 0.94 },
                          onClick: handleParseNL,
                          disabled: parsing || !nlInput.trim(),
                          className: "px-4 rounded-xl bg-primary text-primary-foreground font-semibold text-[13px] flex items-center justify-center gap-1.5 disabled:opacity-50 shadow-md shadow-primary/20 min-w-[80px]",
                          children: parsing ? /* @__PURE__ */ jsx(Loader2, { className: "w-4 h-4 animate-spin" }) : /* @__PURE__ */ jsxs(Fragment, { children: [
                            /* @__PURE__ */ jsx(Sparkles, { className: "w-3.5 h-3.5" }),
                            "Fill"
                          ] })
                        }
                      )
                    ] }),
                    parseError && /* @__PURE__ */ jsx("p", { className: "text-[12px] text-destructive mt-2", children: parseError }),
                    parsedConfidence && !parseError && /* @__PURE__ */ jsxs("p", { className: "text-[12px] text-muted-foreground mt-2", children: [
                      "✨ Filled in below — review and adjust if needed",
                      parsedConfidence === "low" && " (low confidence)"
                    ] })
                  ] }),
                  /* @__PURE__ */ jsxs("div", { children: [
                    /* @__PURE__ */ jsx("label", { className: "text-[13px] font-medium text-muted-foreground mb-1.5 block uppercase tracking-wide", children: "Food Name" }),
                    /* @__PURE__ */ jsx(
                      "input",
                      {
                        type: "text",
                        value: name,
                        onChange: (e) => setName(e.target.value),
                        placeholder: "e.g. Grilled Chicken",
                        className: inputClass,
                        required: true
                      }
                    )
                  ] }),
                  /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-2 gap-3", children: [
                    /* @__PURE__ */ jsxs("div", { children: [
                      /* @__PURE__ */ jsx("label", { className: "text-[13px] font-medium text-muted-foreground mb-1.5 block uppercase tracking-wide", children: "Calories" }),
                      /* @__PURE__ */ jsx(
                        "input",
                        {
                          type: "number",
                          value: calories,
                          onChange: (e) => setCalories(e.target.value),
                          placeholder: "0",
                          min: "0",
                          className: inputClass,
                          required: true
                        }
                      )
                    ] }),
                    /* @__PURE__ */ jsxs("div", { children: [
                      /* @__PURE__ */ jsx("label", { className: "text-[13px] font-medium text-muted-foreground mb-1.5 block uppercase tracking-wide", children: "Qty" }),
                      /* @__PURE__ */ jsx(
                        "input",
                        {
                          type: "number",
                          value: quantity,
                          onChange: (e) => setQuantity(e.target.value),
                          min: "1",
                          className: inputClass
                        }
                      )
                    ] })
                  ] }),
                  /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-3 gap-3", children: [
                    /* @__PURE__ */ jsxs("div", { children: [
                      /* @__PURE__ */ jsx("label", { className: "text-[13px] font-medium text-protein mb-1.5 block uppercase tracking-wide", children: "Protein" }),
                      /* @__PURE__ */ jsx(
                        "input",
                        {
                          type: "number",
                          value: protein,
                          onChange: (e) => setProtein(e.target.value),
                          placeholder: "0g",
                          min: "0",
                          className: inputClass
                        }
                      )
                    ] }),
                    /* @__PURE__ */ jsxs("div", { children: [
                      /* @__PURE__ */ jsx("label", { className: "text-[13px] font-medium text-carbs mb-1.5 block uppercase tracking-wide", children: "Carbs" }),
                      /* @__PURE__ */ jsx(
                        "input",
                        {
                          type: "number",
                          value: carbs,
                          onChange: (e) => setCarbs(e.target.value),
                          placeholder: "0g",
                          min: "0",
                          className: inputClass
                        }
                      )
                    ] }),
                    /* @__PURE__ */ jsxs("div", { children: [
                      /* @__PURE__ */ jsx("label", { className: "text-[13px] font-medium text-fat mb-1.5 block uppercase tracking-wide", children: "Fat" }),
                      /* @__PURE__ */ jsx(
                        "input",
                        {
                          type: "number",
                          value: fat,
                          onChange: (e) => setFat(e.target.value),
                          placeholder: "0g",
                          min: "0",
                          className: inputClass
                        }
                      )
                    ] })
                  ] }),
                  /* @__PURE__ */ jsxs("div", { children: [
                    /* @__PURE__ */ jsx("label", { className: "text-[13px] font-medium text-muted-foreground mb-2 block uppercase tracking-wide", children: "Meal" }),
                    /* @__PURE__ */ jsx("div", { className: "grid grid-cols-4 gap-2", children: mealTypes.map((type) => /* @__PURE__ */ jsx(
                      motion.button,
                      {
                        type: "button",
                        whileTap: { scale: 0.95 },
                        onClick: () => setMealType(type),
                        className: `px-3 py-2.5 rounded-2xl text-[13px] font-semibold transition-all ${mealType === type ? "bg-primary text-primary-foreground shadow-md shadow-primary/20" : "bg-muted/60 text-muted-foreground border border-border/30"}`,
                        children: MEAL_LABELS[type]
                      },
                      type
                    )) })
                  ] }),
                  /* @__PURE__ */ jsxs(
                    motion.button,
                    {
                      type: "submit",
                      disabled: saving,
                      whileTap: { scale: 0.97 },
                      className: "w-full py-4 rounded-2xl bg-primary text-primary-foreground font-semibold text-[15px] flex items-center justify-center gap-2 shadow-lg shadow-primary/25 active:shadow-primary/15 transition-shadow disabled:opacity-60",
                      children: [
                        /* @__PURE__ */ jsx(Plus, { className: "w-5 h-5" }),
                        saving ? "Saving..." : "Add Food"
                      ]
                    }
                  )
                ] })
              },
              "manual"
            ) })
          ] }),
          /* @__PURE__ */ jsx("div", { className: "h-8" })
        ]
      }
    )
  ] }) });
}
export {
  AddFoodDialog
};
