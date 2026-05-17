import { Link, useLocation } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { Home, PlusCircle, User, Dumbbell } from "lucide-react";
import { hapticLight, hapticMedium } from "@/lib/haptics";

interface BottomNavProps {
  onAddClick: () => void;
}

export function BottomNav({ onAddClick }: BottomNavProps) {
  const location = useLocation();
  const path = location.pathname;
  const isHome = path === "/app" || path === "/";
  const isWorkouts = path === "/workouts";
  const isProfile = path === "/profile";

  return (
    <div className="fixed bottom-0 inset-x-0 z-30 bg-nav/80 backdrop-blur-2xl backdrop-saturate-150 border-t border-border/20">
      <div className="flex items-center justify-around py-1.5 pb-[max(0.5rem,env(safe-area-inset-bottom))]">
        <motion.div whileTap={{ scale: 0.85 }} transition={{ type: "spring", stiffness: 500, damping: 30 }}>
          <Link
            to="/app"
            onClick={() => hapticLight()}
            className={`relative flex flex-col items-center gap-0.5 px-3 py-1.5 transition-colors ${
              isHome ? "text-nav-active" : "text-nav-foreground"
            }`}
          >
            <Home className="w-6 h-6" strokeWidth={isHome ? 2.5 : 1.5} />
            <span className="text-[10px] font-semibold">Home</span>
            {isHome && (
              <span className="absolute bottom-1.5 w-1 h-1 rounded-full bg-nav-active" />
            )}
          </Link>
        </motion.div>

        <motion.button
          whileTap={{ scale: 0.85, rotate: -8 }}
          transition={{ type: "spring", stiffness: 500, damping: 25 }}
          onClick={() => { hapticMedium(); onAddClick(); }}
          className="relative -mt-7"
        >
          <div className="w-14 h-14 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-xl shadow-primary/30">
            <PlusCircle className="w-7 h-7" />
          </div>
        </motion.button>

        <motion.div whileTap={{ scale: 0.85 }} transition={{ type: "spring", stiffness: 500, damping: 30 }}>
          <Link
            to="/workouts"
            onClick={() => hapticLight()}
            className={`flex flex-col items-center gap-0.5 px-3 py-1.5 transition-colors ${
              isWorkouts ? "text-nav-active" : "text-nav-foreground"
            }`}
          >
            <Dumbbell className="w-6 h-6" strokeWidth={isWorkouts ? 2.5 : 1.5} />
            <span className="text-[10px] font-semibold">Workouts</span>
          </Link>
        </motion.div>

        <motion.div whileTap={{ scale: 0.85 }} transition={{ type: "spring", stiffness: 500, damping: 30 }}>
          <Link
            to="/profile"
            onClick={() => hapticLight()}
            className={`flex flex-col items-center gap-0.5 px-3 py-1.5 transition-colors ${
              isProfile ? "text-nav-active" : "text-nav-foreground"
            }`}
          >
            <User className="w-6 h-6" strokeWidth={isProfile ? 2.5 : 1.5} />
            <span className="text-[10px] font-semibold">Profile</span>
          </Link>
        </motion.div>

      </div>
    </div>
  );
}
