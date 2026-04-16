import { useRef, useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Zap, ZapOff, ImageIcon, ScanBarcode, Pencil, VideoOff } from "lucide-react";

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
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const galleryRef = useRef<HTMLInputElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [flashOn, setFlashOn] = useState(false);
  const [activeMode, setActiveMode] = useState<"scan" | "barcode" | "gallery" | "manual">("scan");
  const [cameraReady, setCameraReady] = useState(false);
  const [cameraError, setCameraError] = useState(false);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    setCameraReady(false);
  }, []);

  const startCamera = useCallback(async () => {
    setCameraError(false);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment", width: { ideal: 1920 }, height: { ideal: 1080 } },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        setCameraReady(true);
      }
    } catch {
      setCameraError(true);
    }
  }, []);

  useEffect(() => {
    if (open) {
      startCamera();
    } else {
      stopCamera();
    }
    return () => stopCamera();
  }, [open, startCamera, stopCamera]);

  // Toggle torch if supported
  useEffect(() => {
    const track = streamRef.current?.getVideoTracks()[0];
    if (track) {
      const capabilities = track.getCapabilities?.() as MediaTrackCapabilities & { torch?: boolean };
      if (capabilities?.torch) {
        track.applyConstraints({ advanced: [{ torch: flashOn } as any] }).catch(() => {});
      }
    }
  }, [flashOn]);

  const handleGalleryFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      stopCamera();
      onCapture(file);
      onClose();
    }
    e.target.value = "";
  };

  const handleShutter = () => {
    if (activeMode === "gallery") {
      galleryRef.current?.click();
      return;
    }

    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || !cameraReady) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(video, 0, 0);

    canvas.toBlob(
      (blob) => {
        if (blob) {
          const file = new File([blob], `scan-${Date.now()}.jpg`, { type: "image/jpeg" });
          stopCamera();
          onCapture(file);
          onClose();
        }
      },
      "image/jpeg",
      0.92
    );
  };

  const handleClose = () => {
    stopCamera();
    onClose();
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
          {/* Live camera feed */}
          <video
            ref={videoRef}
            className="absolute inset-0 w-full h-full object-cover"
            playsInline
            muted
            autoPlay
          />
          {/* Hidden canvas for capture */}
          <canvas ref={canvasRef} className="hidden" />

          {/* Fallback when camera not available */}
          {!cameraReady && (
            <div className="absolute inset-0 bg-neutral-900 flex items-center justify-center">
              {cameraError ? (
                <div className="flex flex-col items-center gap-3 text-white/60">
                  <VideoOff className="w-10 h-10" />
                  <p className="text-sm font-medium">Camera unavailable</p>
                  <p className="text-xs text-white/40">Use gallery to pick a photo</p>
                </div>
              ) : (
                <motion.div
                  className="w-10 h-10 rounded-full border-[3px] border-white/30 border-t-white/80"
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                />
              )}
            </div>
          )}

          {/* Top bar */}
          <div className="relative z-10 flex items-center justify-between px-4 pt-[max(3.5rem,env(safe-area-inset-top))] pb-3">
            <motion.button
              whileTap={{ scale: 0.85 }}
              onClick={handleClose}
              className="w-10 h-10 rounded-full bg-black/30 backdrop-blur-md flex items-center justify-center"
            >
              <X className="w-5 h-5 text-white" />
            </motion.button>

            <motion.button
              whileTap={{ scale: 0.85 }}
              className="w-10 h-10 rounded-full bg-black/30 backdrop-blur-md flex items-center justify-center"
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
                className="w-12 h-12 rounded-full bg-black/20 backdrop-blur-md flex items-center justify-center"
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
                onClick={handleShutter}
                className="relative w-[72px] h-[72px] rounded-full"
              >
                <div className="absolute inset-0 rounded-full border-[3px] border-white/90" />
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

          {/* Hidden gallery input */}
          <input
            ref={galleryRef}
            type="file"
            accept="image/*"
            onChange={handleGalleryFile}
            className="hidden"
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
