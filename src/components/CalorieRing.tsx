import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import confetti from "canvas-confetti";
import { hapticSuccess } from "@/lib/haptics";

interface CalorieRingProps {
  consumed: number;
  goal: number;
  /** Calories burned through training; added to the daily allowance. */
  burned?: number;
}

export function CalorieRing({ consumed, goal, burned = 0 }: CalorieRingProps) {
  const effectiveGoal = goal + (burned > 0 ? burned : 0);
  const remaining = Math.max(0, effectiveGoal - consumed);
  const percentage = Math.min((consumed / effectiveGoal) * 100, 100);
  const overGoal = consumed > effectiveGoal;
  const hitGoal = consumed >= effectiveGoal;
  const [showCelebration, setShowCelebration] = useState(false);
  const hasCelebratedRef = useRef(false);

  const radius = 90;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  useEffect(() => {
    if (hitGoal && !hasCelebratedRef.current && consumed > 0) {
      hasCelebratedRef.current = true;
      setShowCelebration(true);
      hapticSuccess();

      // Fire confetti burst
      const duration = 2000;
      const end = Date.now() + duration;
      const colors = ["#06b6d4", "#3b82f6", "#8b5cf6", "#f59e0b", "#10b981"];

      const frame = () => {
        confetti({
          particleCount: 3,
          angle: 60,
          spread: 55,
          origin: { x: 0, y: 0.6 },
          colors,
        });
        confetti({
          particleCount: 3,
          angle: 120,
          spread: 55,
          origin: { x: 1, y: 0.6 },
          colors,
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

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="relative w-52 h-52">
        {/* Glow behind ring */}
        <div
          className="absolute inset-4 rounded-full blur-2xl opacity-20"
          style={{ backgroundColor: overGoal ? "var(--color-destructive)" : "var(--color-calories)" }}
        />
        <svg className="w-full h-full -rotate-90 relative z-10" viewBox="0 0 200 200">
          {/* Track */}
          <circle
            cx="100"
            cy="100"
            r={radius}
            fill="none"
            stroke="var(--color-muted)"
            strokeWidth="10"
          />
          {/* Progress */}
          <motion.circle
            cx="100"
            cy="100"
            r={radius}
            fill="none"
            stroke={overGoal ? "var(--color-destructive)" : "var(--color-calories)"}
            strokeWidth="10"
            strokeLinecap="round"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset }}
            transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center z-10">
          <motion.span
            className="text-5xl font-extrabold tracking-tight text-foreground"
            key={remaining}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            {Math.round(remaining)}
          </motion.span>
          <span className="text-xs font-medium tracking-wide uppercase text-muted-foreground mt-0.5">
            {hitGoal ? "complete!" : "remaining"}
          </span>
        </div>

        {/* Goal hit celebration pulse */}
        <AnimatePresence>
          {showCelebration && (
            <motion.div
              className="absolute inset-0 rounded-full z-0"
              style={{ border: "3px solid var(--color-calories)" }}
              initial={{ scale: 1, opacity: 0.8 }}
              animate={{ scale: 1.5, opacity: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 1.2, ease: "easeOut" }}
            />
          )}
        </AnimatePresence>
      </div>

      {/* Goal hit banner */}
      <AnimatePresence>
        {showCelebration && (
          <motion.p
            className="text-sm font-semibold text-primary"
            initial={{ opacity: 0, y: 10, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -5 }}
            transition={{ type: "spring", damping: 15 }}
          >
            🎉 Goal reached!
          </motion.p>
        )}
      </AnimatePresence>

      <div className="flex gap-6 text-sm">
        <div className="flex flex-col items-center">
          <span className="text-lg font-bold text-foreground">{Math.round(consumed)}</span>
          <span className="text-xs text-muted-foreground">eaten</span>
        </div>
        {burned > 0 && (
          <>
            <div className="h-10 w-px bg-border" />
            <div className="flex flex-col items-center">
              <span className="text-lg font-bold text-primary">{burned}</span>
              <span className="text-xs text-muted-foreground">burned</span>
            </div>
          </>
        )}
        <div className="h-10 w-px bg-border" />
        <div className="flex flex-col items-center">
          <span className="text-lg font-bold text-foreground">{effectiveGoal}</span>
          <span className="text-xs text-muted-foreground">goal</span>
        </div>
      </div>
    </div>
  );
}
