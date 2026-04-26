import { motion } from "framer-motion";

interface MacroCardProps {
  label: string;
  current: number;
  goal?: number;
  color: string; // CSS color (token var)
  /** Short letter shown in the badge (P / C / F) */
  symbol: string;
}

/**
 * Premium macro summary card. Shows current grams, goal (if set),
 * and a smooth progress bar tinted with the macro's color token.
 * Animates the value whenever `current` changes so additions feel instant.
 */
export function MacroCard({ label, current, goal, color, symbol }: MacroCardProps) {
  const rounded = Math.round(current);
  const hasGoal = typeof goal === "number" && goal > 0;
  const pct = hasGoal ? Math.min(100, (current / goal!) * 100) : 0;
  const remaining = hasGoal ? Math.max(0, Math.round(goal! - current)) : null;

  return (
    <motion.div
      layout
      className="relative flex-1 min-w-0 overflow-hidden rounded-2xl border border-border/60 bg-card p-3.5 shadow-sm"
      style={{
        backgroundImage: `linear-gradient(135deg, color-mix(in oklab, ${color} 10%, transparent) 0%, transparent 60%)`,
      }}
    >
      {/* Soft accent glow in corner */}
      <div
        aria-hidden
        className="pointer-events-none absolute -top-8 -right-8 h-20 w-20 rounded-full opacity-30 blur-2xl"
        style={{ backgroundColor: color }}
      />

      <div className="relative flex items-center justify-between">
        <span
          className="inline-flex h-6 w-6 items-center justify-center rounded-md text-[11px] font-bold text-white shadow-sm"
          style={{ backgroundColor: color }}
        >
          {symbol}
        </span>
        <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
          {label}
        </span>
      </div>

      <div className="relative mt-2.5 flex items-baseline gap-1">
        <motion.span
          key={rounded}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
          className="text-2xl font-bold tabular-nums text-foreground"
        >
          {rounded}
        </motion.span>
        <span className="text-xs font-medium text-muted-foreground">g</span>
        {hasGoal && (
          <span className="ml-auto text-[11px] font-medium tabular-nums text-muted-foreground">
            / {goal}g
          </span>
        )}
      </div>

      <div className="relative mt-2.5 h-1.5 w-full overflow-hidden rounded-full bg-muted/70">
        <motion.div
          className="h-full rounded-full"
          style={{
            backgroundImage: `linear-gradient(90deg, color-mix(in oklab, ${color} 70%, transparent), ${color})`,
          }}
          initial={{ width: 0 }}
          animate={{ width: `${hasGoal ? pct : current > 0 ? Math.min(100, Math.max(8, current / 2)) : 0}%` }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
        />
      </div>

      {hasGoal && (
        <p className="relative mt-1.5 text-[10px] text-muted-foreground">
          {remaining! > 0 ? `${remaining}g left` : "Goal hit 🎯"}
        </p>
      )}
    </motion.div>
  );
}
