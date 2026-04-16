import { useState, useCallback, useRef } from "react";
import { motion, useMotionValue, useTransform, animate, AnimatePresence } from "framer-motion";
import { hapticMedium, hapticSuccess } from "@/lib/haptics";
import { Check } from "lucide-react";

interface PullToRefreshProps {
  onRefresh: () => Promise<void>;
  children: React.ReactNode;
}

const THRESHOLD = 80;

export function PullToRefresh({ onRefresh, children }: PullToRefreshProps) {
  const [state, setState] = useState<"idle" | "refreshing" | "done">("idle");
  const pullY = useMotionValue(0);
  const isDragging = useRef(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const spinnerOpacity = useTransform(pullY, [0, THRESHOLD * 0.5, THRESHOLD], [0, 0.5, 1]);
  const spinnerScale = useTransform(pullY, [0, THRESHOLD], [0.5, 1]);
  const spinnerRotate = useTransform(pullY, [0, THRESHOLD * 2], [0, 360]);

  const handleDragStart = useCallback(() => {
    const el = containerRef.current;
    if (el && el.scrollTop > 0) return;
    isDragging.current = true;
  }, []);

  const handleDrag = useCallback(
    (_: any, info: { delta: { y: number } }) => {
      if (!isDragging.current || state !== "idle") return;
      const el = containerRef.current;
      if (el && el.scrollTop > 0) return;

      const newY = Math.max(0, pullY.get() + info.delta.y * 0.5);
      pullY.set(newY);

      if (newY >= THRESHOLD && (pullY.getPrevious() ?? 0) < THRESHOLD) {
        hapticMedium();
      }
    },
    [pullY, state]
  );

  const handleDragEnd = useCallback(async () => {
    if (!isDragging.current) return;
    isDragging.current = false;

    if (pullY.get() >= THRESHOLD && state === "idle") {
      setState("refreshing");
      animate(pullY, 50, { type: "spring", stiffness: 300, damping: 30 });
      try {
        await onRefresh();
      } finally {
        // Show checkmark
        setState("done");
        hapticSuccess();

        // Hold checkmark for 800ms then dismiss
        setTimeout(() => {
          setState("idle");
          animate(pullY, 0, { type: "spring", stiffness: 300, damping: 30 });
        }, 800);
      }
    } else {
      animate(pullY, 0, { type: "spring", stiffness: 300, damping: 30 });
    }
  }, [pullY, state, onRefresh]);

  return (
    <div ref={containerRef} className="relative overflow-y-auto min-h-screen">
      {/* Pull indicator */}
      <motion.div
        className="absolute left-1/2 -translate-x-1/2 z-20 flex items-center justify-center"
        style={{
          top: useTransform(pullY, (v) => v - 40),
          opacity: spinnerOpacity,
          scale: spinnerScale,
        }}
      >
        <AnimatePresence mode="wait">
          {state === "done" ? (
            <motion.div
              key="check"
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              transition={{ type: "spring", stiffness: 500, damping: 25 }}
              className="w-8 h-8 rounded-full bg-success flex items-center justify-center"
            >
              <motion.div
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
              >
                <Check className="w-5 h-5 text-success-foreground" strokeWidth={3} />
              </motion.div>
            </motion.div>
          ) : (
            <motion.div
              key="spinner"
              exit={{ scale: 0, opacity: 0 }}
              className="w-8 h-8 rounded-full border-[2.5px] border-primary border-t-transparent"
              style={{ rotate: state === "refreshing" ? undefined : spinnerRotate }}
              animate={state === "refreshing" ? { rotate: 360 } : undefined}
              transition={state === "refreshing" ? { duration: 0.8, repeat: Infinity, ease: "linear" } : { duration: 0.15 }}
            />
          )}
        </AnimatePresence>
      </motion.div>

      {/* Content */}
      <motion.div
        style={{ y: pullY }}
        onPointerDown={handleDragStart}
        onPan={handleDrag}
        onPanEnd={handleDragEnd}
      >
        {children}
      </motion.div>
    </div>
  );
}
