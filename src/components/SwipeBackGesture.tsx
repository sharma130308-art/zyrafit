import { useEffect, useRef, useState } from "react";
import { useRouter, useLocation } from "@tanstack/react-router";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft } from "lucide-react";

const EDGE_WIDTH = 24; // px from left edge to start
const TRIGGER_DISTANCE = 80; // px to trigger back

/**
 * iOS-style swipe-from-left-edge to go back.
 * Mounted globally; no-op on root-level routes where history has no back entry within app.
 */
export function SwipeBackGesture() {
  const router = useRouter();
  const location = useLocation();
  const [dragX, setDragX] = useState(0);
  const [active, setActive] = useState(false);
  const startX = useRef(0);
  const startY = useRef(0);
  const tracking = useRef(false);
  const horizontal = useRef(false);

  // Don't enable on top-level entry routes
  const disabled =
    location.pathname === "/" ||
    location.pathname === "/welcome" ||
    location.pathname === "/login" ||
    location.pathname === "/onboarding";

  useEffect(() => {
    if (disabled) return;

    const onPointerDown = (e: PointerEvent) => {
      if (e.pointerType === "mouse") return; // touch/pen only
      if (e.clientX > EDGE_WIDTH) return;
      tracking.current = true;
      horizontal.current = false;
      startX.current = e.clientX;
      startY.current = e.clientY;
    };

    const onPointerMove = (e: PointerEvent) => {
      if (!tracking.current) return;
      const dx = e.clientX - startX.current;
      const dy = e.clientY - startY.current;

      if (!horizontal.current) {
        if (Math.abs(dx) < 8 && Math.abs(dy) < 8) return;
        if (Math.abs(dy) > Math.abs(dx)) {
          tracking.current = false;
          return;
        }
        horizontal.current = true;
        setActive(true);
      }

      if (dx > 0) {
        setDragX(Math.min(dx, window.innerWidth));
        e.preventDefault();
      }
    };

    const onPointerUp = () => {
      if (!tracking.current) return;
      const triggered = dragXRef.current >= TRIGGER_DISTANCE;
      tracking.current = false;
      horizontal.current = false;
      setActive(false);
      setDragX(0);
      if (triggered) {
        try {
          navigator?.vibrate?.(12);
        } catch {
          // ignore
        }
        router.history.back();
      }
    };

    document.addEventListener("pointerdown", onPointerDown, { passive: true });
    document.addEventListener("pointermove", onPointerMove, { passive: false });
    document.addEventListener("pointerup", onPointerUp, { passive: true });
    document.addEventListener("pointercancel", onPointerUp, { passive: true });

    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("pointermove", onPointerMove);
      document.removeEventListener("pointerup", onPointerUp);
      document.removeEventListener("pointercancel", onPointerUp);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [disabled, router]);

  // Track latest dragX for pointerup closure
  const dragXRef = useRef(0);
  useEffect(() => {
    dragXRef.current = dragX;
  }, [dragX]);

  if (disabled) return null;

  const progress = Math.min(dragX / TRIGGER_DISTANCE, 1);

  return (
    <AnimatePresence>
      {active && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: progress }}
          exit={{ opacity: 0 }}
          className="fixed top-1/2 -translate-y-1/2 z-[100] pointer-events-none"
          style={{
            left: Math.max(8, dragX - 40),
          }}
        >
          <div className="flex items-center justify-center w-12 h-12 rounded-full bg-foreground/80 backdrop-blur-md shadow-lg">
            <ChevronLeft className="w-6 h-6 text-background" />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
