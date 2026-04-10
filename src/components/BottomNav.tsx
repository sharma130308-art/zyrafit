import { Link, useLocation } from "@tanstack/react-router";
import { Home, User } from "lucide-react";

export function BottomNav() {
  const location = useLocation();
  const path = location.pathname;

  return (
    <div className="fixed bottom-0 inset-x-0 z-30 bg-nav/80 backdrop-blur-xl border-t border-border/30">
      <div className="flex items-center justify-around py-1.5 pb-[max(0.5rem,env(safe-area-inset-bottom))]">
        <Link
          to="/"
          className={`flex flex-col items-center gap-0.5 px-4 py-1.5 transition-colors ${
            path === "/" ? "text-nav-active" : "text-nav-foreground"
          }`}
        >
          <Home className="w-6 h-6" strokeWidth={path === "/" ? 2.5 : 1.5} />
          <span className="text-[10px] font-semibold">Home</span>
        </Link>

        <Link
          to="/profile"
          className={`flex flex-col items-center gap-0.5 px-4 py-1.5 transition-colors ${
            path === "/profile" ? "text-nav-active" : "text-nav-foreground"
          }`}
        >
          <User className="w-6 h-6" strokeWidth={path === "/profile" ? 2.5 : 1.5} />
          <span className="text-[10px] font-semibold">Profile</span>
        </Link>
      </div>
    </div>
  );
}
