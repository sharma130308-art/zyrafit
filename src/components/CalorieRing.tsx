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
    <div className="flex flex-col items-center gap-2">
      <div className="relative w-56 h-56">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 200 200">
          <circle
            cx="100"
            cy="100"
            r={radius}
            fill="none"
            stroke="var(--color-muted)"
            strokeWidth="12"
          />
          <motion.circle
            cx="100"
            cy="100"
            r={radius}
            fill="none"
            stroke={overGoal ? "var(--color-destructive)" : "var(--color-calories)"}
            strokeWidth="12"
            strokeLinecap="round"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset }}
            transition={{ duration: 1, ease: "easeOut" }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <motion.span
            className="text-4xl font-bold text-foreground"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3 }}
          >
            {remaining}
          </motion.span>
          <span className="text-sm text-muted-foreground">remaining</span>
        </div>
      </div>
      <div className="flex gap-6 text-sm">
        <div className="flex flex-col items-center">
          <span className="font-semibold text-foreground">{consumed}</span>
          <span className="text-muted-foreground">eaten</span>
        </div>
        <div className="h-8 w-px bg-border" />
        <div className="flex flex-col items-center">
          <span className="font-semibold text-foreground">{goal}</span>
          <span className="text-muted-foreground">goal</span>
        </div>
      </div>
    </div>
  );
}
