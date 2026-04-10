import { motion } from "framer-motion";

interface CalorieRingProps {
  consumed: number;
  goal: number;
}

export function CalorieRing({ consumed, goal }: CalorieRingProps) {
  const remaining = Math.max(0, goal - consumed);
  const percentage = Math.min((consumed / goal) * 100, 100);
  const overGoal = consumed > goal;

  const radius = 90;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

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
            remaining
          </span>
        </div>
      </div>

      <div className="flex gap-8 text-sm">
        <div className="flex flex-col items-center">
          <span className="text-lg font-bold text-foreground">{Math.round(consumed)}</span>
          <span className="text-xs text-muted-foreground">eaten</span>
        </div>
        <div className="h-10 w-px bg-border" />
        <div className="flex flex-col items-center">
          <span className="text-lg font-bold text-foreground">{goal}</span>
          <span className="text-xs text-muted-foreground">goal</span>
        </div>
      </div>
    </div>
  );
}
