import { useRef, useCallback } from "react";
import { motion, useMotionValue, useTransform, animate, PanInfo } from "framer-motion";
import { Trash2 } from "lucide-react";
import { hapticHeavy } from "@/lib/haptics";

interface SwipeToDeleteProps {
  onDelete: () => void;
  children: React.ReactNode;
}

const DELETE_THRESHOLD = -80;

export function SwipeToDelete({ onDelete, children }: SwipeToDeleteProps) {
  const x = useMotionValue(0);
  const isDeleting = useRef(false);

  const bgOpacity = useTransform(x, [0, DELETE_THRESHOLD], [0, 1]);
  const iconScale = useTransform(x, [0, DELETE_THRESHOLD * 0.6, DELETE_THRESHOLD], [0.5, 0.8, 1]);
  const iconX = useTransform(x, [0, DELETE_THRESHOLD], [20, 0]);

  const handleDragEnd = useCallback(
    (_: any, info: PanInfo) => {
      if (x.get() <= DELETE_THRESHOLD && !isDeleting.current) {
        isDeleting.current = true;
        hapticHeavy();
        // Animate off-screen then delete
        animate(x, -400, {
          type: "spring",
          stiffness: 300,
          damping: 30,
          onComplete: () => onDelete(),
        });
      } else {
        animate(x, 0, { type: "spring", stiffness: 400, damping: 30 });
      }
    },
    [x, onDelete]
  );

  const handleDrag = useCallback(
    (_: any, info: PanInfo) => {
      // Trigger haptic when crossing threshold
      const prev = x.getPrevious() ?? 0;
      const curr = x.get();
      if (curr <= DELETE_THRESHOLD && prev > DELETE_THRESHOLD) {
        hapticHeavy();
      }
    },
    [x]
  );

  return (
    <div className="relative overflow-hidden">
      {/* Delete background */}
      <motion.div
        className="absolute inset-0 flex items-center justify-end pr-6 rounded-xl bg-destructive"
        style={{ opacity: bgOpacity }}
      >
        <motion.div style={{ scale: iconScale, x: iconX }}>
          <Trash2 className="w-5 h-5 text-destructive-foreground" />
        </motion.div>
      </motion.div>

      {/* Swipeable content */}
      <motion.div
        style={{ x }}
        drag="x"
        dragConstraints={{ left: -120, right: 0 }}
        dragElastic={{ left: 0.1, right: 0 }}
        onDrag={handleDrag}
        onDragEnd={handleDragEnd}
        className="relative bg-card z-10"
      >
        {children}
      </motion.div>
    </div>
  );
}
