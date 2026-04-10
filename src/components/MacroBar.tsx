import { motion } from "framer-motion";

interface MacroBarProps {
  label: string;
  current: number;
  color: string;
  unit?: string;
}

export function MacroBar({ label, current, color, unit = "g" }: MacroBarProps) {
  return (
    <div className="flex-1 flex flex-col items-center gap-1.5">
      <div className="w-full h-2 rounded-full bg-muted overflow-hidden">
        <motion.div
          className="h-full rounded-full"
          style={{ backgroundColor: color }}
          initial={{ width: 0 }}
          animate={{ width: `${Math.min(100, current > 0 ? Math.max(5, (current / 200) * 100) : 0)}%` }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        />
      </div>
      <div className="text-center">
        <span className="text-sm font-semibold text-foreground">{Math.round(current)}{unit}</span>
        <p className="text-xs text-muted-foreground">{label}</p>
      </div>
    </div>
  );
}
