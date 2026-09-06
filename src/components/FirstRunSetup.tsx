import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Camera, Flame, Bell, ArrowRight } from "lucide-react";
import { hapticLight, hapticMedium } from "@/lib/haptics";

export const FIRST_RUN_KEY = "zyrafit:first-run-done";

export function isFirstRunPending(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return localStorage.getItem(FIRST_RUN_KEY) !== "1";
  } catch {
    return false;
  }
}

export function markFirstRunDone() {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(FIRST_RUN_KEY, "1");
  } catch {
    /* ignore */
  }
}

const SLIDES = [
  {
    icon: Camera,
    title: "Log a meal in seconds",
    body: "Snap a photo, scan a barcode, or just type what you ate — we work out the calories and macros for you.",
  },
  {
    icon: Flame,
    title: "Watch your day fill up",
    body: "Your ring shows how much of your daily target is left, and the macro cards break down protein, carbs and fat.",
  },
  {
    icon: Bell,
    title: "Gentle nudges, never spam",
    body: "Turn on meal reminders in your profile and we'll tap you on the shoulder at breakfast, lunch and dinner.",
  },
];

export function FirstRunSetup({ onDone }: { onDone: () => void }) {
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

  return (
    <div className="min-h-screen bg-background flex flex-col px-6 pt-16 pb-10">
      <div className="flex items-center justify-between">
        <div className="flex gap-1.5">
          {SLIDES.map((_, i) => (
            <span
              key={i}
              className={`h-1.5 rounded-full transition-all ${
                i === index ? "w-6 bg-primary" : "w-1.5 bg-muted"
              }`}
            />
          ))}
        </div>
        <button
          type="button"
          onClick={finish}
          className="text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          Skip
        </button>
      </div>

      <div className="flex-1 flex flex-col justify-center">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={index}
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -40 }}
            transition={{ duration: 0.25 }}
            className="text-center"
          >
            <div className="mx-auto w-16 h-16 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mb-6">
              <Icon className="w-7 h-7" />
            </div>
            <h1 className="text-2xl font-bold text-foreground mb-3">{slide.title}</h1>
            <p className="text-muted-foreground leading-relaxed max-w-xs mx-auto">{slide.body}</p>
          </motion.div>
        </AnimatePresence>
      </div>

      <motion.button
        whileTap={{ scale: 0.97 }}
        onClick={next}
        className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl bg-primary text-primary-foreground font-semibold shadow-lg shadow-primary/25"
      >
        {isLast ? "Start tracking" : "Next"}
        <ArrowRight className="w-4 h-4" />
      </motion.button>
    </div>
  );
}
