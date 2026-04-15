import { useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Camera, Image, X, Sparkles, Utensils } from "lucide-react";

interface PhotoCaptureProps {
  open: boolean;
  onClose: () => void;
  onCapture: (file: File) => void;
}

export function PhotoCapture({ open, onClose, onCapture }: PhotoCaptureProps) {
  const cameraRef = useRef<HTMLInputElement>(null);
  const galleryRef = useRef<HTMLInputElement>(null);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onCapture(file);
      onClose();
    }
    e.target.value = "";
  };

  const handleCameraClick = () => {
    cameraRef.current?.click();
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 bg-foreground/20 backdrop-blur-xl z-40"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            onClick={onClose}
          />

          {/* Sheet */}
          <motion.div
            className="fixed inset-x-0 bottom-0 z-50 bg-card rounded-t-[32px] shadow-[0_-12px_60px_rgba(0,0,0,0.12)] pb-[max(2rem,env(safe-area-inset-bottom))]"
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 300, mass: 0.8 }}
          >
            {/* Drag handle */}
            <div className="flex justify-center pt-3 pb-2">
              <div className="w-9 h-[5px] rounded-full bg-muted-foreground/15" />
            </div>

            <div className="px-6 pt-2">
              {/* Header */}
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center">
                    <Sparkles className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-card-foreground">AI Food Scan</h2>
                    <p className="text-xs text-muted-foreground">Instant calorie & macro detection</p>
                  </div>
                </div>
                <motion.button
                  whileTap={{ scale: 0.85 }}
                  onClick={onClose}
                  className="w-9 h-9 rounded-full bg-muted/50 flex items-center justify-center text-muted-foreground"
                >
                  <X className="w-4.5 h-4.5" />
                </motion.button>
              </div>

              {/* Illustration area */}
              <motion.div
                className="my-5 flex items-center justify-center"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.15, duration: 0.4, ease: "easeOut" }}
              >
                <div className="relative w-28 h-28">
                  {/* Outer ring */}
                  <div className="absolute inset-0 rounded-full border-2 border-dashed border-primary/20" />
                  {/* Inner circle */}
                  <div className="absolute inset-3 rounded-full bg-primary/8 flex items-center justify-center">
                    <Utensils className="w-10 h-10 text-primary/40" />
                  </div>
                  {/* Scanning pulse */}
                  <motion.div
                    className="absolute inset-0 rounded-full border-2 border-primary/30"
                    animate={{ scale: [1, 1.15, 1], opacity: [0.5, 0, 0.5] }}
                    transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
                  />
                </div>
              </motion.div>

              {/* Action buttons */}
              <div className="flex gap-3 mb-2">
                <motion.button
                  whileTap={{ scale: 0.96 }}
                  whileHover={{ scale: 1.01 }}
                  onClick={handleCameraClick}
                  className="flex-1 flex flex-col items-center gap-2.5 py-5 rounded-[20px] bg-primary text-primary-foreground font-semibold shadow-lg shadow-primary/30 relative overflow-hidden"
                >
                  {/* Subtle shine */}
                  <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent pointer-events-none" />
                  <div className="w-12 h-12 rounded-full bg-primary-foreground/15 flex items-center justify-center">
                    <Camera className="w-6 h-6" />
                  </div>
                  <span className="text-[14px] font-semibold">Take Photo</span>
                </motion.button>

                <motion.button
                  whileTap={{ scale: 0.96 }}
                  whileHover={{ scale: 1.01 }}
                  onClick={() => galleryRef.current?.click()}
                  className="flex-1 flex flex-col items-center gap-2.5 py-5 rounded-[20px] bg-muted/50 text-foreground font-semibold border border-border/30 relative overflow-hidden"
                >
                  <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
                    <Image className="w-6 h-6 text-muted-foreground" />
                  </div>
                  <span className="text-[14px] font-semibold">Gallery</span>
                </motion.button>
              </div>

              {/* Hint */}
              <motion.p
                className="text-center text-[11px] text-muted-foreground/50 mt-3"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
              >
                Snap your plate for instant nutritional breakdown
              </motion.p>
            </div>

            {/* Hidden file inputs */}
            <input
              ref={cameraRef}
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handleFile}
              className="hidden"
            />
            <input
              ref={galleryRef}
              type="file"
              accept="image/*"
              onChange={handleFile}
              className="hidden"
            />
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
