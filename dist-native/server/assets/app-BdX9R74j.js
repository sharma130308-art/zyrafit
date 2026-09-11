import { jsxs, jsx, Fragment } from "react/jsx-runtime";
import { useNavigate } from "@tanstack/react-router";
import { useState, useRef, useEffect, useCallback, Suspense, lazy } from "react";
import { motion, AnimatePresence, useMotionValue, useTransform, animate } from "framer-motion";
import { u as useAuth } from "./use-auth-gfzAGvwo.js";
import { a as hapticSuccess, d as hapticHeavy, M as MEAL_LABELS, e as MEAL_ICONS, h as hapticLight, c as hapticMedium, g as getTodayDate, f as getMacroGoalsLocal, s as supabase, i as getEntries, l as loadCalorieGoal, j as getWeeklyHistory, k as getLoggingStreak, m as loadMacroGoals, r as restoreEntry, n as getDailyTotals, o as getEntriesByMeal, u as updateEntry, p as deleteEntry, q as addEntry } from "./router-L3bJVu16.js";
import confetti from "canvas-confetti";
import { Trash2, Minus, Plus, X, Check, Camera, Bell, Flame, ArrowRight, Undo2, Image, Upload, Brain, Sparkles, Loader2 } from "lucide-react";
import { D as DashboardSkeleton, B as BottomNav } from "./DashboardSkeleton-DQgJUb9_.js";
import { toast } from "sonner";
import { i as isPushSupported, a as isPreviewEnvironment, h as hasShownPrompt, m as markPromptShown, s as subscribeToPush } from "./push-CbfwDtlI.js";
import "@supabase/supabase-js";
import "@capacitor/core";
import "@capacitor/haptics";
import "mcp-tanstack-start";
import "zod";
function CalorieRing({ consumed, goal, burned = 0 }) {
  const effectiveGoal = goal + (burned > 0 ? burned : 0);
  const remaining = Math.max(0, effectiveGoal - consumed);
  const percentage = Math.min(consumed / effectiveGoal * 100, 100);
  const overGoal = consumed > effectiveGoal;
  const hitGoal = consumed >= effectiveGoal;
  const [showCelebration, setShowCelebration] = useState(false);
  const hasCelebratedRef = useRef(false);
  const radius = 90;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - percentage / 100 * circumference;
  useEffect(() => {
    if (hitGoal && !hasCelebratedRef.current && consumed > 0) {
      hasCelebratedRef.current = true;
      setShowCelebration(true);
      hapticSuccess();
      const duration = 2e3;
      const end = Date.now() + duration;
      const colors = ["#06b6d4", "#3b82f6", "#8b5cf6", "#f59e0b", "#10b981"];
      const frame = () => {
        confetti({
          particleCount: 3,
          angle: 60,
          spread: 55,
          origin: { x: 0, y: 0.6 },
          colors
        });
        confetti({
          particleCount: 3,
          angle: 120,
          spread: 55,
          origin: { x: 1, y: 0.6 },
          colors
        });
        if (Date.now() < end) requestAnimationFrame(frame);
      };
      frame();
      setTimeout(() => setShowCelebration(false), 3500);
    }
    if (!hitGoal) {
      hasCelebratedRef.current = false;
    }
  }, [hitGoal, consumed]);
  return /* @__PURE__ */ jsxs("div", { className: "flex flex-col items-center gap-3", children: [
    /* @__PURE__ */ jsxs("div", { className: "relative w-52 h-52", children: [
      /* @__PURE__ */ jsx(
        "div",
        {
          className: "absolute inset-4 rounded-full blur-2xl opacity-20",
          style: { backgroundColor: overGoal ? "var(--color-destructive)" : "var(--color-calories)" }
        }
      ),
      /* @__PURE__ */ jsxs("svg", { className: "w-full h-full -rotate-90 relative z-10", viewBox: "0 0 200 200", children: [
        /* @__PURE__ */ jsx(
          "circle",
          {
            cx: "100",
            cy: "100",
            r: radius,
            fill: "none",
            stroke: "var(--color-muted)",
            strokeWidth: "10"
          }
        ),
        /* @__PURE__ */ jsx(
          motion.circle,
          {
            cx: "100",
            cy: "100",
            r: radius,
            fill: "none",
            stroke: overGoal ? "var(--color-destructive)" : "var(--color-calories)",
            strokeWidth: "10",
            strokeLinecap: "round",
            strokeDasharray: circumference,
            initial: { strokeDashoffset: circumference },
            animate: { strokeDashoffset },
            transition: { duration: 1.2, ease: [0.16, 1, 0.3, 1] }
          }
        )
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "absolute inset-0 flex flex-col items-center justify-center z-10", children: [
        /* @__PURE__ */ jsx(
          motion.span,
          {
            className: "text-5xl font-extrabold tracking-tight text-foreground",
            initial: { opacity: 0, y: 8 },
            animate: { opacity: 1, y: 0 },
            transition: { duration: 0.4 },
            children: Math.round(remaining)
          },
          remaining
        ),
        /* @__PURE__ */ jsx("span", { className: "text-xs font-medium tracking-wide uppercase text-muted-foreground mt-0.5", children: hitGoal ? "complete!" : "remaining" })
      ] }),
      /* @__PURE__ */ jsx(AnimatePresence, { children: showCelebration && /* @__PURE__ */ jsx(
        motion.div,
        {
          className: "absolute inset-0 rounded-full z-0",
          style: { border: "3px solid var(--color-calories)" },
          initial: { scale: 1, opacity: 0.8 },
          animate: { scale: 1.5, opacity: 0 },
          exit: { opacity: 0 },
          transition: { duration: 1.2, ease: "easeOut" }
        }
      ) })
    ] }),
    /* @__PURE__ */ jsx(AnimatePresence, { children: showCelebration && /* @__PURE__ */ jsx(
      motion.p,
      {
        className: "text-sm font-semibold text-primary",
        initial: { opacity: 0, y: 10, scale: 0.9 },
        animate: { opacity: 1, y: 0, scale: 1 },
        exit: { opacity: 0, y: -5 },
        transition: { type: "spring", damping: 15 },
        children: "🎉 Goal reached!"
      }
    ) }),
    /* @__PURE__ */ jsxs("div", { className: "flex gap-6 text-sm", children: [
      /* @__PURE__ */ jsxs("div", { className: "flex flex-col items-center", children: [
        /* @__PURE__ */ jsx("span", { className: "text-lg font-bold text-foreground", children: Math.round(consumed) }),
        /* @__PURE__ */ jsx("span", { className: "text-xs text-muted-foreground", children: "eaten" })
      ] }),
      burned > 0 && /* @__PURE__ */ jsxs(Fragment, { children: [
        /* @__PURE__ */ jsx("div", { className: "h-10 w-px bg-border" }),
        /* @__PURE__ */ jsxs("div", { className: "flex flex-col items-center", children: [
          /* @__PURE__ */ jsx("span", { className: "text-lg font-bold text-primary", children: burned }),
          /* @__PURE__ */ jsx("span", { className: "text-xs text-muted-foreground", children: "burned" })
        ] })
      ] }),
      /* @__PURE__ */ jsx("div", { className: "h-10 w-px bg-border" }),
      /* @__PURE__ */ jsxs("div", { className: "flex flex-col items-center", children: [
        /* @__PURE__ */ jsx("span", { className: "text-lg font-bold text-foreground", children: effectiveGoal }),
        /* @__PURE__ */ jsx("span", { className: "text-xs text-muted-foreground", children: "goal" })
      ] })
    ] })
  ] });
}
function MacroCard({ label, current, goal, color, symbol }) {
  const rounded = Math.round(current);
  const hasGoal = typeof goal === "number" && goal > 0;
  const pct = hasGoal ? Math.min(100, current / goal * 100) : 0;
  const remaining = hasGoal ? Math.max(0, Math.round(goal - current)) : null;
  return /* @__PURE__ */ jsxs(
    motion.div,
    {
      layout: true,
      className: "relative flex-1 min-w-0 overflow-hidden rounded-2xl border border-border/60 bg-card p-3.5 shadow-sm",
      style: {
        backgroundImage: `linear-gradient(135deg, color-mix(in oklab, ${color} 10%, transparent) 0%, transparent 60%)`
      },
      children: [
        /* @__PURE__ */ jsx(
          "div",
          {
            "aria-hidden": true,
            className: "pointer-events-none absolute -top-8 -right-8 h-20 w-20 rounded-full opacity-30 blur-2xl",
            style: { backgroundColor: color }
          }
        ),
        /* @__PURE__ */ jsxs("div", { className: "relative flex items-center justify-between", children: [
          /* @__PURE__ */ jsx(
            "span",
            {
              className: "inline-flex h-6 w-6 items-center justify-center rounded-md text-[11px] font-bold text-white shadow-sm",
              style: { backgroundColor: color },
              children: symbol
            }
          ),
          /* @__PURE__ */ jsx("span", { className: "text-[10px] font-semibold uppercase tracking-wider text-muted-foreground", children: label })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "relative mt-2.5 flex items-baseline gap-1", children: [
          /* @__PURE__ */ jsx(
            motion.span,
            {
              initial: { opacity: 0, y: 6 },
              animate: { opacity: 1, y: 0 },
              transition: { duration: 0.25, ease: [0.16, 1, 0.3, 1] },
              className: "text-2xl font-bold tabular-nums text-foreground",
              children: rounded
            },
            rounded
          ),
          /* @__PURE__ */ jsx("span", { className: "text-xs font-medium text-muted-foreground", children: "g" }),
          hasGoal && /* @__PURE__ */ jsxs("span", { className: "ml-auto text-[11px] font-medium tabular-nums text-muted-foreground", children: [
            "/ ",
            goal,
            "g"
          ] })
        ] }),
        /* @__PURE__ */ jsx("div", { className: "relative mt-2.5 h-1.5 w-full overflow-hidden rounded-full bg-muted/70", children: /* @__PURE__ */ jsx(
          motion.div,
          {
            className: "h-full rounded-full",
            style: {
              backgroundImage: `linear-gradient(90deg, color-mix(in oklab, ${color} 70%, transparent), ${color})`
            },
            initial: { width: 0 },
            animate: { width: `${hasGoal ? pct : current > 0 ? Math.min(100, Math.max(8, current / 2)) : 0}%` },
            transition: { duration: 0.7, ease: [0.16, 1, 0.3, 1] }
          }
        ) }),
        hasGoal && /* @__PURE__ */ jsx("p", { className: "relative mt-1.5 text-[10px] text-muted-foreground", children: remaining > 0 ? `${remaining}g left` : "Goal hit 🎯" })
      ]
    }
  );
}
const DELETE_THRESHOLD = -80;
function SwipeToDelete({ onDelete, children }) {
  const x = useMotionValue(0);
  const isDeleting = useRef(false);
  const bgOpacity = useTransform(x, [0, DELETE_THRESHOLD], [0, 1]);
  const iconScale = useTransform(x, [0, DELETE_THRESHOLD * 0.6, DELETE_THRESHOLD], [0.5, 0.8, 1]);
  const iconX = useTransform(x, [0, DELETE_THRESHOLD], [20, 0]);
  const handleDragEnd = useCallback(
    (_, info) => {
      if (x.get() <= DELETE_THRESHOLD && !isDeleting.current) {
        isDeleting.current = true;
        hapticHeavy();
        animate(x, -400, {
          type: "spring",
          stiffness: 300,
          damping: 30,
          onComplete: () => onDelete()
        });
      } else {
        animate(x, 0, { type: "spring", stiffness: 400, damping: 30 });
      }
    },
    [x, onDelete]
  );
  const handleDrag = useCallback(
    (_, info) => {
      const prev = x.getPrevious() ?? 0;
      const curr = x.get();
      if (curr <= DELETE_THRESHOLD && prev > DELETE_THRESHOLD) {
        hapticHeavy();
      }
    },
    [x]
  );
  return /* @__PURE__ */ jsxs("div", { className: "relative overflow-hidden", children: [
    /* @__PURE__ */ jsx(
      motion.div,
      {
        className: "absolute inset-0 flex items-center justify-end pr-6 rounded-xl bg-destructive",
        style: { opacity: bgOpacity },
        children: /* @__PURE__ */ jsx(motion.div, { style: { scale: iconScale, x: iconX }, children: /* @__PURE__ */ jsx(Trash2, { className: "w-5 h-5 text-destructive-foreground" }) })
      }
    ),
    /* @__PURE__ */ jsx(
      motion.div,
      {
        style: { x },
        drag: "x",
        dragConstraints: { left: -120, right: 0 },
        dragElastic: { left: 0.1, right: 0 },
        onDrag: handleDrag,
        onDragEnd: handleDragEnd,
        className: "relative bg-card z-10",
        children
      }
    )
  ] });
}
const MEAL_TYPES = ["breakfast", "lunch", "dinner", "snack"];
function InlineEntryEditor({ entry, onSave, onCancel }) {
  const [quantity, setQuantity] = useState(entry.quantity);
  const [calories, setCalories] = useState(entry.calories);
  const [protein, setProtein] = useState(entry.protein);
  const [carbs, setCarbs] = useState(entry.carbs);
  const [fat, setFat] = useState(entry.fat);
  const [mealType, setMealType] = useState(entry.mealType);
  const [saving, setSaving] = useState(false);
  useEffect(() => {
    setQuantity(entry.quantity);
    setCalories(entry.calories);
    setProtein(entry.protein);
    setCarbs(entry.carbs);
    setFat(entry.fat);
    setMealType(entry.mealType);
  }, [entry.id]);
  const stepQty = (delta) => {
    hapticLight();
    setQuantity((q) => Math.max(0.25, +(q + delta).toFixed(2)));
  };
  const handleSave = async () => {
    setSaving(true);
    hapticMedium();
    await onSave(entry.id, { quantity, calories, protein, carbs, fat, mealType });
    setSaving(false);
  };
  return /* @__PURE__ */ jsx(
    motion.div,
    {
      initial: { opacity: 0, height: 0 },
      animate: { opacity: 1, height: "auto" },
      exit: { opacity: 0, height: 0 },
      transition: { duration: 0.2 },
      className: "overflow-hidden",
      children: /* @__PURE__ */ jsxs("div", { className: "mt-1 mb-1 px-3 py-3 rounded-xl bg-muted/30 border border-border/40 space-y-3", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex items-baseline justify-between", children: [
          /* @__PURE__ */ jsx("span", { className: "text-[11px] font-medium text-muted-foreground uppercase tracking-wide", children: "Total" }),
          /* @__PURE__ */ jsxs("span", { className: "text-[18px] font-bold text-primary tabular-nums", children: [
            Math.round(calories * quantity),
            /* @__PURE__ */ jsx("span", { className: "text-[11px] font-medium text-muted-foreground ml-1", children: "cal" })
          ] })
        ] }),
        /* @__PURE__ */ jsx("div", { className: "grid grid-cols-4 gap-1.5", children: MEAL_TYPES.map((m) => /* @__PURE__ */ jsxs(
          "button",
          {
            onClick: () => {
              hapticLight();
              setMealType(m);
            },
            className: `py-1.5 rounded-lg text-[10px] font-semibold border transition-colors ${mealType === m ? "bg-primary text-primary-foreground border-primary" : "bg-card text-muted-foreground border-transparent"}`,
            children: [
              /* @__PURE__ */ jsx("span", { className: "block text-sm leading-none mb-0.5", children: MEAL_ICONS[m] }),
              MEAL_LABELS[m]
            ]
          },
          m
        )) }),
        /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between bg-card rounded-xl p-1", children: [
          /* @__PURE__ */ jsx(
            motion.button,
            {
              whileTap: { scale: 0.9 },
              onClick: () => stepQty(-0.5),
              className: "w-9 h-9 rounded-lg bg-muted/50 flex items-center justify-center",
              children: /* @__PURE__ */ jsx(Minus, { className: "w-3.5 h-3.5 text-card-foreground" })
            }
          ),
          /* @__PURE__ */ jsxs("div", { className: "text-center", children: [
            /* @__PURE__ */ jsx("p", { className: "text-[10px] text-muted-foreground leading-none mb-0.5", children: "Servings" }),
            /* @__PURE__ */ jsxs("span", { className: "text-[16px] font-bold text-card-foreground tabular-nums", children: [
              "×",
              quantity % 1 === 0 ? quantity : quantity.toFixed(2)
            ] })
          ] }),
          /* @__PURE__ */ jsx(
            motion.button,
            {
              whileTap: { scale: 0.9 },
              onClick: () => stepQty(0.5),
              className: "w-9 h-9 rounded-lg bg-muted/50 flex items-center justify-center",
              children: /* @__PURE__ */ jsx(Plus, { className: "w-3.5 h-3.5 text-card-foreground" })
            }
          )
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-4 gap-1.5", children: [
          /* @__PURE__ */ jsx(MacroField, { label: "Cal", value: calories, onChange: setCalories }),
          /* @__PURE__ */ jsx(MacroField, { label: "P", value: protein, onChange: setProtein }),
          /* @__PURE__ */ jsx(MacroField, { label: "C", value: carbs, onChange: setCarbs }),
          /* @__PURE__ */ jsx(MacroField, { label: "F", value: fat, onChange: setFat })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "flex gap-2", children: [
          /* @__PURE__ */ jsxs(
            "button",
            {
              onClick: onCancel,
              className: "flex-1 h-10 rounded-xl bg-card text-card-foreground font-semibold text-[13px] flex items-center justify-center gap-1.5 border border-border/40",
              children: [
                /* @__PURE__ */ jsx(X, { className: "w-3.5 h-3.5" }),
                "Cancel"
              ]
            }
          ),
          /* @__PURE__ */ jsxs(
            motion.button,
            {
              whileTap: { scale: 0.97 },
              onClick: handleSave,
              disabled: saving,
              className: "flex-1 h-10 rounded-xl bg-primary text-primary-foreground font-semibold text-[13px] flex items-center justify-center gap-1.5 shadow shadow-primary/20 disabled:opacity-60",
              children: [
                /* @__PURE__ */ jsx(Check, { className: "w-3.5 h-3.5" }),
                saving ? "Saving…" : "Save"
              ]
            }
          )
        ] })
      ] })
    }
  );
}
function MacroField({ label, value, onChange }) {
  return /* @__PURE__ */ jsxs("label", { className: "flex flex-col gap-0.5 p-2 bg-card rounded-lg border border-transparent focus-within:border-primary/40 transition-colors", children: [
    /* @__PURE__ */ jsx("span", { className: "text-[10px] font-medium text-muted-foreground", children: label }),
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
        className: "bg-transparent outline-none font-semibold text-card-foreground tabular-nums text-[14px] w-full",
        placeholder: "0"
      }
    )
  ] });
}
function MealSection({ mealType, entries, onDelete, onAdd, onEdit, onUpdate }) {
  const [editingId, setEditingId] = useState(null);
  const totalCalories = entries.reduce((sum, e) => sum + e.calories * e.quantity, 0);
  const [fullscreenPhoto, setFullscreenPhoto] = useState(null);
  return /* @__PURE__ */ jsxs(Fragment, { children: [
    /* @__PURE__ */ jsxs(
      motion.div,
      {
        className: "rounded-2xl bg-card p-4 shadow-[0_1px_3px_0_rgba(0,0,0,0.04)] border border-border/40",
        whileTap: { scale: 0.98 },
        transition: { type: "spring", stiffness: 400, damping: 25 },
        children: [
          /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between mb-2", children: [
            /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2.5", children: [
              /* @__PURE__ */ jsx("span", { className: "text-xl", children: MEAL_ICONS[mealType] }),
              /* @__PURE__ */ jsx("h3", { className: "font-semibold text-[15px] text-card-foreground", children: MEAL_LABELS[mealType] })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
              totalCalories > 0 && /* @__PURE__ */ jsxs(
                motion.span,
                {
                  className: "text-sm font-semibold text-muted-foreground",
                  initial: { opacity: 0 },
                  animate: { opacity: 1 },
                  children: [
                    Math.round(totalCalories),
                    " cal"
                  ]
                }
              ),
              onAdd && /* @__PURE__ */ jsx(
                motion.button,
                {
                  whileTap: { scale: 0.85 },
                  onClick: () => {
                    hapticLight();
                    onAdd(mealType);
                  },
                  className: "p-1.5 rounded-xl bg-primary/10 text-primary",
                  children: /* @__PURE__ */ jsx(Plus, { className: "w-4 h-4" })
                }
              )
            ] })
          ] }),
          /* @__PURE__ */ jsx(AnimatePresence, { mode: "popLayout", children: entries.length === 0 ? /* @__PURE__ */ jsx(
            "button",
            {
              onClick: () => onAdd?.(mealType),
              className: "text-[13px] text-muted-foreground/60 py-1 hover:text-primary transition-colors",
              children: "Tap + to add food"
            }
          ) : /* @__PURE__ */ jsx("div", { className: "space-y-0.5", children: entries.map((entry) => /* @__PURE__ */ jsxs(
            motion.div,
            {
              layout: true,
              initial: { opacity: 0, x: -10 },
              animate: { opacity: 1, x: 0 },
              exit: { opacity: 0, x: -100, height: 0, marginTop: 0, paddingTop: 0, paddingBottom: 0 },
              transition: { duration: 0.25 },
              children: [
                /* @__PURE__ */ jsx(SwipeToDelete, { onDelete: () => onDelete(entry.id), children: /* @__PURE__ */ jsxs(
                  "div",
                  {
                    onClick: () => {
                      hapticLight();
                      if (onUpdate) {
                        setEditingId((curr) => curr === entry.id ? null : entry.id);
                      } else {
                        onEdit?.(entry);
                      }
                    },
                    className: "flex items-center justify-between py-2.5 border-t border-border/20 first:border-t-0 px-1 cursor-pointer active:bg-muted/30 transition-colors rounded-lg",
                    children: [
                      entry.photoUrl && /* @__PURE__ */ jsxs(
                        motion.button,
                        {
                          whileTap: { scale: 0.92 },
                          onClick: (e) => {
                            e.stopPropagation();
                            setFullscreenPhoto({ url: entry.photoUrl, name: entry.name });
                          },
                          className: "relative w-10 h-10 rounded-xl overflow-hidden flex-shrink-0 mr-3 border border-border/30",
                          children: [
                            /* @__PURE__ */ jsx("img", { src: entry.photoUrl, alt: entry.name, className: "w-full h-full object-cover" }),
                            entry.source === "ai" && /* @__PURE__ */ jsx("span", { className: "absolute -bottom-0.5 -right-0.5 w-4.5 h-4.5 bg-primary rounded-full flex items-center justify-center shadow-sm border border-background", children: /* @__PURE__ */ jsx(Camera, { className: "w-2.5 h-2.5 text-primary-foreground" }) })
                          ]
                        }
                      ),
                      !entry.photoUrl && entry.source === "ai" && /* @__PURE__ */ jsx("span", { className: "w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mr-2", children: /* @__PURE__ */ jsx(Camera, { className: "w-3 h-3 text-primary" }) }),
                      /* @__PURE__ */ jsxs("div", { className: "flex-1 min-w-0", children: [
                        /* @__PURE__ */ jsx("p", { className: "text-[14px] font-medium text-card-foreground truncate", children: entry.name }),
                        /* @__PURE__ */ jsxs("p", { className: "text-[11px] text-muted-foreground mt-0.5", children: [
                          Math.round(entry.calories * entry.quantity),
                          " cal",
                          /* @__PURE__ */ jsx("span", { className: "mx-1", children: "·" }),
                          "P ",
                          Math.round(entry.protein * entry.quantity),
                          /* @__PURE__ */ jsx("span", { className: "mx-1", children: "·" }),
                          "C ",
                          Math.round(entry.carbs * entry.quantity),
                          /* @__PURE__ */ jsx("span", { className: "mx-1", children: "·" }),
                          "F ",
                          Math.round(entry.fat * entry.quantity),
                          entry.quantity > 1 && /* @__PURE__ */ jsxs("span", { className: "ml-1", children: [
                            "×",
                            entry.quantity
                          ] })
                        ] })
                      ] })
                    ]
                  }
                ) }),
                /* @__PURE__ */ jsx(AnimatePresence, { children: onUpdate && editingId === entry.id && /* @__PURE__ */ jsx(
                  InlineEntryEditor,
                  {
                    entry,
                    onSave: async (id, patch) => {
                      await onUpdate(id, patch);
                      setEditingId(null);
                    },
                    onCancel: () => setEditingId(null)
                  }
                ) })
              ]
            },
            entry.id
          )) }) })
        ]
      }
    ),
    /* @__PURE__ */ jsx(AnimatePresence, { children: fullscreenPhoto && /* @__PURE__ */ jsxs(
      motion.div,
      {
        className: "fixed inset-0 z-[60] bg-foreground/95 backdrop-blur-xl flex flex-col items-center justify-center",
        initial: { opacity: 0 },
        animate: { opacity: 1 },
        exit: { opacity: 0 },
        onClick: () => setFullscreenPhoto(null),
        children: [
          /* @__PURE__ */ jsxs("div", { className: "absolute top-0 inset-x-0 flex items-center justify-between px-5 pt-14 pb-4", children: [
            /* @__PURE__ */ jsx("p", { className: "text-background font-semibold text-base truncate flex-1 mr-4", children: fullscreenPhoto.name }),
            /* @__PURE__ */ jsx(
              motion.button,
              {
                whileTap: { scale: 0.9 },
                onClick: () => setFullscreenPhoto(null),
                className: "w-10 h-10 rounded-full bg-background/15 flex items-center justify-center flex-shrink-0",
                children: /* @__PURE__ */ jsx(X, { className: "w-5 h-5 text-background" })
              }
            )
          ] }),
          /* @__PURE__ */ jsx(
            motion.img,
            {
              src: fullscreenPhoto.url,
              alt: fullscreenPhoto.name,
              className: "max-w-[90%] max-h-[75vh] rounded-2xl object-contain shadow-2xl",
              initial: { scale: 0.85, opacity: 0 },
              animate: { scale: 1, opacity: 1 },
              exit: { scale: 0.85, opacity: 0 },
              transition: { type: "spring", damping: 25, stiffness: 300 }
            }
          )
        ]
      }
    ) })
  ] });
}
function ReminderPrompt({ isAuthenticated }) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    if (!isAuthenticated) return;
    if (!isPushSupported()) return;
    if (isPreviewEnvironment()) return;
    if (hasShownPrompt()) return;
    if (typeof Notification !== "undefined" && Notification.permission !== "default") {
      markPromptShown();
      return;
    }
    const t = setTimeout(() => setOpen(true), 1500);
    return () => clearTimeout(t);
  }, [isAuthenticated]);
  const close = () => {
    markPromptShown();
    setOpen(false);
  };
  const handleEnable = async () => {
    setBusy(true);
    const { ok, error } = await subscribeToPush();
    setBusy(false);
    if (ok) {
      toast.success("Meal reminders enabled");
    } else if (error) {
      toast.error(error);
    }
    close();
  };
  return /* @__PURE__ */ jsx(AnimatePresence, { children: open && /* @__PURE__ */ jsxs(
    motion.div,
    {
      initial: { opacity: 0, y: 30 },
      animate: { opacity: 1, y: 0 },
      exit: { opacity: 0, y: 30 },
      transition: { type: "spring", stiffness: 300, damping: 30 },
      className: "fixed bottom-24 left-4 right-4 z-40 mx-auto max-w-[400px] rounded-2xl bg-card border border-border shadow-2xl p-4",
      children: [
        /* @__PURE__ */ jsx(
          "button",
          {
            onClick: close,
            className: "absolute top-2 right-2 p-1.5 rounded-full text-muted-foreground hover:bg-muted",
            "aria-label": "Dismiss",
            children: /* @__PURE__ */ jsx(X, { className: "w-4 h-4" })
          }
        ),
        /* @__PURE__ */ jsxs("div", { className: "flex items-start gap-3", children: [
          /* @__PURE__ */ jsx("div", { className: "w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0", children: /* @__PURE__ */ jsx(Bell, { className: "w-5 h-5 text-primary" }) }),
          /* @__PURE__ */ jsxs("div", { className: "flex-1 pr-6", children: [
            /* @__PURE__ */ jsx("h3", { className: "font-semibold text-card-foreground", children: "Stay on track" }),
            /* @__PURE__ */ jsx("p", { className: "text-xs text-muted-foreground mt-0.5", children: "Get gentle reminders at breakfast, lunch, and dinner — only if you haven't logged yet." })
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "flex gap-2 mt-4", children: [
          /* @__PURE__ */ jsx(
            "button",
            {
              onClick: close,
              className: "flex-1 py-2.5 rounded-xl bg-muted text-foreground text-sm font-medium",
              children: "Not now"
            }
          ),
          /* @__PURE__ */ jsx(
            "button",
            {
              onClick: handleEnable,
              disabled: busy,
              className: "flex-1 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold disabled:opacity-50",
              children: busy ? "Enabling…" : "Enable"
            }
          )
        ] })
      ]
    }
  ) });
}
const THRESHOLD = 80;
function PullToRefresh({ onRefresh, children }) {
  const [state, setState] = useState("idle");
  const pullY = useMotionValue(0);
  const isDragging = useRef(false);
  const isTouch = useRef(false);
  const containerRef = useRef(null);
  const spinnerOpacity = useTransform(pullY, [0, THRESHOLD * 0.5, THRESHOLD], [0, 0.5, 1]);
  const spinnerScale = useTransform(pullY, [0, THRESHOLD], [0.5, 1]);
  const spinnerRotate = useTransform(pullY, [0, THRESHOLD * 2], [0, 360]);
  const handlePointerDown = useCallback((e) => {
    isTouch.current = e.pointerType === "touch";
    if (!isTouch.current) return;
    const el = containerRef.current;
    if (el && el.scrollTop > 0) return;
    isDragging.current = true;
  }, []);
  const handleDrag = useCallback(
    (_, info) => {
      if (!isTouch.current || !isDragging.current || state !== "idle") return;
      const el = containerRef.current;
      if (el && el.scrollTop > 0) return;
      const newY = Math.max(0, pullY.get() + info.delta.y * 0.5);
      pullY.set(newY);
      if (newY >= THRESHOLD && (pullY.getPrevious() ?? 0) < THRESHOLD) {
        hapticMedium();
      }
    },
    [pullY, state]
  );
  const handleDragEnd = useCallback(async () => {
    if (!isTouch.current || !isDragging.current) return;
    isDragging.current = false;
    if (pullY.get() >= THRESHOLD && state === "idle") {
      setState("refreshing");
      animate(pullY, 50, { type: "spring", stiffness: 300, damping: 30 });
      try {
        await onRefresh();
      } finally {
        setState("done");
        hapticSuccess();
        setTimeout(() => {
          setState("idle");
          animate(pullY, 0, { type: "spring", stiffness: 300, damping: 30 });
        }, 800);
      }
    } else {
      animate(pullY, 0, { type: "spring", stiffness: 300, damping: 30 });
    }
  }, [pullY, state, onRefresh]);
  return /* @__PURE__ */ jsxs("div", { ref: containerRef, className: "relative overflow-y-auto min-h-screen", children: [
    /* @__PURE__ */ jsx(
      motion.div,
      {
        className: "absolute left-1/2 -translate-x-1/2 z-20 flex items-center justify-center",
        style: {
          top: useTransform(pullY, (v) => v - 40),
          opacity: spinnerOpacity,
          scale: spinnerScale
        },
        children: /* @__PURE__ */ jsx(AnimatePresence, { mode: "wait", children: state === "done" ? /* @__PURE__ */ jsx(
          motion.div,
          {
            initial: { scale: 0, opacity: 0 },
            animate: { scale: 1, opacity: 1 },
            exit: { scale: 0, opacity: 0 },
            transition: { type: "spring", stiffness: 500, damping: 25 },
            className: "w-8 h-8 rounded-full bg-success flex items-center justify-center",
            children: /* @__PURE__ */ jsx(
              motion.div,
              {
                initial: { pathLength: 0 },
                animate: { pathLength: 1 },
                children: /* @__PURE__ */ jsx(Check, { className: "w-5 h-5 text-success-foreground", strokeWidth: 3 })
              }
            )
          },
          "check"
        ) : /* @__PURE__ */ jsx(
          motion.div,
          {
            exit: { scale: 0, opacity: 0 },
            className: "w-8 h-8 rounded-full border-[2.5px] border-primary border-t-transparent",
            style: { rotate: state === "refreshing" ? void 0 : spinnerRotate },
            animate: state === "refreshing" ? { rotate: 360 } : void 0,
            transition: state === "refreshing" ? { duration: 0.8, repeat: Infinity, ease: "linear" } : { duration: 0.15 }
          },
          "spinner"
        ) })
      }
    ),
    /* @__PURE__ */ jsx(
      motion.div,
      {
        style: { y: pullY },
        onPointerDown: handlePointerDown,
        onPan: handleDrag,
        onPanEnd: handleDragEnd,
        children
      }
    )
  ] });
}
const FIRST_RUN_KEY = "zyrafit:first-run-done";
function isFirstRunPending() {
  if (typeof window === "undefined") return false;
  try {
    return localStorage.getItem(FIRST_RUN_KEY) !== "1";
  } catch {
    return false;
  }
}
function markFirstRunDone() {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(FIRST_RUN_KEY, "1");
  } catch {
  }
}
const SLIDES = [
  {
    icon: Camera,
    title: "Log a meal in seconds",
    body: "Snap a photo, scan a barcode, or just type what you ate — we work out the calories and macros for you."
  },
  {
    icon: Flame,
    title: "Watch your day fill up",
    body: "Your ring shows how much of your daily target is left, and the macro cards break down protein, carbs and fat."
  },
  {
    icon: Bell,
    title: "Gentle nudges, never spam",
    body: "Turn on meal reminders in your profile and we'll tap you on the shoulder at breakfast, lunch and dinner."
  }
];
function FirstRunSetup({ onDone }) {
  const [index, setIndex] = useState(0);
  const slide = SLIDES[index];
  const Icon = slide.icon;
  const isLast = index === SLIDES.length - 1;
  const finish = () => {
    hapticMedium();
    markFirstRunDone();
    onDone();
  };
  const next = () => {
    if (isLast) return finish();
    hapticLight();
    setIndex((i) => i + 1);
  };
  return /* @__PURE__ */ jsxs("div", { className: "min-h-screen bg-background flex flex-col px-6 pt-16 pb-10", children: [
    /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between", children: [
      /* @__PURE__ */ jsx("div", { className: "flex gap-1.5", children: SLIDES.map((_, i) => /* @__PURE__ */ jsx(
        "span",
        {
          className: `h-1.5 rounded-full transition-all ${i === index ? "w-6 bg-primary" : "w-1.5 bg-muted"}`
        },
        i
      )) }),
      /* @__PURE__ */ jsx(
        "button",
        {
          type: "button",
          onClick: finish,
          className: "text-sm text-muted-foreground hover:text-foreground transition-colors",
          children: "Skip"
        }
      )
    ] }),
    /* @__PURE__ */ jsx("div", { className: "flex-1 flex flex-col justify-center", children: /* @__PURE__ */ jsx(AnimatePresence, { mode: "wait", initial: false, children: /* @__PURE__ */ jsxs(
      motion.div,
      {
        initial: { opacity: 0, x: 40 },
        animate: { opacity: 1, x: 0 },
        exit: { opacity: 0, x: -40 },
        transition: { duration: 0.25 },
        className: "text-center",
        children: [
          /* @__PURE__ */ jsx("div", { className: "mx-auto w-16 h-16 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mb-6", children: /* @__PURE__ */ jsx(Icon, { className: "w-7 h-7" }) }),
          /* @__PURE__ */ jsx("h1", { className: "text-2xl font-bold text-foreground mb-3", children: slide.title }),
          /* @__PURE__ */ jsx("p", { className: "text-muted-foreground leading-relaxed max-w-xs mx-auto", children: slide.body })
        ]
      },
      index
    ) }) }),
    /* @__PURE__ */ jsxs(
      motion.button,
      {
        whileTap: { scale: 0.97 },
        onClick: next,
        className: "w-full flex items-center justify-center gap-2 py-4 rounded-2xl bg-primary text-primary-foreground font-semibold shadow-lg shadow-primary/25",
        children: [
          isLast ? "Start tracking" : "Next",
          /* @__PURE__ */ jsx(ArrowRight, { className: "w-4 h-4" })
        ]
      }
    )
  ] });
}
function StreakBadge({ streak }) {
  if (streak <= 0) return null;
  return /* @__PURE__ */ jsxs(
    motion.div,
    {
      initial: { opacity: 0, scale: 0.8 },
      animate: { opacity: 1, scale: 1 },
      transition: { type: "spring", stiffness: 400, damping: 20 },
      className: "flex items-center gap-1.5 px-3 py-1.5 rounded-2xl bg-gradient-to-r from-orange-500/10 to-amber-400/10 border border-orange-300/30",
      children: [
        /* @__PURE__ */ jsx(
          motion.div,
          {
            animate: { y: [0, -2, 0] },
            transition: { duration: 1.5, repeat: Infinity, ease: "easeInOut" },
            children: /* @__PURE__ */ jsx(Flame, { className: "w-4 h-4 text-orange-500" })
          }
        ),
        /* @__PURE__ */ jsx("span", { className: "text-sm font-bold text-orange-600", children: streak }),
        /* @__PURE__ */ jsx("span", { className: "text-xs text-orange-500/80 font-medium", children: streak === 1 ? "day" : "days" })
      ]
    }
  );
}
const UNDO_TIMEOUT = 5e3;
function UndoToast({ entry, onUndo, onDismiss }) {
  const timerRef = useRef(null);
  useEffect(() => {
    if (!entry) return;
    timerRef.current = window.setTimeout(onDismiss, UNDO_TIMEOUT);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [entry, onDismiss]);
  const handleUndo = useCallback(() => {
    if (timerRef.current !== null) clearTimeout(timerRef.current);
    hapticLight();
    onUndo();
  }, [onUndo]);
  return /* @__PURE__ */ jsx(AnimatePresence, { children: entry && /* @__PURE__ */ jsx(
    motion.div,
    {
      initial: { opacity: 0, y: 60, scale: 0.95 },
      animate: { opacity: 1, y: 0, scale: 1 },
      exit: { opacity: 0, y: 20, scale: 0.95 },
      transition: { type: "spring", stiffness: 400, damping: 30 },
      className: "fixed bottom-24 inset-x-0 z-50 flex justify-center px-6 pointer-events-none",
      children: /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3 px-4 py-3 rounded-2xl bg-foreground/90 backdrop-blur-xl shadow-2xl pointer-events-auto max-w-[340px] w-full", children: [
        /* @__PURE__ */ jsxs("p", { className: "text-sm text-background font-medium flex-1 truncate", children: [
          "Deleted ",
          /* @__PURE__ */ jsx("span", { className: "font-semibold", children: entry.name })
        ] }),
        /* @__PURE__ */ jsxs(
          motion.button,
          {
            whileTap: { scale: 0.9 },
            onClick: handleUndo,
            className: "flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-background/15 text-background text-sm font-semibold shrink-0",
            children: [
              /* @__PURE__ */ jsx(Undo2, { className: "w-3.5 h-3.5" }),
              "Undo"
            ]
          }
        )
      ] })
    }
  ) });
}
const STEPS = [
  { id: "preparing", label: "Preparing photo", icon: Image },
  { id: "uploading", label: "Uploading", icon: Upload },
  { id: "analyzing", label: "AI analyzing", icon: Brain },
  { id: "extracting", label: "Extracting macros", icon: Sparkles }
];
function ScanStepper({ stage, elapsedMs }) {
  const activeIndex = STEPS.findIndex((s) => s.id === stage);
  const seconds = Math.floor(elapsedMs / 1e3);
  const showSlowHint = seconds >= 8;
  return /* @__PURE__ */ jsxs("div", { className: "w-full max-w-[280px]", children: [
    /* @__PURE__ */ jsx("div", { className: "space-y-2.5 mb-4", children: STEPS.map((step, i) => {
      const isDone = i < activeIndex;
      const isActive = i === activeIndex;
      const Icon = step.icon;
      return /* @__PURE__ */ jsxs(
        motion.div,
        {
          className: "flex items-center gap-3",
          initial: { opacity: 0, x: -8 },
          animate: { opacity: 1, x: 0 },
          transition: { delay: i * 0.05 },
          children: [
            /* @__PURE__ */ jsxs(
              "div",
              {
                className: `relative flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center transition-colors ${isDone ? "bg-primary text-primary-foreground" : isActive ? "bg-primary/15 text-primary" : "bg-muted/60 text-muted-foreground/50"}`,
                children: [
                  isDone ? /* @__PURE__ */ jsx(Check, { className: "w-3.5 h-3.5", strokeWidth: 3 }) : isActive ? /* @__PURE__ */ jsx(Loader2, { className: "w-3.5 h-3.5 animate-spin" }) : /* @__PURE__ */ jsx(Icon, { className: "w-3.5 h-3.5" }),
                  isActive && /* @__PURE__ */ jsx(
                    motion.span,
                    {
                      className: "absolute inset-0 rounded-full border-2 border-primary/40",
                      animate: { scale: [1, 1.4, 1.4], opacity: [0.6, 0, 0] },
                      transition: { duration: 1.6, repeat: Infinity, ease: "easeOut" }
                    }
                  )
                ]
              }
            ),
            /* @__PURE__ */ jsx(
              "span",
              {
                className: `text-[13.5px] font-medium transition-colors ${isDone ? "text-foreground/70" : isActive ? "text-foreground" : "text-muted-foreground/60"}`,
                children: step.label
              }
            )
          ]
        },
        step.id
      );
    }) }),
    /* @__PURE__ */ jsx("div", { className: "h-1 rounded-full bg-muted/60 overflow-hidden mb-3", children: /* @__PURE__ */ jsx(
      motion.div,
      {
        className: "h-full bg-primary rounded-full",
        initial: false,
        animate: { width: `${(activeIndex + 1) / STEPS.length * 100}%` },
        transition: { type: "spring", damping: 24, stiffness: 220 }
      }
    ) }),
    /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between text-[11px] text-muted-foreground", children: [
      /* @__PURE__ */ jsxs("span", { children: [
        "Step ",
        activeIndex + 1,
        " of ",
        STEPS.length
      ] }),
      /* @__PURE__ */ jsxs("span", { className: "tabular-nums", children: [
        seconds,
        "s"
      ] })
    ] }),
    showSlowHint && /* @__PURE__ */ jsx(
      motion.p,
      {
        className: "mt-3 text-[12px] text-muted-foreground text-center leading-relaxed",
        initial: { opacity: 0, y: 4 },
        animate: { opacity: 1, y: 0 },
        children: "Hang tight — this can take a moment on slower networks."
      }
    )
  ] });
}
const AddFoodDialog = lazy(() => import("./AddFoodDialog-DcIQxnVT.js").then((m) => ({
  default: m.AddFoodDialog
})));
const BarcodeScanner = lazy(() => import("./BarcodeScanner-sShrSNVJ.js").then((m) => ({
  default: m.BarcodeScanner
})));
const FoodPreview = lazy(() => import("./FoodPreview-PX-dm0cE.js").then((m) => ({
  default: m.FoodPreview
})));
const AIFoodPreview = lazy(() => import("./AIFoodPreview-q1ItmgGU.js").then((m) => ({
  default: m.AIFoodPreview
})));
const QuickAddPicker = lazy(() => import("./QuickAddPicker-DC8OIbgX.js").then((m) => ({
  default: m.QuickAddPicker
})));
const WeeklyChart = lazy(() => import("./WeeklyChart-BKGqz3ol.js").then((m) => ({
  default: m.WeeklyChart
})));
const EditEntrySheet = lazy(() => import("./EditEntrySheet-DRbf9XqH.js").then((m) => ({
  default: m.EditEntrySheet
})));
function Dashboard() {
  const {
    user,
    loading: authLoading
  } = useAuth();
  const navigate = useNavigate();
  const today = getTodayDate();
  const [entries, setEntries] = useState([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMealType, setDialogMealType] = useState("breakfast");
  const [quickAddMeal, setQuickAddMeal] = useState(null);
  const [goal, setGoal] = useState(2e3);
  const [macroGoals, setMacroGoals] = useState(() => getMacroGoalsLocal());
  const [loading, setLoading] = useState(true);
  const [guardReady, setGuardReady] = useState(false);
  const [showFirstRun, setShowFirstRun] = useState(false);
  useEffect(() => {
    if (guardReady && isFirstRunPending()) setShowFirstRun(true);
  }, [guardReady]);
  const [refreshing, setRefreshing] = useState(false);
  const [deletedEntry, setDeletedEntry] = useState(null);
  const [editingEntry, setEditingEntry] = useState(null);
  const [fastScanMode, setFastScanMode] = useState(() => {
    if (typeof window === "undefined") return false;
    return window.localStorage.getItem("zyra:fastScan") === "1";
  });
  const fastScanRef = useRef(fastScanMode);
  useEffect(() => {
    fastScanRef.current = fastScanMode;
    if (typeof window !== "undefined") {
      window.localStorage.setItem("zyra:fastScan", fastScanMode ? "1" : "0");
    }
  }, [fastScanMode]);
  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      navigate({
        to: "/welcome",
        replace: true
      });
      return;
    }
    supabase.from("user_profiles").select("onboarding_completed").eq("user_id", user.id).maybeSingle().then(({
      data
    }) => {
      if (!data?.onboarding_completed) {
        navigate({
          to: "/onboarding",
          replace: true
        });
      }
      setGuardReady(true);
    });
  }, [user, authLoading, navigate]);
  const [scannerOpen, setScannerOpen] = useState(false);
  const [scannedFood, setScannedFood] = useState(null);
  const [scanLoading, setScanLoading] = useState(false);
  const [scanError, setScanError] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [scanStage, setScanStage] = useState("preparing");
  const [scanStartedAt, setScanStartedAt] = useState(null);
  const [scanElapsedMs, setScanElapsedMs] = useState(0);
  useEffect(() => {
    if (!aiLoading || scanStartedAt == null) return;
    const id = window.setInterval(() => {
      setScanElapsedMs(Date.now() - scanStartedAt);
    }, 200);
    return () => window.clearInterval(id);
  }, [aiLoading, scanStartedAt]);
  const aiAbortRef = useRef(null);
  const [aiItems, setAiItems] = useState(null);
  const [aiImageUrl, setAiImageUrl] = useState("");
  const [aiError, setAiError] = useState(null);
  const [aiErrorRetryable, setAiErrorRetryable] = useState(false);
  const lastPhotoFileRef = useRef(null);
  const cameraInputRef = useRef(null);
  const [weeklyData, setWeeklyData] = useState([]);
  const [streak, setStreak] = useState(0);
  const refresh = useCallback(async () => {
    let hadCache = false;
    if (typeof window !== "undefined") {
      try {
        const cached = localStorage.getItem("zyrafit_entries");
        const cachedGoal = localStorage.getItem("zyrafit_goal");
        if (cached) {
          const all = JSON.parse(cached);
          setEntries(all.filter((e) => e.date === today));
          hadCache = true;
        }
        if (cachedGoal) setGoal(parseInt(cachedGoal, 10));
        if (hadCache) {
          setLoading(false);
          setRefreshing(true);
        }
      } catch {
      }
    }
    const [fetchedEntries, fetchedGoal, fetchedWeekly, fetchedStreak, fetchedMacros] = await Promise.all([getEntries(today), loadCalorieGoal(), getWeeklyHistory(), getLoggingStreak(), loadMacroGoals()]);
    setEntries(fetchedEntries);
    setGoal(fetchedGoal);
    setWeeklyData(fetchedWeekly);
    setStreak(fetchedStreak);
    setMacroGoals(fetchedMacros);
    setLoading(false);
    setRefreshing(false);
  }, [today]);
  useEffect(() => {
    refresh();
  }, [refresh]);
  const handleAdd = async (food) => {
    const created = await addEntry({
      ...food,
      date: today,
      source: food.source || "manual",
      barcode: food.barcode || null,
      photoUrl: food.photoUrl || null
    });
    setEntries((prev) => [...prev, created]);
  };
  const handleDelete = async (id) => {
    setEntries((prev) => prev.filter((e) => e.id !== id));
    const entry = await deleteEntry(id);
    if (entry) setDeletedEntry(entry);
  };
  const handleUndoDelete = useCallback(async () => {
    if (!deletedEntry) return;
    await restoreEntry(deletedEntry);
    setEntries((prev) => [...prev, deletedEntry]);
    setDeletedEntry(null);
  }, [deletedEntry]);
  const handleBarcodeScan = async (barcode) => {
    setScannerOpen(false);
    setScanLoading(true);
    setScanError(null);
    const {
      lookupBarcode
    } = await import("./barcode-api-BgOojJAX.js");
    const food = await lookupBarcode(barcode);
    setScanLoading(false);
    if (food) {
      setScannedFood(food);
    } else {
      setScanError(`No food found for barcode ${barcode}`);
      setTimeout(() => {
        setScanError(null);
        setDialogOpen(true);
      }, 2500);
    }
  };
  const handleAddFromScan = async (food) => {
    await handleAdd({
      ...food,
      source: "barcode"
    });
    setScannedFood(null);
  };
  const classifyAiError = (msg) => {
    const m = msg.toLowerCase();
    if (m.includes("rate limit") || m.includes("429") || m.includes("too many")) {
      return {
        friendly: "We're a little busy right now. Please try again in a moment.",
        retryable: true
      };
    }
    if (m.includes("api key") || m.includes("401") || m.includes("403") || m.includes("unauthorized")) {
      return {
        friendly: "Photo scanning is temporarily unavailable. Please try again shortly.",
        retryable: true
      };
    }
    if (m.includes("network") || m.includes("fetch") || m.includes("failed to fetch") || m.includes("offline")) {
      return {
        friendly: "Couldn't reach our servers. Check your connection and tap retry.",
        retryable: true
      };
    }
    if (m.includes("timeout") || m.includes("timed out")) {
      return {
        friendly: "That took too long. Tap retry to try again.",
        retryable: true
      };
    }
    if (m.includes("no food")) {
      return {
        friendly: "No food detected in this photo. Try a clearer shot.",
        retryable: false
      };
    }
    return {
      friendly: "Couldn't analyze this photo. Please try again.",
      retryable: true
    };
  };
  const handlePhotoCapture = async (file, fastOverride) => {
    const fast = fastScanRef.current;
    lastPhotoFileRef.current = file;
    if (typeof navigator !== "undefined" && !navigator.onLine) {
      try {
        const {
          captureImageAsBase64
        } = await import("./food-ai-CQBBSUQI.js");
        const {
          enqueueFoodScan
        } = await import("./router-L3bJVu16.js").then((n) => n.v);
        const {
          toast: toast2
        } = await import("sonner");
        const base64 = await captureImageAsBase64(file);
        const placeholder = await addEntry({
          name: "Analyzing photo…",
          calories: 0,
          protein: 0,
          carbs: 0,
          fat: 0,
          quantity: 1,
          mealType: dialogMealType,
          date: today,
          source: "ai",
          photoUrl: base64
        });
        await enqueueFoodScan({
          imageBase64: base64,
          mealType: dialogMealType,
          date: today,
          placeholderEntryId: placeholder.id
        });
        toast2("Photo queued — will analyze when back online", {
          description: "Added a placeholder to your meal log."
        });
        refresh();
      } catch (err) {
        setAiError(err instanceof Error ? err.message : "Couldn't queue photo");
        setAiErrorRetryable(true);
      }
      return;
    }
    const abortController = new AbortController();
    aiAbortRef.current = abortController;
    setAiLoading(true);
    setScanStage("preparing");
    setScanStartedAt(Date.now());
    setScanElapsedMs(0);
    setAiError(null);
    setAiErrorRetryable(false);
    try {
      const {
        logScan
      } = await import("./scan-debug-BSopg_nn.js");
      logScan(`scan started${fast ? " (fast)" : ""}`, "info", `online=${navigator.onLine} user=${user?.id ? "yes" : "no"}`);
      const {
        captureImageAsBase64,
        captureImageAsBase64Fast,
        analyzePhoto
      } = await import("./food-ai-CQBBSUQI.js");
      setScanStage("preparing");
      const base64 = fast ? await captureImageAsBase64Fast(file) : await captureImageAsBase64(file);
      setAiImageUrl(base64);
      setScanStage("uploading");
      const userId = user?.id;
      if (userId) {
        const fileName = `${userId}/${Date.now()}-${file.name}`;
        supabase.storage.from("food-photos").upload(fileName, file, {
          contentType: file.type
        }).then(() => {
        });
      }
      uploadedPhotoUrlRef.current = base64;
      if (abortController.signal.aborted) return;
      let result;
      try {
        setScanStage("analyzing");
        result = await analyzePhoto(base64, {
          fast
        });
        setScanStage("extracting");
      } catch (analyzeErr) {
        if (!navigator.onLine) {
          const {
            enqueueFoodScan
          } = await import("./router-L3bJVu16.js").then((n) => n.v);
          const {
            toast: toast2
          } = await import("sonner");
          const placeholder = await addEntry({
            name: "Analyzing photo…",
            calories: 0,
            protein: 0,
            carbs: 0,
            fat: 0,
            quantity: 1,
            mealType: dialogMealType,
            date: today,
            source: "ai",
            photoUrl: uploadedPhotoUrlRef.current || base64
          });
          await enqueueFoodScan({
            imageBase64: base64,
            mealType: dialogMealType,
            date: today,
            placeholderEntryId: placeholder.id
          });
          toast2("Photo queued — will analyze when back online");
          setAiLoading(false);
          setAiImageUrl("");
          refresh();
          return;
        }
        throw analyzeErr;
      }
      if (abortController.signal.aborted) return;
      setAiLoading(false);
      if (!result.is_food || result.items.length === 0) {
        setAiError("No food detected in this photo. Try again with a clearer shot.");
        setAiErrorRetryable(false);
        setTimeout(() => setAiError(null), 3e3);
      } else {
        setAiItems(result.items);
      }
    } catch (err) {
      if (abortController.signal.aborted) return;
      setAiLoading(false);
      setAiImageUrl("");
      const raw = err instanceof Error ? err.message : "AI analysis failed";
      const {
        logScan
      } = await import("./scan-debug-BSopg_nn.js");
      logScan("scan failed (caught)", "error", raw);
      const {
        friendly,
        retryable
      } = classifyAiError(raw);
      setAiError(friendly);
      setAiErrorRetryable(retryable);
      if (!retryable) setTimeout(() => setAiError(null), 3e3);
    }
  };
  const handleRetryAiPhoto = () => {
    const file = lastPhotoFileRef.current;
    setAiError(null);
    setAiErrorRetryable(false);
    if (file) handlePhotoCapture(file);
  };
  const handleDismissAiError = () => {
    setAiError(null);
    setAiErrorRetryable(false);
  };
  const handleCancelAiAnalysis = useCallback(() => {
    aiAbortRef.current?.abort();
    aiAbortRef.current = null;
    setAiLoading(false);
    setAiImageUrl("");
    setAiItems(null);
  }, []);
  const uploadedPhotoUrlRef = useRef(null);
  const handleAddFromAi = async (foods) => {
    const photoUrl = uploadedPhotoUrlRef.current;
    for (const food of foods) {
      await handleAdd({
        ...food,
        photoUrl: photoUrl || void 0
      });
    }
    setAiItems(null);
    setAiImageUrl("");
    uploadedPhotoUrlRef.current = null;
  };
  const totals = getDailyTotals(entries);
  const byMeal = getEntriesByMeal(entries);
  const mealTypes = ["breakfast", "lunch", "dinner", "snack"];
  if (loading || !guardReady) {
    return /* @__PURE__ */ jsx(DashboardSkeleton, {});
  }
  if (showFirstRun) {
    return /* @__PURE__ */ jsx(FirstRunSetup, { onDone: () => setShowFirstRun(false) });
  }
  return /* @__PURE__ */ jsx(PullToRefresh, { onRefresh: refresh, children: /* @__PURE__ */ jsxs("div", { className: "min-h-screen bg-background pb-28", children: [
    /* @__PURE__ */ jsx("div", { className: "px-6 pt-14 pb-2", children: /* @__PURE__ */ jsxs(motion.div, { initial: {
      opacity: 0,
      y: -10
    }, animate: {
      opacity: 1,
      y: 0
    }, className: "flex items-center justify-between", children: [
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 h-5", children: [
          /* @__PURE__ */ jsx("p", { className: "text-sm text-muted-foreground", children: "Today" }),
          /* @__PURE__ */ jsx(AnimatePresence, { children: refreshing && /* @__PURE__ */ jsxs(motion.div, { initial: {
            opacity: 0,
            x: -4
          }, animate: {
            opacity: 1,
            x: 0
          }, exit: {
            opacity: 0,
            x: -4
          }, transition: {
            duration: 0.2
          }, className: "flex items-center gap-1.5 text-[11px] text-muted-foreground/80", children: [
            /* @__PURE__ */ jsx(motion.span, { className: "inline-block w-2.5 h-2.5 rounded-full border-[1.5px] border-primary border-t-transparent", animate: {
              rotate: 360
            }, transition: {
              duration: 0.8,
              repeat: Infinity,
              ease: "linear"
            } }),
            /* @__PURE__ */ jsx("span", { children: "Refreshing…" })
          ] }, "refreshing") })
        ] }),
        /* @__PURE__ */ jsx("h1", { className: "text-2xl font-bold text-foreground", children: "Dashboard" })
      ] }),
      /* @__PURE__ */ jsx(StreakBadge, { streak })
    ] }) }),
    /* @__PURE__ */ jsx(motion.div, { className: "flex justify-center py-6", initial: {
      opacity: 0,
      scale: 0.9
    }, animate: {
      opacity: 1,
      scale: 1
    }, transition: {
      delay: 0.1
    }, children: /* @__PURE__ */ jsx(CalorieRing, { consumed: totals.calories, goal }) }),
    /* @__PURE__ */ jsxs(motion.div, { className: "px-6 mb-6 grid grid-cols-3 gap-2.5", initial: {
      opacity: 0,
      y: 20
    }, animate: {
      opacity: 1,
      y: 0
    }, transition: {
      delay: 0.2
    }, children: [
      /* @__PURE__ */ jsx(MacroCard, { label: "Protein", symbol: "P", current: totals.protein, goal: macroGoals.protein, color: "var(--color-protein)" }),
      /* @__PURE__ */ jsx(MacroCard, { label: "Carbs", symbol: "C", current: totals.carbs, goal: macroGoals.carbs, color: "var(--color-carbs)" }),
      /* @__PURE__ */ jsx(MacroCard, { label: "Fat", symbol: "F", current: totals.fat, goal: macroGoals.fat, color: "var(--color-fat)" })
    ] }),
    /* @__PURE__ */ jsx("div", { className: "px-6 mb-6", children: /* @__PURE__ */ jsx(Suspense, { fallback: /* @__PURE__ */ jsx("div", { className: "h-40 rounded-2xl bg-muted/40" }), children: /* @__PURE__ */ jsx(WeeklyChart, { data: weeklyData, goal }) }) }),
    /* @__PURE__ */ jsx("div", { className: "px-6 space-y-3", children: mealTypes.map((type, i) => /* @__PURE__ */ jsx(motion.div, { initial: {
      opacity: 0,
      y: 20
    }, animate: {
      opacity: 1,
      y: 0
    }, transition: {
      delay: 0.3 + i * 0.05
    }, children: /* @__PURE__ */ jsx(MealSection, { mealType: type, entries: byMeal[type], onDelete: handleDelete, onAdd: (meal) => setQuickAddMeal(meal), onUpdate: async (id, patch) => {
      setEntries((prev) => prev.map((e) => e.id === id ? {
        ...e,
        ...patch
      } : e));
      await updateEntry(id, patch);
    } }) }, type)) }),
    /* @__PURE__ */ jsx(BottomNav, { onAddClick: () => setQuickAddMeal("breakfast") }),
    /* @__PURE__ */ jsx(ReminderPrompt, { isAuthenticated: !!user }),
    /* @__PURE__ */ jsx("input", { ref: cameraInputRef, type: "file", accept: "image/*", ...typeof navigator !== "undefined" && /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent) ? {
      capture: "environment"
    } : {}, onChange: (e) => {
      const file = e.target.files?.[0];
      if (file) handlePhotoCapture(file);
      e.target.value = "";
    }, className: "hidden" }),
    /* @__PURE__ */ jsx(Suspense, { fallback: null, children: /* @__PURE__ */ jsx(QuickAddPicker, { mealType: quickAddMeal, onClose: () => setQuickAddMeal(null), fastScan: fastScanMode, onToggleFastScan: setFastScanMode, onAiPhoto: () => {
      const meal = quickAddMeal;
      setQuickAddMeal(null);
      if (meal) setDialogMealType(meal);
      requestAnimationFrame(() => cameraInputRef.current?.click());
    }, onBarcodeScan: () => {
      const meal = quickAddMeal;
      setQuickAddMeal(null);
      if (meal) setDialogMealType(meal);
      setScannerOpen(true);
    }, onManual: () => {
      const meal = quickAddMeal;
      setQuickAddMeal(null);
      if (meal) setDialogMealType(meal);
      setDialogOpen(true);
    } }) }),
    /* @__PURE__ */ jsx(Suspense, { fallback: null, children: /* @__PURE__ */ jsx(AddFoodDialog, { open: dialogOpen, onClose: () => setDialogOpen(false), onAdd: handleAdd, initialMealType: dialogMealType, onScanClick: () => {
      setDialogOpen(false);
      setScannerOpen(true);
    }, onAiClick: () => {
      setDialogOpen(false);
      requestAnimationFrame(() => cameraInputRef.current?.click());
    } }) }),
    scannerOpen && /* @__PURE__ */ jsx(Suspense, { fallback: null, children: /* @__PURE__ */ jsx(BarcodeScanner, { open: scannerOpen, onClose: () => setScannerOpen(false), onScan: handleBarcodeScan }) }),
    /* @__PURE__ */ jsx(Suspense, { fallback: null, children: /* @__PURE__ */ jsx(AnimatePresence, { children: scannedFood && /* @__PURE__ */ jsx(FoodPreview, { food: scannedFood, onAdd: handleAddFromScan, onBack: () => setScannedFood(null) }) }) }),
    /* @__PURE__ */ jsx(Suspense, { fallback: null, children: /* @__PURE__ */ jsx(AnimatePresence, { children: aiItems && /* @__PURE__ */ jsx(AIFoodPreview, { items: aiItems, imageUrl: aiImageUrl, onAdd: handleAddFromAi, onBack: () => {
      setAiItems(null);
      setAiImageUrl("");
    } }) }) }),
    /* @__PURE__ */ jsx(AnimatePresence, { children: (scanLoading || aiLoading) && /* @__PURE__ */ jsx(motion.div, { className: "fixed inset-0 z-50 bg-background/95 backdrop-blur-xl flex flex-col items-center justify-center px-8", initial: {
      opacity: 0
    }, animate: {
      opacity: 1
    }, exit: {
      opacity: 0
    }, children: aiLoading && aiImageUrl ? /* @__PURE__ */ jsxs(Fragment, { children: [
      /* @__PURE__ */ jsxs(motion.div, { className: "relative w-52 h-52 rounded-3xl overflow-hidden shadow-2xl shadow-primary/10 mb-8", initial: {
        scale: 0.85,
        opacity: 0
      }, animate: {
        scale: 1,
        opacity: 1
      }, transition: {
        type: "spring",
        damping: 20,
        stiffness: 200
      }, children: [
        /* @__PURE__ */ jsx("img", { src: aiImageUrl, alt: "Analyzing", className: "w-full h-full object-cover" }),
        /* @__PURE__ */ jsx(motion.div, { className: "absolute inset-0", style: {
          background: "linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.25) 50%, transparent 60%)"
        }, animate: {
          x: ["-100%", "200%"]
        }, transition: {
          duration: 1.8,
          repeat: Infinity,
          ease: "easeInOut",
          repeatDelay: 0.3
        } }),
        /* @__PURE__ */ jsx(motion.div, { className: "absolute left-0 right-0 h-0.5 bg-primary/70 shadow-[0_0_12px_var(--color-primary)]", animate: {
          top: ["0%", "100%", "0%"]
        }, transition: {
          duration: 2.5,
          repeat: Infinity,
          ease: "easeInOut"
        } })
      ] }),
      /* @__PURE__ */ jsx(ScanStepper, { stage: scanStage, elapsedMs: scanElapsedMs }),
      /* @__PURE__ */ jsx(motion.button, { initial: {
        opacity: 0,
        y: 10
      }, animate: {
        opacity: 1,
        y: 0
      }, transition: {
        delay: 1.5
      }, whileTap: {
        scale: 0.95
      }, onClick: handleCancelAiAnalysis, className: "mt-6 px-6 py-2.5 rounded-2xl bg-muted/80 text-muted-foreground text-sm font-medium border border-border/40 active:bg-muted", children: "Cancel" })
    ] }) : /* @__PURE__ */ jsxs(Fragment, { children: [
      /* @__PURE__ */ jsx(motion.div, { className: "w-14 h-14 rounded-full border-[3px] border-primary border-t-transparent", animate: {
        rotate: 360
      }, transition: {
        duration: 1,
        repeat: Infinity,
        ease: "linear"
      } }),
      /* @__PURE__ */ jsx("p", { className: "text-foreground font-medium mt-4", children: "Looking up food..." })
    ] }) }) }),
    /* @__PURE__ */ jsx(AnimatePresence, { children: (scanError || aiError) && /* @__PURE__ */ jsxs(motion.div, { className: "fixed top-16 inset-x-6 z-50 bg-destructive text-destructive-foreground rounded-2xl p-4 shadow-lg", initial: {
      opacity: 0,
      y: -20
    }, animate: {
      opacity: 1,
      y: 0
    }, exit: {
      opacity: 0,
      y: -20
    }, children: [
      /* @__PURE__ */ jsx("p", { className: "font-medium text-sm text-center", children: scanError || aiError }),
      scanError && /* @__PURE__ */ jsx("p", { className: "text-xs mt-1 opacity-80 text-center", children: "Opening manual entry..." }),
      aiError && aiErrorRetryable && /* @__PURE__ */ jsxs("div", { className: "flex gap-2 mt-3 justify-center", children: [
        /* @__PURE__ */ jsx("button", { onClick: handleRetryAiPhoto, className: "px-4 py-2 rounded-xl bg-destructive-foreground text-destructive text-sm font-semibold active:opacity-80", children: "Retry" }),
        /* @__PURE__ */ jsx("button", { onClick: handleDismissAiError, className: "px-4 py-2 rounded-xl bg-destructive-foreground/20 text-destructive-foreground text-sm font-medium active:opacity-80", children: "Dismiss" })
      ] })
    ] }) }),
    /* @__PURE__ */ jsx(UndoToast, { entry: deletedEntry, onUndo: handleUndoDelete, onDismiss: () => setDeletedEntry(null) }),
    /* @__PURE__ */ jsx(Suspense, { fallback: null, children: /* @__PURE__ */ jsx(EditEntrySheet, { entry: editingEntry, onClose: () => setEditingEntry(null), onSave: async (id, patch) => {
      await updateEntry(id, patch);
      refresh();
    } }) })
  ] }) });
}
export {
  Dashboard as component
};
