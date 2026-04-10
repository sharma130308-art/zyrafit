import { useEffect, useRef, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Zap, ZapOff, ScanBarcode } from "lucide-react";

interface BarcodeScannerProps {
  open: boolean;
  onClose: () => void;
  onScan: (barcode: string) => void;
}

export function BarcodeScanner({ open, onClose, onScan }: BarcodeScannerProps) {
  const scannerRef = useRef<HTMLDivElement>(null);
  const html5QrCodeRef = useRef<any>(null);
  const [flashOn, setFlashOn] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [scanning, setScanning] = useState(false);
  const hasScannedRef = useRef(false);

  const stopScanner = useCallback(async () => {
    if (html5QrCodeRef.current) {
      try {
        const state = html5QrCodeRef.current.getState();
        if (state === 2) { // SCANNING
          await html5QrCodeRef.current.stop();
        }
      } catch {
        // ignore
      }
      try {
        html5QrCodeRef.current.clear();
      } catch {
        // ignore
      }
      html5QrCodeRef.current = null;
    }
  }, []);

  const startScanner = useCallback(async () => {
    if (!scannerRef.current || html5QrCodeRef.current) return;
    hasScannedRef.current = false;

    try {
      const { Html5Qrcode } = await import("html5-qrcode");

      const scannerId = "barcode-scanner-region";
      // Ensure element exists
      if (!document.getElementById(scannerId)) {
        const div = document.createElement("div");
        div.id = scannerId;
        scannerRef.current.appendChild(div);
      }

      const scanner = new Html5Qrcode(scannerId);
      html5QrCodeRef.current = scanner;

      await scanner.start(
        { facingMode: "environment" },
        {
          fps: 15,
          qrbox: { width: 280, height: 160 },
          aspectRatio: 1.0,
        },
        (decodedText: string) => {
          if (hasScannedRef.current) return;
          hasScannedRef.current = true;

          // Vibrate on success
          if (navigator.vibrate) {
            navigator.vibrate(100);
          }

          onScan(decodedText);
        },
        () => {
          // Scan failure - ignore, keep scanning
        }
      );

      setScanning(true);
      setError(null);
    } catch (err: any) {
      console.error("Scanner error:", err);
      if (err?.message?.includes("Permission")) {
        setError("Camera permission denied. Please allow camera access.");
      } else {
        setError("Unable to start camera. Please check permissions.");
      }
    }
  }, [onScan]);

  useEffect(() => {
    if (open) {
      // Small delay to let animation complete
      const timeout = setTimeout(startScanner, 400);
      return () => {
        clearTimeout(timeout);
        stopScanner();
        setScanning(false);
        setError(null);
        setFlashOn(false);
      };
    } else {
      stopScanner();
      setScanning(false);
    }
  }, [open, startScanner, stopScanner]);

  const toggleFlash = async () => {
    try {
      const scanner = html5QrCodeRef.current;
      if (scanner) {
        const capabilities = await scanner.getRunningTrackCameraCapabilities();
        if (capabilities?.torchFeature?.isSupported()) {
          await capabilities.torchFeature.apply(!flashOn);
          setFlashOn(!flashOn);
        }
      }
    } catch {
      // Flash not supported
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 bg-foreground"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          {/* Camera viewport */}
          <div ref={scannerRef} className="absolute inset-0 overflow-hidden">
            <style>{`
              #barcode-scanner-region video {
                width: 100% !important;
                height: 100% !important;
                object-fit: cover !important;
              }
              #barcode-scanner-region {
                width: 100%;
                height: 100%;
              }
              #barcode-scanner-region img[alt="Info icon"] { display: none !important; }
              #barcode-scanner-region div[style*="border"] { border: none !important; }
              #qr-shaded-region { border: none !important; }
            `}</style>
          </div>

          {/* Overlay UI */}
          <div className="absolute inset-0 pointer-events-none flex flex-col">
            {/* Top bar */}
            <div className="flex items-center justify-between px-5 pt-14 pb-4 pointer-events-auto">
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={() => { stopScanner(); onClose(); }}
                className="w-10 h-10 rounded-full bg-foreground/40 backdrop-blur-md flex items-center justify-center"
              >
                <X className="w-5 h-5 text-background" />
              </motion.button>

              <h2 className="text-base font-semibold text-background">Scan Barcode</h2>

              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={toggleFlash}
                className="w-10 h-10 rounded-full bg-foreground/40 backdrop-blur-md flex items-center justify-center"
              >
                {flashOn ? (
                  <Zap className="w-5 h-5 text-yellow-400" />
                ) : (
                  <ZapOff className="w-5 h-5 text-background" />
                )}
              </motion.button>
            </div>

            {/* Center scanning area */}
            <div className="flex-1 flex items-center justify-center">
              <div className="relative">
                {/* Scanning frame */}
                <div className="w-72 h-44 relative">
                  {/* Corner brackets */}
                  <div className="absolute top-0 left-0 w-8 h-8 border-t-3 border-l-3 border-primary rounded-tl-lg" />
                  <div className="absolute top-0 right-0 w-8 h-8 border-t-3 border-r-3 border-primary rounded-tr-lg" />
                  <div className="absolute bottom-0 left-0 w-8 h-8 border-b-3 border-l-3 border-primary rounded-bl-lg" />
                  <div className="absolute bottom-0 right-0 w-8 h-8 border-b-3 border-r-3 border-primary rounded-br-lg" />

                  {/* Scanning line animation */}
                  {scanning && (
                    <motion.div
                      className="absolute left-2 right-2 h-0.5 bg-primary/80 rounded-full shadow-[0_0_8px_var(--color-primary)]"
                      animate={{ top: ["10%", "90%", "10%"] }}
                      transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
                    />
                  )}
                </div>
              </div>
            </div>

            {/* Bottom info */}
            <div className="px-6 pb-12 pointer-events-auto">
              {error ? (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-destructive/90 backdrop-blur-md rounded-2xl p-4 text-center"
                >
                  <p className="text-destructive-foreground text-sm font-medium">{error}</p>
                  <button
                    onClick={() => { stopScanner(); onClose(); }}
                    className="mt-2 text-destructive-foreground/80 text-sm underline"
                  >
                    Go back
                  </button>
                </motion.div>
              ) : (
                <div className="bg-foreground/40 backdrop-blur-md rounded-2xl p-4 flex items-center gap-3">
                  <ScanBarcode className="w-6 h-6 text-background flex-shrink-0" />
                  <div>
                    <p className="text-background text-sm font-medium">
                      Point camera at a barcode
                    </p>
                    <p className="text-background/60 text-xs mt-0.5">
                      EAN, UPC, and other formats supported
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
