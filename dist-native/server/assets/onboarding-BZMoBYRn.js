import { jsxs, jsx, Fragment } from "react/jsx-runtime";
import { useNavigate, Link } from "@tanstack/react-router";
import { useState, useEffect, Suspense, lazy } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { h as hapticLight, c as hapticMedium, s as supabase } from "./router-L3bJVu16.js";
import { u as useAuth } from "./use-auth-gfzAGvwo.js";
import { a as GENDERS, G as GOALS, c as calculateMacros } from "./macro-calc-CwiqaSuT.js";
import { z as zyrafitIcon } from "./zyrafit-icon-ZHgf3VwX.js";
import { ArrowLeft, User, Ruler, Weight, Dumbbell, Target, AlertCircle, ArrowRight, Check } from "lucide-react";
function StepContainer({
  icon,
  title,
  subtitle,
  children
}) {
  return /* @__PURE__ */ jsxs("div", { className: "flex-1 flex flex-col", children: [
    /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3 mb-2", children: [
      /* @__PURE__ */ jsx("div", { className: "w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary", children: icon }),
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("h2", { className: "text-xl font-bold text-foreground", children: title }),
        /* @__PURE__ */ jsx("p", { className: "text-xs text-muted-foreground", children: subtitle })
      ] })
    ] }),
    /* @__PURE__ */ jsx("div", { className: "flex-1 flex flex-col justify-center py-6", children })
  ] });
}
const HealthStep = lazy(() => import("./HealthStep-331s-Hm3.js").then((m) => ({
  default: m.HealthStep
})));
const ResultsStep = lazy(() => import("./ResultsStep-BKFOlb3c.js").then((m) => ({
  default: m.ResultsStep
})));
const SignupStep = lazy(() => import("./SignupStep-BhUuC0sH.js").then((m) => ({
  default: m.SignupStep
})));
const NotificationsStep = lazy(() => import("./NotificationsStep-1gxCTD4h.js").then((m) => ({
  default: m.NotificationsStep
})));
const STEPS = ["gender", "age", "height", "weight", "workout", "goal", "obstacles", "health", "results", "signup", "notifications"];
const OBSTACLES = [{
  value: "time",
  label: "Not Enough Time",
  emoji: "⏰"
}, {
  value: "motivation",
  label: "Lack of Motivation",
  emoji: "😴"
}, {
  value: "diet",
  label: "Sticking to a Diet",
  emoji: "🍕"
}, {
  value: "knowledge",
  label: "Not Sure What to Do",
  emoji: "🤔"
}, {
  value: "consistency",
  label: "Staying Consistent",
  emoji: "📅"
}, {
  value: "stress",
  label: "Stress & Emotional Eating",
  emoji: "😰"
}];
const STORAGE_KEY = "zyrafit:onboarding-progress";
function loadProgress() {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}
function OnboardingPage() {
  const navigate = useNavigate();
  const {
    user
  } = useAuth();
  const [currentStep, setCurrentStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [hadSavedProgress, setHadSavedProgress] = useState(false);
  const [gender, setGender] = useState("");
  const [age, setAge] = useState("");
  const [height, setHeight] = useState("");
  const [weight, setWeight] = useState("");
  const [workoutDays, setWorkoutDays] = useState(3);
  const [goal, setGoal] = useState("");
  const [obstacles, setObstacles] = useState([]);
  const [appleHealth, setAppleHealth] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => {
    const saved = loadProgress();
    if (saved) {
      if (typeof saved.currentStep === "number") setCurrentStep(saved.currentStep);
      if (saved.gender) setGender(saved.gender);
      if (saved.age) setAge(saved.age);
      if (saved.height) setHeight(saved.height);
      if (saved.weight) setWeight(saved.weight);
      if (typeof saved.workoutDays === "number") setWorkoutDays(saved.workoutDays);
      if (saved.goal) setGoal(saved.goal);
      if (saved.obstacles) setObstacles(saved.obstacles);
      if (typeof saved.appleHealth === "boolean") setAppleHealth(saved.appleHealth);
      setHadSavedProgress((saved.currentStep ?? 0) > 0);
    }
    setHydrated(true);
  }, []);
  const step = STEPS[currentStep];
  const totalSteps = STEPS.length;
  const progress = (currentStep + 1) / totalSteps * 100;
  useEffect(() => {
    if (step === "goal") {
      import("./HealthStep-331s-Hm3.js");
      import("./ResultsStep-BKFOlb3c.js");
      import("./SignupStep-BhUuC0sH.js");
      import("./NotificationsStep-1gxCTD4h.js");
    }
  }, [step]);
  useEffect(() => {
    if (!hydrated) return;
    if (typeof window === "undefined") return;
    try {
      const data = {
        currentStep,
        gender,
        age,
        height,
        weight,
        workoutDays,
        goal,
        obstacles,
        appleHealth
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch {
    }
  }, [hydrated, currentStep, gender, age, height, weight, workoutDays, goal, obstacles, appleHealth]);
  const canProceed = () => {
    switch (step) {
      case "gender":
        return gender !== "";
      case "age":
        return age !== "" && parseInt(age) > 0 && parseInt(age) < 120;
      case "height":
        return height !== "" && parseFloat(height) > 50 && parseFloat(height) < 300;
      case "weight":
        return weight !== "" && parseFloat(weight) > 0;
      case "workout":
        return true;
      case "goal":
        return goal !== "";
      case "obstacles":
        return obstacles.length > 0;
      case "health":
        return true;
      case "results":
        return true;
      case "signup":
        return true;
      case "notifications":
        return true;
      default:
        return false;
    }
  };
  const saveProfile = async (userId) => {
    const {
      calories,
      protein,
      carbs,
      fat
    } = calculateMacros({
      age: parseInt(age),
      weight: parseFloat(weight),
      height: parseFloat(height),
      gender,
      workoutDays,
      goal
    });
    await Promise.all([supabase.from("user_profiles").upsert({
      user_id: userId,
      age: parseInt(age),
      weight_kg: parseFloat(weight),
      gender,
      workout_days_per_week: workoutDays,
      goal,
      obstacles: obstacles.join(", "),
      apple_health_connected: appleHealth,
      onboarding_completed: true
    }, {
      onConflict: "user_id"
    }), supabase.from("user_settings").upsert({
      user_id: userId,
      daily_calorie_goal: calories,
      protein_goal: protein,
      carbs_goal: carbs,
      fat_goal: fat
    }, {
      onConflict: "user_id"
    })]);
  };
  const clearProgress = () => {
    if (typeof window !== "undefined") {
      try {
        localStorage.removeItem(STORAGE_KEY);
      } catch {
      }
    }
  };
  const handleNext = async () => {
    hapticMedium();
    if (step === "health") {
      if (user) {
        setSaving(true);
        await saveProfile(user.id);
        clearProgress();
        setSaving(false);
        navigate({
          to: "/app"
        });
        return;
      }
    }
    if (currentStep < totalSteps - 1) {
      setCurrentStep((s) => s + 1);
    }
  };
  const handleBack = () => {
    hapticLight();
    if (currentStep > 0) {
      setCurrentStep((s) => s - 1);
    }
  };
  const toggleObstacle = (value) => {
    hapticLight();
    setObstacles((prev) => prev.includes(value) ? prev.filter((o) => o !== value) : [...prev, value]);
  };
  const handleAccountCreated = async (userId) => {
    await saveProfile(userId);
    clearProgress();
  };
  const slideVariants = {
    enter: {
      x: 60,
      opacity: 0
    },
    center: {
      x: 0,
      opacity: 1
    },
    exit: {
      x: -60,
      opacity: 0
    }
  };
  return /* @__PURE__ */ jsxs("div", { className: "min-h-screen bg-background flex flex-col", children: [
    /* @__PURE__ */ jsxs("div", { className: "px-6 pt-14 pb-4", children: [
      /* @__PURE__ */ jsx("div", { className: "flex items-center justify-center mb-4", children: /* @__PURE__ */ jsx("img", { src: zyrafitIcon, alt: "ZyraFit", className: "w-10 h-10 rounded-xl" }) }),
      /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between mb-3", children: [
        currentStep > 0 ? /* @__PURE__ */ jsx("button", { onClick: handleBack, className: "text-muted-foreground p-1", children: /* @__PURE__ */ jsx(ArrowLeft, { className: "w-5 h-5" }) }) : /* @__PURE__ */ jsx(Link, { to: "/welcome", className: "text-muted-foreground p-1", children: /* @__PURE__ */ jsx(ArrowLeft, { className: "w-5 h-5" }) }),
        /* @__PURE__ */ jsxs("span", { className: "text-xs text-muted-foreground font-medium", children: [
          currentStep + 1,
          " / ",
          totalSteps
        ] }),
        /* @__PURE__ */ jsx("div", { className: "w-7" })
      ] }),
      /* @__PURE__ */ jsx("div", { className: "h-1.5 rounded-full bg-muted overflow-hidden", children: /* @__PURE__ */ jsx(motion.div, { className: "h-full rounded-full bg-primary", animate: {
        width: `${progress}%`
      }, transition: {
        duration: 0.3
      } }) })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "flex-1 px-6 flex flex-col overflow-hidden", children: [
      /* @__PURE__ */ jsx(AnimatePresence, { mode: "wait", initial: false, children: /* @__PURE__ */ jsxs(motion.div, { variants: slideVariants, initial: "enter", animate: "center", exit: "exit", transition: {
        duration: 0.25
      }, className: "flex-1 flex flex-col min-h-0", children: [
        step === "gender" && /* @__PURE__ */ jsxs(StepContainer, { icon: /* @__PURE__ */ jsx(User, { className: "w-6 h-6" }), title: "What's your gender?", subtitle: "This helps us personalize your calorie goals", children: [
          /* @__PURE__ */ jsx("div", { className: "grid grid-cols-2 gap-3", children: GENDERS.map((g) => /* @__PURE__ */ jsx(OptionCard, { emoji: g.emoji, label: g.label, selected: gender === g.value, onClick: () => setGender(g.value) }, g.value)) }),
          hadSavedProgress && /* @__PURE__ */ jsx("button", { type: "button", onClick: () => {
            clearProgress();
            setGender("");
            setAge("");
            setHeight("");
            setWeight("");
            setWorkoutDays(3);
            setGoal("");
            setObstacles([]);
            setAppleHealth(false);
            setCurrentStep(0);
          }, className: "mt-6 mx-auto block text-xs text-muted-foreground hover:text-foreground underline underline-offset-4 transition-colors", children: "Start over" })
        ] }),
        step === "age" && /* @__PURE__ */ jsx(StepContainer, { icon: /* @__PURE__ */ jsx(User, { className: "w-6 h-6" }), title: "How old are you?", subtitle: "Age affects your metabolic rate", children: /* @__PURE__ */ jsxs("div", { className: "flex flex-col items-center gap-4", children: [
          /* @__PURE__ */ jsx("input", { type: "number", value: age, onChange: (e) => setAge(e.target.value), placeholder: "25", min: "10", max: "120", className: "w-32 text-center text-5xl font-bold bg-transparent text-foreground border-none outline-none placeholder:text-muted-foreground/30" }),
          /* @__PURE__ */ jsx("span", { className: "text-sm text-muted-foreground", children: "years old" })
        ] }) }),
        step === "height" && /* @__PURE__ */ jsx(StepContainer, { icon: /* @__PURE__ */ jsx(Ruler, { className: "w-6 h-6" }), title: "How tall are you?", subtitle: "Height helps us calculate your metabolism", children: /* @__PURE__ */ jsxs("div", { className: "flex flex-col items-center gap-4", children: [
          /* @__PURE__ */ jsx("input", { type: "number", value: height, onChange: (e) => setHeight(e.target.value), placeholder: "170", min: "50", max: "300", className: "w-32 text-center text-5xl font-bold bg-transparent text-foreground border-none outline-none placeholder:text-muted-foreground/30" }),
          /* @__PURE__ */ jsx("span", { className: "text-sm text-muted-foreground", children: "cm" })
        ] }) }),
        step === "weight" && /* @__PURE__ */ jsx(StepContainer, { icon: /* @__PURE__ */ jsx(Weight, { className: "w-6 h-6" }), title: "What's your weight?", subtitle: "We'll use this to calculate your needs", children: /* @__PURE__ */ jsxs("div", { className: "flex flex-col items-center gap-4", children: [
          /* @__PURE__ */ jsx("input", { type: "number", value: weight, onChange: (e) => setWeight(e.target.value), placeholder: "70", min: "20", max: "300", step: "0.1", className: "w-32 text-center text-5xl font-bold bg-transparent text-foreground border-none outline-none placeholder:text-muted-foreground/30" }),
          /* @__PURE__ */ jsx("span", { className: "text-sm text-muted-foreground", children: "kg" })
        ] }) }),
        step === "workout" && /* @__PURE__ */ jsx(StepContainer, { icon: /* @__PURE__ */ jsx(Dumbbell, { className: "w-6 h-6" }), title: "How often do you work out?", subtitle: "Days per week", children: /* @__PURE__ */ jsxs("div", { className: "flex flex-col items-center gap-6", children: [
          /* @__PURE__ */ jsx("span", { className: "text-6xl font-bold text-foreground", children: workoutDays }),
          /* @__PURE__ */ jsx("input", { type: "range", min: "0", max: "7", value: workoutDays, onChange: (e) => setWorkoutDays(parseInt(e.target.value)), className: "w-full accent-primary" }),
          /* @__PURE__ */ jsxs("div", { className: "flex justify-between w-full text-xs text-muted-foreground", children: [
            /* @__PURE__ */ jsx("span", { children: "0" }),
            /* @__PURE__ */ jsx("span", { children: "7" })
          ] })
        ] }) }),
        step === "goal" && /* @__PURE__ */ jsx(StepContainer, { icon: /* @__PURE__ */ jsx(Target, { className: "w-6 h-6" }), title: "What's your goal?", subtitle: "We'll tailor your daily targets", children: /* @__PURE__ */ jsx("div", { className: "space-y-3", children: GOALS.map((g) => /* @__PURE__ */ jsx(OptionCard, { emoji: g.emoji, label: g.label, selected: goal === g.value, onClick: () => setGoal(g.value), wide: true }, g.value)) }) }),
        step === "obstacles" && /* @__PURE__ */ jsx(StepContainer, { icon: /* @__PURE__ */ jsx(AlertCircle, { className: "w-6 h-6" }), title: "What's stopping you?", subtitle: "Select all that apply", children: /* @__PURE__ */ jsx("div", { className: "grid grid-cols-2 gap-3", children: OBSTACLES.map((o) => /* @__PURE__ */ jsx(OptionCard, { emoji: o.emoji, label: o.label, selected: obstacles.includes(o.value), onClick: () => toggleObstacle(o.value) }, o.value)) }) }),
        (step === "health" || step === "results" || step === "signup" || step === "notifications") && /* @__PURE__ */ jsxs(Suspense, { fallback: /* @__PURE__ */ jsx(StepFallback, {}), children: [
          step === "health" && /* @__PURE__ */ jsx(HealthStep, { appleHealth, setAppleHealth }),
          step === "results" && /* @__PURE__ */ jsx(ResultsStep, { age, weight, height, gender, workoutDays, goal }),
          step === "signup" && /* @__PURE__ */ jsx(SignupStep, { onAccountCreated: handleAccountCreated, onComplete: () => setCurrentStep((s) => s + 1) }),
          step === "notifications" && /* @__PURE__ */ jsx(NotificationsStep, { onDone: () => navigate({
            to: "/app"
          }) })
        ] })
      ] }, step) }),
      step !== "signup" && step !== "notifications" && /* @__PURE__ */ jsx("div", { className: "pb-10 pt-4", children: /* @__PURE__ */ jsx(motion.button, { onClick: handleNext, disabled: !canProceed() || saving, whileTap: {
        scale: 0.97
      }, className: "w-full flex items-center justify-center gap-2 py-4 rounded-2xl bg-primary text-primary-foreground font-semibold shadow-lg shadow-primary/25 disabled:opacity-40 transition-opacity", children: saving ? /* @__PURE__ */ jsx(motion.div, { className: "w-5 h-5 rounded-full border-2 border-primary-foreground border-t-transparent", animate: {
        rotate: 360
      }, transition: {
        duration: 1,
        repeat: Infinity,
        ease: "linear"
      } }) : /* @__PURE__ */ jsxs(Fragment, { children: [
        "Continue",
        /* @__PURE__ */ jsx(ArrowRight, { className: "w-4 h-4" })
      ] }) }) })
    ] })
  ] });
}
function StepFallback() {
  return /* @__PURE__ */ jsx("div", { className: "flex-1 flex items-center justify-center", children: /* @__PURE__ */ jsx(motion.div, { className: "w-8 h-8 rounded-full border-2 border-primary border-t-transparent", animate: {
    rotate: 360
  }, transition: {
    duration: 1,
    repeat: Infinity,
    ease: "linear"
  } }) });
}
function OptionCard({
  emoji,
  label,
  selected,
  onClick,
  wide
}) {
  return /* @__PURE__ */ jsxs("button", { onClick: () => {
    hapticLight();
    onClick();
  }, className: `flex items-center gap-3 p-4 rounded-2xl border-2 transition-all ${wide ? "w-full" : ""} ${selected ? "border-primary bg-primary/10 shadow-sm" : "border-border/50 bg-card hover:border-border"}`, children: [
    /* @__PURE__ */ jsx("span", { className: "text-2xl", children: emoji }),
    /* @__PURE__ */ jsx("span", { className: `font-medium ${selected ? "text-foreground" : "text-muted-foreground"}`, children: label }),
    selected && /* @__PURE__ */ jsx("div", { className: "ml-auto w-5 h-5 rounded-full bg-primary flex items-center justify-center", children: /* @__PURE__ */ jsx(Check, { className: "w-3 h-3 text-primary-foreground" }) })
  ] });
}
const onboarding = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  component: OnboardingPage
}, Symbol.toStringTag, { value: "Module" }));
export {
  StepContainer as S,
  onboarding as o
};
