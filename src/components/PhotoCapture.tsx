import { useRef, useCallback } from "react";
import { motion } from "framer-motion";
import { Camera, Image, X } from "lucide-react";

interface PhotoCaptureProps {
  open: boolean;
  onClose: () => void;
  onCapture: (file: File) => void;
}

export function PhotoCapture({ open, onClose, onCapture }: PhotoCaptureProps) {
  const cameraRef = useRef<HTMLInputElement>(null);
  const galleryRef = useRef<HTMLInputElement>(null);

  if (!open) return null;

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onCapture(file);
      onClose();
    }
    // Reset value so the same file can be selected again
    e.target.value = "";
  };

  const handleCameraClick = () => {
    // Try camera input first; if it doesn't trigger a picker
    // (e.g. in iframes without camera permission), the user
    // can always use the Gallery button as fallback.
    if (cameraRef.current) {
      cameraRef.current.click();
    }
  };

  return (
    <>
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
        transition={{ type: "spring", damping: 32, stiffness: 350 }}
      >
        <div className="flex justify-center mb-3">
          <div className="w-10 h-1 rounded-full bg-muted-foreground/20" />
        </div>

        <div className="flex items-center justify-between mb-5">
          <h2 className="text-xl font-bold text-card-foreground">AI Food Scan</h2>
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={onClose}
            className="p-2 rounded-full bg-muted/60 text-muted-foreground"
          >
            <X className="w-5 h-5" />
          </motion.button>
        </div>

        <p className="text-sm text-muted-foreground mb-5">
          Take a photo of your meal and AI will estimate calories & macros instantly.
        </p>

        <div className="flex gap-3">
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={handleCameraClick}
            className="flex-1 flex flex-col items-center gap-2 py-5 rounded-2xl bg-primary text-primary-foreground font-semibold shadow-lg shadow-primary/25"
          >
            <Camera className="w-7 h-7" />
            <span className="text-[14px]">Take Photo</span>
          </motion.button>

          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={() => galleryRef.current?.click()}
            className="flex-1 flex flex-col items-center gap-2 py-5 rounded-2xl bg-muted/60 text-foreground font-semibold border border-border/30"
          >
            <Image className="w-7 h-7" />
            <span className="text-[14px]">Gallery</span>
          </motion.button>
        </div>

        {/* Camera input — uses capture on mobile, falls back to file picker on desktop */}
        <input
          ref={cameraRef}
          type="file"
          accept="image/*"
          capture="environment"
          onChange={handleFile}
          className="hidden"
        />
        {/* Gallery input — always opens file picker */}
        <input
          ref={galleryRef}
          type="file"
          accept="image/*"
          onChange={handleFile}
          className="hidden"
        />
      </motion.div>
    </>
  );
}
