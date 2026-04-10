import { motion } from "framer-motion";

interface MacroBarProps {
  label: string;
  current: number;
  color: string;
  unit?: string;
}

export function MacroBar({ label, current, color, unit = "g" }: MacroBarProps) {
  return (
    <div className="flex-1 flex flex-col items-center gap-2">
      <motion.span
        className="text-lg font-bold text-foreground"
        key={current}
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
      >
        {Math.round(current)}
        <span className="text-xs font-normal text-muted-foreground">{unit}</span>
      </motion.span>
      <div className="w-full h-1.5 rounded-full bg-muted overflow-hidden">
        <motion.div
          className="h-full rounded-full"
          style={{ backgroundColor: color }}
          initial={{ width: 0 }}
          animate={{ width: `${Math.min(100, current > 0 ? Math.max(8, (current / 200) * 100) : 0)}%` }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        />
      </div>
      <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">{label}</span>
    </div>
  );
}
