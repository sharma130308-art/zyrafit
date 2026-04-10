import { Link, useLocation } from "@tanstack/react-router";
import { Home, PlusCircle, User } from "lucide-react";

interface BottomNavProps {
  onAddClick: () => void;
}

export function BottomNav({ onAddClick }: BottomNavProps) {
  const location = useLocation();
  const path = location.pathname;

  return (
    <div className="fixed bottom-0 inset-x-0 z-30 bg-nav border-t border-border/50 backdrop-blur-xl">
      <div className="flex items-center justify-around py-2 pb-[max(0.5rem,env(safe-area-inset-bottom))]">
        <Link
          to="/"
          className={`flex flex-col items-center gap-0.5 px-4 py-1.5 rounded-xl transition-colors ${
            path === "/" ? "text-nav-active" : "text-nav-foreground"
          }`}
        >
          <Home className="w-6 h-6" />
          <span className="text-[10px] font-medium">Home</span>
        </Link>

        <button
          onClick={onAddClick}
          className="flex flex-col items-center gap-0.5 px-4 py-1.5 text-primary"
        >
          <div className="w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-lg -mt-6">
            <PlusCircle className="w-7 h-7" />
          </div>
          <span className="text-[10px] font-medium">Add</span>
        </button>

        <Link
          to="/profile"
          className={`flex flex-col items-center gap-0.5 px-4 py-1.5 rounded-xl transition-colors ${
            path === "/profile" ? "text-nav-active" : "text-nav-foreground"
          }`}
        >
          <User className="w-6 h-6" />
          <span className="text-[10px] font-medium">Profile</span>
        </Link>
      </div>
    </div>
  );
}
