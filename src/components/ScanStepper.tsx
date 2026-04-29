import { motion } from "framer-motion";
import { Check, Loader2, Image as ImageIcon, Upload, Brain, Sparkles } from "lucide-react";

export type ScanStage = "preparing" | "uploading" | "analyzing" | "extracting";

const STEPS: { id: ScanStage; label: string; icon: typeof ImageIcon }[] = [
  { id: "preparing", label: "Preparing photo", icon: ImageIcon },
  { id: "uploading", label: "Uploading", icon: Upload },
  { id: "analyzing", label: "AI analyzing", icon: Brain },
  { id: "extracting", label: "Extracting macros", icon: Sparkles },
];

interface ScanStepperProps {
  stage: ScanStage;
  elapsedMs: number;
}

export function ScanStepper({ stage, elapsedMs }: ScanStepperProps) {
  const activeIndex = STEPS.findIndex((s) => s.id === stage);
  const seconds = Math.floor(elapsedMs / 1000);
  const showSlowHint = seconds >= 8;

  return (
    <div className="w-full max-w-[280px]">
      <div className="space-y-2.5 mb-4">
        {STEPS.map((step, i) => {
          const isDone = i < activeIndex;
          const isActive = i === activeIndex;
          const Icon = step.icon;
          return (
            <motion.div
              key={step.id}
              className="flex items-center gap-3"
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
            >
              <div
                className={`relative flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center transition-colors ${
                  isDone
                    ? "bg-primary text-primary-foreground"
                    : isActive
                    ? "bg-primary/15 text-primary"
                    : "bg-muted/60 text-muted-foreground/50"
                }`}
              >
                {isDone ? (
                  <Check className="w-3.5 h-3.5" strokeWidth={3} />
                ) : isActive ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Icon className="w-3.5 h-3.5" />
                )}
                {isActive && (
                  <motion.span
                    className="absolute inset-0 rounded-full border-2 border-primary/40"
                    animate={{ scale: [1, 1.4, 1.4], opacity: [0.6, 0, 0] }}
                    transition={{ duration: 1.6, repeat: Infinity, ease: "easeOut" }}
                  />
                )}
              </div>
              <span
                className={`text-[13.5px] font-medium transition-colors ${
                  isDone
                    ? "text-foreground/70"
                    : isActive
                    ? "text-foreground"
                    : "text-muted-foreground/60"
                }`}
              >
                {step.label}
              </span>
            </motion.div>
          );
        })}
      </div>

      {/* Progress bar */}
      <div className="h-1 rounded-full bg-muted/60 overflow-hidden mb-3">
        <motion.div
          className="h-full bg-primary rounded-full"
          initial={false}
          animate={{ width: `${((activeIndex + 1) / STEPS.length) * 100}%` }}
          transition={{ type: "spring", damping: 24, stiffness: 220 }}
        />
      </div>

      <div className="flex items-center justify-between text-[11px] text-muted-foreground">
        <span>Step {activeIndex + 1} of {STEPS.length}</span>
        <span className="tabular-nums">{seconds}s</span>
      </div>

      {showSlowHint && (
        <motion.p
          className="mt-3 text-[12px] text-muted-foreground text-center leading-relaxed"
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
        >
          Hang tight — this can take a moment on slower networks.
        </motion.p>
      )}
    </div>
  );
}
