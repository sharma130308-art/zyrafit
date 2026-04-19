import { useEffect, useRef, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Zap, ZapOff, ScanBarcode, Keyboard, RotateCcw } from "lucide-react";
import { Capacitor } from "@capacitor/core";

interface BarcodeScannerProps {
  open: boolean;
  onClose: () => void;
  onScan: (barcode: string) => void;
}

const isNative = (() => {
  try {
    return Capacitor.isNativePlatform();
  } catch {
    return false;
  }
})();

export function BarcodeScanner({ open, onClose, onScan }: BarcodeScannerProps) {
  const scannerRef = useRef<HTMLDivElement>(null);
  const html5QrCodeRef = useRef<any>(null);
  const [flashOn, setFlashOn] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [scanning, setScanning] = useState(false);
  const [showManualInput, setShowManualInput] = useState(false);
  const [manualBarcode, setManualBarcode] = useState("");
  const hasScannedRef = useRef(false);
  const scannerIdRef = useRef(`barcode-scanner-${Date.now()}`);
  const nativeActiveRef = useRef(false);

  const stopScanner = useCallback(async () => {
    // Native (Capacitor) cleanup
    if (nativeActiveRef.current) {
      try {
        const { BarcodeScanner: MLKit } = await import(
          "@capacitor-mlkit/barcode-scanning"
        );
        try { await MLKit.stopScan(); } catch { /* ignore */ }
        try { await MLKit.removeAllListeners(); } catch { /* ignore */ }
      } catch {
        // ignore
      }
      // Restore page chrome — ML Kit hides body during scan
      document.documentElement.classList.remove("barcode-scanner-active");
      document.body.classList.remove("barcode-scanner-active");
      nativeActiveRef.current = false;
    }

    if (html5QrCodeRef.current) {
      try {
        const state = html5QrCodeRef.current.getState();
        if (state === 2) {
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
    // Clean up DOM element
    if (scannerRef.current) {
      const el = scannerRef.current.querySelector(`#${scannerIdRef.current}`);
      if (el) el.remove();
    }
  }, []);

  const startNativeScanner = useCallback(async () => {
    try {
      const { BarcodeScanner: MLKit, BarcodeFormat } = await import(
        "@capacitor-mlkit/barcode-scanning"
      );

      // ML Kit module install (Android only) + permission
      try {
        const { available } = await MLKit.isGoogleBarcodeScannerModuleAvailable();
        if (!available) {
          await MLKit.installGoogleBarcodeScannerModule();
        }
      } catch {
        // iOS doesn't need install; ignore on other failures
      }

      const perm = await MLKit.requestPermissions();
      if (perm.camera !== "granted" && perm.camera !== "limited") {
        setError("Camera permission denied. Please allow camera access.");
        return;
      }

      hasScannedRef.current = false;
      nativeActiveRef.current = true;

      // scan() opens ML Kit's full-screen native scanner UI and resolves
      // with the detected barcodes. Much simpler than the live-preview API.
      const result = await MLKit.scan({
        formats: [
          BarcodeFormat.Ean13,
          BarcodeFormat.Ean8,
          BarcodeFormat.UpcA,
          BarcodeFormat.UpcE,
          BarcodeFormat.Code128,
          BarcodeFormat.Code39,
          BarcodeFormat.Code93,
          BarcodeFormat.Itf,
        ],
      });

      nativeActiveRef.current = false;
      const code = result.barcodes?.[0]?.rawValue;
      if (code) {
        if (navigator.vibrate) navigator.vibrate(100);
        hasScannedRef.current = true;
        onScan(code);
      } else {
        // User cancelled the native scanner
        onClose();
      }
    } catch (err: any) {
      console.error("Native scanner error:", err);
      nativeActiveRef.current = false;
      setError("Native scanner failed. Try manual entry.");
      setShowManualInput(true);
    }
  }, [onScan, onClose]);

  const startScanner = useCallback(async () => {
    if (nativeActiveRef.current || html5QrCodeRef.current) return;

    // Use ML Kit on native iOS/Android (Capacitor shell)
    if (isNative) {
      return startNativeScanner();
    }

    if (!scannerRef.current) return;
    hasScannedRef.current = false;

    // Generate a fresh ID each time to avoid stale DOM conflicts
    const scannerId = `barcode-scanner-${Date.now()}`;
    scannerIdRef.current = scannerId;

    // Clean up any existing scanner elements
    if (scannerRef.current) {
      const existing = scannerRef.current.querySelectorAll('[id^="barcode-scanner-"]');
      existing.forEach(el => el.remove());
    }

    try {
      const { Html5Qrcode, Html5QrcodeSupportedFormats } = await import("html5-qrcode");

      const div = document.createElement("div");
      div.id = scannerId;
      scannerRef.current.appendChild(div);

      // Restrict to 1D product barcode formats — much faster + more reliable
      // than letting the lib try every QR/2D format on every frame.
      const formatsToSupport = [
        Html5QrcodeSupportedFormats.EAN_13,
        Html5QrcodeSupportedFormats.EAN_8,
        Html5QrcodeSupportedFormats.UPC_A,
        Html5QrcodeSupportedFormats.UPC_E,
        Html5QrcodeSupportedFormats.UPC_EAN_EXTENSION,
        Html5QrcodeSupportedFormats.CODE_128,
        Html5QrcodeSupportedFormats.CODE_39,
        Html5QrcodeSupportedFormats.ITF,
      ];

      const scanner = new Html5Qrcode(scannerId, {
        formatsToSupport,
        verbose: false,
      } as any);
      html5QrCodeRef.current = scanner;

      const viewportWidth = scannerRef.current?.clientWidth || window.innerWidth;
      const viewportHeight = scannerRef.current?.clientHeight || window.innerHeight;
      const boxWidth = Math.min(Math.floor(viewportWidth * 0.85), 480);
      const boxHeight = Math.min(Math.floor(viewportHeight * 0.30), 200);

      await scanner.start(
        { facingMode: "environment" },
        {
          fps: 15,
          qrbox: { width: boxWidth, height: boxHeight },
          disableFlip: true,
          experimentalFeatures: { useBarCodeDetectorIfSupported: true },
          videoConstraints: {
            facingMode: { ideal: "environment" },
            width: { ideal: 1920 },
            height: { ideal: 1080 },
          },
        } as any,
        (decodedText: string) => {
          if (hasScannedRef.current) return;
          hasScannedRef.current = true;

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
      const msg = String(err?.message || err || "");
      if (msg.includes("Permission") || msg.includes("NotAllowed")) {
        setError("Camera permission denied. Please allow camera access.");
      } else if (msg.includes("NotFound") || msg.includes("Requested device not found")) {
        setError("No camera found. Use manual entry below.");
        setShowManualInput(true);
      } else if (msg.includes("NotReadable") || msg.includes("in use")) {
        setError("Camera is in use by another app. Close it and retry.");
      } else {
        setError("Unable to start camera. Try manual entry.");
        setShowManualInput(true);
      }
    }
  }, [onScan, startNativeScanner]);

  useEffect(() => {
    if (open) {
      setShowManualInput(false);
      setManualBarcode("");
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

  const handleManualSubmit = () => {
    const trimmed = manualBarcode.trim();
    if (trimmed.length >= 4) {
      onScan(trimmed);
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
              [id^="barcode-scanner-"] video {
                width: 100% !important;
                height: 100% !important;
                object-fit: cover !important;
              }
              [id^="barcode-scanner-"] {
                width: 100%;
                height: 100%;
              }
              [id^="barcode-scanner-"] img[alt="Info icon"] { display: none !important; }
              [id^="barcode-scanner-"] div[style*="border"] { border: none !important; }
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
                <div className="w-72 h-44 relative">
                  <div className="absolute top-0 left-0 w-8 h-8 border-t-3 border-l-3 border-primary rounded-tl-lg" />
                  <div className="absolute top-0 right-0 w-8 h-8 border-t-3 border-r-3 border-primary rounded-tr-lg" />
                  <div className="absolute bottom-0 left-0 w-8 h-8 border-b-3 border-l-3 border-primary rounded-bl-lg" />
                  <div className="absolute bottom-0 right-0 w-8 h-8 border-b-3 border-r-3 border-primary rounded-br-lg" />

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
            <div className="px-6 pb-12 pointer-events-auto space-y-3">
              {error ? (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-destructive/90 backdrop-blur-md rounded-2xl p-4 flex items-center gap-3"
                >
                  <p className="text-destructive-foreground text-sm font-medium flex-1">{error}</p>
                  <motion.button
                    whileTap={{ scale: 0.9 }}
                    onClick={async () => {
                      setError(null);
                      setScanning(false);
                      await stopScanner();
                      setTimeout(startScanner, 300);
                    }}
                    className="px-3 py-1.5 rounded-xl bg-background text-foreground text-xs font-semibold flex items-center gap-1.5 shrink-0"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    Retry
                  </motion.button>
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

              {/* Manual barcode entry */}
              {showManualInput ? (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-foreground/40 backdrop-blur-md rounded-2xl p-4"
                >
                  <p className="text-background text-sm font-medium mb-2">Enter barcode manually</p>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      inputMode="numeric"
                      value={manualBarcode}
                      onChange={(e) => setManualBarcode(e.target.value)}
                      placeholder="e.g. 5901234123457"
                      className="flex-1 px-3 py-2.5 rounded-xl bg-background text-foreground text-sm placeholder:text-muted-foreground/50 outline-none"
                      autoFocus
                      onKeyDown={(e) => e.key === "Enter" && handleManualSubmit()}
                    />
                    <motion.button
                      whileTap={{ scale: 0.95 }}
                      onClick={handleManualSubmit}
                      disabled={manualBarcode.trim().length < 4}
                      className="px-4 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold disabled:opacity-50"
                    >
                      Go
                    </motion.button>
                  </div>
                </motion.div>
              ) : (
                <motion.button
                  whileTap={{ scale: 0.97 }}
                  onClick={() => setShowManualInput(true)}
                  className="w-full bg-foreground/25 backdrop-blur-md rounded-2xl p-3 flex items-center justify-center gap-2"
                >
                  <Keyboard className="w-4 h-4 text-background/70" />
                  <span className="text-background/70 text-sm font-medium">Enter barcode manually</span>
                </motion.button>
              )}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
