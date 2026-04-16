import { motion } from "framer-motion";
import { Flame } from "lucide-react";

interface StreakBadgeProps {
  streak: number;
}

export function StreakBadge({ streak }: StreakBadgeProps) {
  if (streak <= 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ type: "spring", stiffness: 400, damping: 20 }}
      className="flex items-center gap-1.5 px-3 py-1.5 rounded-2xl bg-gradient-to-r from-orange-500/10 to-amber-400/10 border border-orange-300/30"
    >
      <motion.div
        animate={{ y: [0, -2, 0] }}
        transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
      >
        <Flame className="w-4 h-4 text-orange-500" />
      </motion.div>
      <span className="text-sm font-bold text-orange-600">{streak}</span>
      <span className="text-xs text-orange-500/80 font-medium">
        {streak === 1 ? "day" : "days"}
      </span>
    </motion.div>
  );
}
