import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";

interface SplashScreenProps {
  onFinish: () => void;
}

export function SplashScreen({ onFinish }: SplashScreenProps) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(false);
      setTimeout(onFinish, 400);
    }, 1400);
    return () => clearTimeout(timer);
  }, [onFinish]);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          className="absolute inset-0 z-[100] flex flex-col items-center justify-center bg-card"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, scale: 1.08 }}
          transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
        >
          {/* Subtle gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-primary/[0.03]" />

          {/* Logo mark */}
          <motion.div
            className="relative mb-5"
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", damping: 20, stiffness: 200, delay: 0.1 }}
          >
            <div className="w-20 h-20 rounded-[22px] bg-foreground/[0.04] flex items-center justify-center shadow-[0_8px_32px_-4px] shadow-foreground/5 relative overflow-hidden border border-foreground/[0.06]">
              {/* Shimmer effect */}
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-transparent via-foreground/[0.04] to-transparent"
                initial={{ x: "-100%" }}
                animate={{ x: "200%" }}
                transition={{ duration: 1, delay: 0.5, ease: "easeInOut" }}
              />
              <motion.span
                className="text-3xl relative z-10"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", damping: 12, stiffness: 200, delay: 0.3 }}
              >
                🔥
              </motion.span>
            </div>
          </motion.div>

          {/* App name */}
          <motion.h1
            className="text-[26px] font-black tracking-tight text-foreground relative z-10"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35, duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
          >
            CalTrack
          </motion.h1>

          {/* Tagline */}
          <motion.p
            className="text-[13px] text-muted-foreground mt-1 font-medium tracking-wide relative z-10"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.55, duration: 0.4 }}
          >
            Eat smart. Live better.
          </motion.p>

          {/* Minimal loading bar */}
          <motion.div
            className="mt-10 w-12 h-[3px] rounded-full bg-muted overflow-hidden relative z-10"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7 }}
          >
            <motion.div
              className="h-full bg-foreground/20 rounded-full"
              initial={{ width: "0%" }}
              animate={{ width: "100%" }}
              transition={{ duration: 0.7, delay: 0.75, ease: [0.4, 0, 0.2, 1] }}
            />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
