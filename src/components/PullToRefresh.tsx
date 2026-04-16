import { useState, useCallback, useRef } from "react";
import { motion, useMotionValue, useTransform, animate } from "framer-motion";
import { hapticMedium } from "@/lib/haptics";

interface PullToRefreshProps {
  onRefresh: () => Promise<void>;
  children: React.ReactNode;
}

const THRESHOLD = 80;

export function PullToRefresh({ onRefresh, children }: PullToRefreshProps) {
  const [refreshing, setRefreshing] = useState(false);
  const pullY = useMotionValue(0);
  const isDragging = useRef(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const spinnerOpacity = useTransform(pullY, [0, THRESHOLD * 0.5, THRESHOLD], [0, 0.5, 1]);
  const spinnerScale = useTransform(pullY, [0, THRESHOLD], [0.5, 1]);
  const spinnerRotate = useTransform(pullY, [0, THRESHOLD * 2], [0, 360]);

  const handleDragStart = useCallback(() => {
    // Only allow pull if scrolled to top
    const el = containerRef.current;
    if (el && el.scrollTop > 0) return;
    isDragging.current = true;
  }, []);

  const handleDrag = useCallback(
    (_: any, info: { delta: { y: number } }) => {
      if (!isDragging.current || refreshing) return;
      const el = containerRef.current;
      if (el && el.scrollTop > 0) return;

      const newY = Math.max(0, pullY.get() + info.delta.y * 0.5);
      pullY.set(newY);

      if (newY >= THRESHOLD && pullY.getPrevious()! < THRESHOLD) {
        hapticMedium();
      }
    },
    [pullY, refreshing]
  );

  const handleDragEnd = useCallback(async () => {
    if (!isDragging.current) return;
    isDragging.current = false;

    if (pullY.get() >= THRESHOLD && !refreshing) {
      setRefreshing(true);
      animate(pullY, 50, { type: "spring", stiffness: 300, damping: 30 });
      try {
        await onRefresh();
      } finally {
        setRefreshing(false);
        animate(pullY, 0, { type: "spring", stiffness: 300, damping: 30 });
      }
    } else {
      animate(pullY, 0, { type: "spring", stiffness: 300, damping: 30 });
    }
  }, [pullY, refreshing, onRefresh]);

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
        <motion.div
          className="w-8 h-8 rounded-full border-[2.5px] border-primary border-t-transparent"
          style={{ rotate: refreshing ? undefined : spinnerRotate }}
          animate={refreshing ? { rotate: 360 } : undefined}
          transition={refreshing ? { duration: 0.8, repeat: Infinity, ease: "linear" } : undefined}
        />
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
