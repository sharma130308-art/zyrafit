import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";
import zyrafitLogo from "@/assets/zyrafit-logo.png";

interface SplashScreenProps {
  onFinish: () => void;
}

export function SplashScreen({ onFinish }: SplashScreenProps) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(false);
      setTimeout(onFinish, 250);
    }, 2500);
    return () => clearTimeout(timer);
  }, [onFinish]);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          className="absolute inset-0 z-[100] flex flex-col items-center justify-center"
          style={{ backgroundColor: "#ffffff" }}
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, scale: 1.08 }}
          transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
        >
          {/* Subtle gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-b from-white/[0.02] via-transparent to-primary/[0.08]" />

          {/* Logo mark with orbiting sparkles */}
          <motion.div
            className="relative mb-5"
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", damping: 20, stiffness: 200, delay: 0.1 }}
          >
            {/* Sparkle particles — fixed positions around the logo */}
            {[
              { x: -42, y: -38, size: 3, delay: 0.6, duration: 2.2 },
              { x: 48, y: -30, size: 2, delay: 0.9, duration: 2.6 },
              { x: 52, y: 36, size: 2.5, delay: 1.2, duration: 2.4 },
              { x: -50, y: 42, size: 2, delay: 0.75, duration: 2.8 },
              { x: -56, y: 4, size: 1.5, delay: 1.4, duration: 2.0 },
              { x: 58, y: 8, size: 1.5, delay: 1.0, duration: 2.5 },
              { x: -8, y: -54, size: 2, delay: 1.6, duration: 2.3 },
              { x: 12, y: 56, size: 1.5, delay: 0.85, duration: 2.7 },
            ].map((p, i) => (
              <motion.span
                key={i}
                className="absolute top-1/2 left-1/2 rounded-full bg-white pointer-events-none"
                style={{
                  width: p.size,
                  height: p.size,
                  marginLeft: -p.size / 2,
                  marginTop: -p.size / 2,
                  boxShadow: "0 0 6px 1px rgba(180, 220, 255, 0.9)",
                }}
                initial={{ opacity: 0, x: p.x * 0.6, y: p.y * 0.6, scale: 0 }}
                animate={{
                  opacity: [0, 1, 0],
                  scale: [0, 1, 0],
                  x: [p.x * 0.6, p.x, p.x * 0.6],
                  y: [p.y * 0.6, p.y, p.y * 0.6],
                }}
                transition={{
                  duration: p.duration,
                  repeat: Infinity,
                  ease: "easeInOut",
                  delay: p.delay,
                }}
              />
            ))}

            {/* Soft pulsing glow halo behind logo */}
            <motion.div
              className="absolute inset-0 rounded-[28px] -z-10"
              style={{
                background: "radial-gradient(circle, rgba(61,160,224,0.55) 0%, rgba(61,160,224,0.15) 45%, transparent 70%)",
                filter: "blur(20px)",
              }}
              animate={{
                opacity: [0.4, 0.85, 0.4],
                scale: [0.95, 1.15, 0.95],
              }}
              transition={{
                duration: 2.4,
                repeat: Infinity,
                ease: "easeInOut",
                delay: 0.3,
              }}
            />
            <motion.div
              className="w-48 h-32 relative flex items-center justify-center"
              animate={{
                filter: [
                  "drop-shadow(0 8px 24px rgba(61,160,224,0.25))",
                  "drop-shadow(0 12px 36px rgba(61,160,224,0.55))",
                  "drop-shadow(0 8px 24px rgba(61,160,224,0.25))",
                ],
              }}
              transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut", delay: 0.3 }}
            >
              <img src={zyrafitLogo} alt="ZyraFit" className="w-full h-full object-contain" />
            </motion.div>
          </motion.div>

          {/* App name removed — already part of the logo image */}

          {/* Tagline — letter-by-letter reveal */}
          <motion.p
            className="text-[13px] text-white/60 mt-1 font-medium tracking-wide relative z-10 flex"
            initial="hidden"
            animate="visible"
            transition={{ delayChildren: 0.55, staggerChildren: 0.025 }}
            aria-label="Eat smart. Live better."
          >
            {"Eat smart. Live better.".split("").map((char, i) => (
              <motion.span
                key={i}
                variants={{
                  hidden: { opacity: 0, y: 6, filter: "blur(4px)" },
                  visible: { opacity: 1, y: 0, filter: "blur(0px)" },
                }}
                transition={{ duration: 0.35, ease: [0.25, 0.46, 0.45, 0.94] }}
                style={{ display: "inline-block", whiteSpace: "pre" }}
              >
                {char}
              </motion.span>
            ))}
          </motion.p>

          {/* Minimal loading bar */}
          <motion.div
            className="mt-10 w-12 h-[3px] rounded-full bg-white/10 overflow-hidden relative z-10"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7 }}
          >
            <motion.div
              className="h-full bg-white/40 rounded-full"
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
