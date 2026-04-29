import { motion, AnimatePresence } from "framer-motion";
import { Camera, ScanBarcode, Pencil, X, Zap } from "lucide-react";
import type { MealType } from "@/lib/food-store";
import { MEAL_LABELS, MEAL_ICONS } from "@/lib/food-store";
import { hapticLight } from "@/lib/haptics";

interface QuickAddPickerProps {
  mealType: MealType | null;
  onClose: () => void;
  onAiPhoto: () => void;
  onBarcodeScan: () => void;
  onManual: () => void;
  fastScan?: boolean;
  onToggleFastScan?: (next: boolean) => void;
}

export function QuickAddPicker({
  mealType,
  onClose,
  onAiPhoto,
  onBarcodeScan,
  onManual,
  fastScan = false,
  onToggleFastScan,
}: QuickAddPickerProps) {
  if (!mealType) return null;

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 bg-foreground/15 backdrop-blur-md z-40"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      />
      <motion.div
        className="fixed inset-x-0 bottom-0 z-50 bg-card rounded-t-[28px] shadow-[0_-8px_40px_rgba(0,0,0,0.08)] p-6 pb-[max(1.5rem,env(safe-area-inset-bottom))]"
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        transition={{ type: "spring", damping: 28, stiffness: 300, mass: 0.8 }}
        drag="y"
        dragConstraints={{ top: 0 }}
        dragElastic={0.1}
        onDragEnd={(_, info) => { if (info.offset.y > 100) onClose(); }}
      >
        <div className="flex justify-center mb-3">
          <div className="w-10 h-1 rounded-full bg-muted-foreground/20" />
        </div>

        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <span className="text-xl">{MEAL_ICONS[mealType]}</span>
            <h2 className="text-lg font-bold text-card-foreground">Add to {MEAL_LABELS[mealType]}</h2>
          </div>
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={onClose}
            className="p-2 rounded-full bg-muted/60 text-muted-foreground"
          >
            <X className="w-5 h-5" />
          </motion.button>
        </div>

        <div className="flex gap-3">
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => { hapticLight(); onAiPhoto(); }}
            className="relative flex-1 flex flex-col items-center gap-2 py-5 rounded-2xl bg-primary text-primary-foreground font-semibold shadow-lg shadow-primary/25"
          >
            {fastScan && (
              <span className="absolute top-2 right-2 flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-primary-foreground/20 text-[9px] font-bold uppercase tracking-wide">
                <Zap className="w-2.5 h-2.5" />
                Fast
              </span>
            )}
            <Camera className="w-7 h-7" />
            <span className="text-[13px]">AI Photo</span>
          </motion.button>

          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => { hapticLight(); onBarcodeScan(); }}
            className="flex-1 flex flex-col items-center gap-2 py-5 rounded-2xl bg-muted/60 text-foreground font-semibold border border-border/30"
          >
            <ScanBarcode className="w-7 h-7" />
            <span className="text-[13px]">Barcode</span>
          </motion.button>

          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => { hapticLight(); onManual(); }}
            className="flex-1 flex flex-col items-center gap-2 py-5 rounded-2xl bg-muted/60 text-foreground font-semibold border border-border/30"
          >
            <Pencil className="w-7 h-7" />
            <span className="text-[13px]">Manual</span>
          </motion.button>
        </div>

        {onToggleFastScan && (
          <motion.button
            whileTap={{ scale: 0.98 }}
            onClick={() => { hapticLight(); onToggleFastScan(!fastScan); }}
            className={`mt-4 w-full flex items-center justify-between px-4 py-3 rounded-2xl border transition-colors ${
              fastScan
                ? "bg-primary/10 border-primary/30 text-foreground"
                : "bg-muted/40 border-border/30 text-foreground"
            }`}
          >
            <div className="flex items-center gap-2.5">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${fastScan ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
                <Zap className="w-4 h-4" />
              </div>
              <div className="text-left">
                <div className="text-[13px] font-semibold leading-tight">Fast Scan</div>
                <div className="text-[11px] text-muted-foreground leading-tight">
                  Quicker results, lower accuracy
                </div>
              </div>
            </div>
            <div className={`relative w-10 h-6 rounded-full transition-colors ${fastScan ? "bg-primary" : "bg-muted-foreground/30"}`}>
              <motion.div
                className="absolute top-0.5 w-5 h-5 rounded-full bg-white shadow"
                animate={{ left: fastScan ? "calc(100% - 1.25rem - 2px)" : "2px" }}
                transition={{ type: "spring", damping: 22, stiffness: 320 }}
              />
            </div>
          </motion.button>
        )}
      </motion.div>
    </AnimatePresence>
  );
}
