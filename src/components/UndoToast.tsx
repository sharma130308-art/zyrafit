import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Undo2 } from "lucide-react";
import { hapticLight } from "@/lib/haptics";
import type { FoodEntry } from "@/lib/food-store";
import { restoreEntry } from "@/lib/food-store";

interface UndoToastProps {
  entry: FoodEntry | null;
  onUndo: () => void;
  onDismiss: () => void;
}

const UNDO_TIMEOUT = 5000;

export function UndoToast({ entry, onUndo, onDismiss }: UndoToastProps) {
  const timerRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    if (!entry) return;
    timerRef.current = setTimeout(onDismiss, UNDO_TIMEOUT);
    return () => clearTimeout(timerRef.current);
  }, [entry, onDismiss]);

  const handleUndo = useCallback(() => {
    clearTimeout(timerRef.current);
    hapticLight();
    onUndo();
  }, [onUndo]);

  return (
    <AnimatePresence>
      {entry && (
        <motion.div
          initial={{ opacity: 0, y: 60, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.95 }}
          transition={{ type: "spring", stiffness: 400, damping: 30 }}
          className="fixed bottom-24 inset-x-0 z-50 flex justify-center px-6 pointer-events-none"
        >
          <div className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-foreground/90 backdrop-blur-xl shadow-2xl pointer-events-auto max-w-[340px] w-full">
            <p className="text-sm text-background font-medium flex-1 truncate">
              Deleted <span className="font-semibold">{entry.name}</span>
            </p>
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={handleUndo}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-background/15 text-background text-sm font-semibold shrink-0"
            >
              <Undo2 className="w-3.5 h-3.5" />
              Undo
            </motion.button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
