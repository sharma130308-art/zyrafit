import { useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Zap, ZapOff, ImageIcon, ScanBarcode, Pencil } from "lucide-react";

interface PhotoCaptureProps {
  open: boolean;
  onClose: () => void;
  onCapture: (file: File) => void;
}

function ScanCorner({ position }: { position: "tl" | "tr" | "bl" | "br" }) {
  const corners: Record<string, string> = {
    tl: "top-0 left-0 border-t-[3px] border-l-[3px] rounded-tl-2xl",
    tr: "top-0 right-0 border-t-[3px] border-r-[3px] rounded-tr-2xl",
    bl: "bottom-0 left-0 border-b-[3px] border-l-[3px] rounded-bl-2xl",
    br: "bottom-0 right-0 border-b-[3px] border-r-[3px] rounded-br-2xl",
  };
  return (
    <motion.div
      className={`absolute w-14 h-14 border-white/80 ${corners[position]}`}
      initial={{ opacity: 0, scale: 0.7 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: 0.2, type: "spring", damping: 20 }}
    />
  );
}

export function PhotoCapture({ open, onClose, onCapture }: PhotoCaptureProps) {
  const cameraRef = useRef<HTMLInputElement>(null);
  const galleryRef = useRef<HTMLInputElement>(null);
  const [flashOn, setFlashOn] = useState(false);
  const [activeMode, setActiveMode] = useState<"scan" | "barcode" | "gallery" | "manual">("scan");

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onCapture(file);
      onClose();
    }
    e.target.value = "";
  };

  const handleCapture = () => {
    if (activeMode === "gallery") {
      galleryRef.current?.click();
    } else {
      cameraRef.current?.click();
    }
  };

  const modes = [
    { id: "scan" as const, label: "Scan Food", icon: "🍎" },
    { id: "barcode" as const, icon: <ScanBarcode className="w-[18px] h-[18px]" /> },
    { id: "gallery" as const, icon: <ImageIcon className="w-[18px] h-[18px]" /> },
    { id: "manual" as const, icon: <Pencil className="w-[18px] h-[18px]" /> },
  ];

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 bg-black flex flex-col"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
        >
          {/* Simulated camera background */}
          <div className="absolute inset-0 bg-gradient-to-b from-neutral-900 via-neutral-800 to-neutral-900">
            {/* Subtle grain texture */}
            <div className="absolute inset-0 opacity-[0.03]" style={{
              backgroundImage: "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='256' height='256' filter='url(%23n)' opacity='1'/%3E%3C/svg%3E\")",
            }} />
          </div>

          {/* Top bar */}
          <div className="relative z-10 flex items-center justify-between px-4 pt-[max(3.5rem,env(safe-area-inset-top))] pb-3">
            <motion.button
              whileTap={{ scale: 0.85 }}
              onClick={onClose}
              className="w-10 h-10 rounded-full bg-white/15 backdrop-blur-md flex items-center justify-center"
            >
              <X className="w-5 h-5 text-white" />
            </motion.button>

            <motion.button
              whileTap={{ scale: 0.85 }}
              className="w-10 h-10 rounded-full bg-white/15 backdrop-blur-md flex items-center justify-center"
            >
              <span className="text-white text-lg font-bold">?</span>
            </motion.button>
          </div>

          {/* Viewfinder area with scan corners */}
          <div className="relative z-10 flex-1 flex items-center justify-center px-10">
            <div className="relative w-full aspect-square max-w-[300px]">
              <ScanCorner position="tl" />
              <ScanCorner position="tr" />
              <ScanCorner position="bl" />
              <ScanCorner position="br" />

              {/* Scanning line animation */}
              <motion.div
                className="absolute left-4 right-4 h-[2px] bg-gradient-to-r from-transparent via-white/50 to-transparent rounded-full"
                animate={{ top: ["10%", "90%", "10%"] }}
                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
              />
            </div>
          </div>

          {/* Bottom controls */}
          <div className="relative z-10 pb-[max(2rem,env(safe-area-inset-bottom))]">
            {/* Mode selector pill */}
            <div className="flex justify-center mb-6">
              <motion.div
                className="flex items-center gap-1 bg-white/95 backdrop-blur-xl rounded-full px-1.5 py-1.5 shadow-lg shadow-black/20"
                initial={{ y: 30, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.15, type: "spring", damping: 22 }}
              >
                {modes.map((mode) => (
                  <motion.button
                    key={mode.id}
                    whileTap={{ scale: 0.92 }}
                    onClick={() => setActiveMode(mode.id)}
                    className={`flex items-center gap-1.5 px-3 py-2 rounded-full text-[13px] font-semibold transition-all ${
                      activeMode === mode.id
                        ? "bg-white text-neutral-900 shadow-sm"
                        : "text-neutral-500"
                    }`}
                  >
                    {typeof mode.icon === "string" ? (
                      <span className="text-sm">{mode.icon}</span>
                    ) : (
                      mode.icon
                    )}
                    {"label" in mode && mode.label && (
                      <span>{mode.label}</span>
                    )}
                  </motion.button>
                ))}
              </motion.div>
            </div>

            {/* Capture row */}
            <div className="flex items-center justify-center gap-10 px-8">
              {/* Flash toggle */}
              <motion.button
                whileTap={{ scale: 0.85 }}
                onClick={() => setFlashOn(!flashOn)}
                className="w-12 h-12 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center"
              >
                {flashOn ? (
                  <Zap className="w-5 h-5 text-yellow-400" />
                ) : (
                  <ZapOff className="w-5 h-5 text-white/70" />
                )}
              </motion.button>

              {/* Shutter button */}
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={handleCapture}
                className="relative w-[72px] h-[72px] rounded-full"
              >
                {/* Outer ring */}
                <div className="absolute inset-0 rounded-full border-[3px] border-white/90" />
                {/* Inner white circle */}
                <motion.div
                  className="absolute inset-[5px] rounded-full bg-white"
                  whileTap={{ scale: 0.92 }}
                  transition={{ type: "spring", damping: 15, stiffness: 400 }}
                />
              </motion.button>

              {/* Spacer for symmetry */}
              <div className="w-12 h-12" />
            </div>
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
      )}
    </AnimatePresence>
  );
}
