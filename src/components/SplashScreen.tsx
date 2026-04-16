import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";
import zyrafitIcon from "@/assets/zyrafit-icon.png";

interface SplashScreenProps {
  onFinish: () => void;
}

export function SplashScreen({ onFinish }: SplashScreenProps) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(false);
      setTimeout(onFinish, 250);
    }, 700);
    return () => clearTimeout(timer);
  }, [onFinish]);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          className="absolute inset-0 z-[100] flex flex-col items-center justify-center"
          style={{ backgroundColor: "#1a1b2f" }}
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, scale: 1.08 }}
          transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
        >
          {/* Subtle gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-b from-white/[0.02] via-transparent to-primary/[0.08]" />

          {/* Logo mark */}
          <motion.div
            className="relative mb-5"
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", damping: 20, stiffness: 200, delay: 0.1 }}
          >
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
              className="w-20 h-20 rounded-[22px] overflow-hidden shadow-[0_8px_32px_-4px] shadow-primary/20 relative border border-white/10"
              animate={{
                boxShadow: [
                  "0 8px 32px -4px rgba(61,160,224,0.25)",
                  "0 12px 40px -2px rgba(61,160,224,0.55)",
                  "0 8px 32px -4px rgba(61,160,224,0.25)",
                ],
              }}
              transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut", delay: 0.3 }}
            >
              {/* Shimmer effect */}
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent z-10"
                initial={{ x: "-100%" }}
                animate={{ x: "200%" }}
                transition={{ duration: 1, delay: 0.5, ease: "easeInOut" }}
              />
              <img src={zyrafitIcon} alt="ZyraFit" className="w-full h-full object-cover" />
            </motion.div>
          </motion.div>

          {/* App name */}
          <motion.h1
            className="text-[26px] font-black tracking-tight text-white relative z-10"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35, duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
          >
            ZyraFit
          </motion.h1>

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
