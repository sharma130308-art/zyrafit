import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { loadCalorieGoal, saveCalorieGoal } from "@/lib/food-store";
import { useAuth } from "@/hooks/use-auth";
import { User, Target, LogOut, LogIn } from "lucide-react";
import { motion } from "framer-motion";
import { BottomNav } from "@/components/BottomNav";

export const Route = createFileRoute("/profile")({
  component: ProfilePage,
});

function ProfilePage() {
  const { user, loading: authLoading, signOut } = useAuth();
  const navigate = useNavigate();
  const [goal, setGoal] = useState(2000);
  const [editing, setEditing] = useState(false);
  const [tempGoal, setTempGoal] = useState("2000");

  useEffect(() => {
    loadCalorieGoal().then((g) => {
      setGoal(g);
      setTempGoal(String(g));
    });
  }, []);

  const handleSave = async () => {
    const newGoal = parseInt(tempGoal, 10);
    if (newGoal > 0) {
      await saveCalorieGoal(newGoal);
      setGoal(newGoal);
    }
    setEditing(false);
  };

  const handleSignOut = async () => {
    await signOut();
    navigate({ to: "/" });
  };

  return (
    <div className="min-h-screen bg-background pb-28">
      <div className="px-6 pt-14 pb-6">
        <h1 className="text-2xl font-bold text-foreground">Profile</h1>
      </div>

      <div className="px-6 space-y-4">
        {/* User card */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl bg-card p-6 shadow-sm border border-border/50 flex flex-col items-center gap-4"
        >
          <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center">
            <User className="w-10 h-10 text-primary" />
          </div>
          {user ? (
            <div className="text-center">
              <h2 className="text-lg font-semibold text-card-foreground">{user.email}</h2>
              <p className="text-sm text-muted-foreground">Syncing across devices</p>
            </div>
          ) : (
            <div className="text-center">
              <h2 className="text-lg font-semibold text-card-foreground">Guest</h2>
              <p className="text-sm text-muted-foreground">Sign in to sync your data</p>
            </div>
          )}
        </motion.div>

        {/* Calorie Goal */}
        <div className="rounded-2xl bg-card p-5 shadow-sm border border-border/50">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-calories/10 flex items-center justify-center">
              <Target className="w-5 h-5 text-calories" />
            </div>
            <div>
              <h3 className="font-semibold text-card-foreground">Daily Calorie Goal</h3>
              <p className="text-xs text-muted-foreground">Set your target intake</p>
            </div>
          </div>

          {editing ? (
            <div className="flex gap-2">
              <input
                type="number"
                value={tempGoal}
                onChange={(e) => setTempGoal(e.target.value)}
                className="flex-1 px-4 py-3 rounded-xl bg-muted text-foreground border-none outline-none focus:ring-2 focus:ring-primary/30"
                min="500"
                max="10000"
              />
              <button
                onClick={handleSave}
                className="px-5 py-3 rounded-xl bg-primary text-primary-foreground font-medium"
              >
                Save
              </button>
            </div>
          ) : (
            <button
              onClick={() => { setTempGoal(String(goal)); setEditing(true); }}
              className="w-full flex items-center justify-between px-4 py-3 rounded-xl bg-muted hover:bg-accent transition-colors"
            >
              <span className="text-foreground font-medium">{goal} calories</span>
              <span className="text-sm text-primary font-medium">Edit</span>
            </button>
          )}
        </div>

        {/* Auth action */}
        {!authLoading && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}>
            {user ? (
              <button
                onClick={handleSignOut}
                className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-destructive/10 text-destructive font-medium hover:bg-destructive/20 transition-colors"
              >
                <LogOut className="w-4 h-4" />
                Sign Out
              </button>
            ) : (
              <button
                onClick={() => navigate({ to: "/login" })}
                className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-primary text-primary-foreground font-semibold shadow-lg shadow-primary/25"
              >
                <LogIn className="w-4 h-4" />
                Sign In
              </button>
            )}
          </motion.div>
        )}
      </div>

      <BottomNav onAddClick={() => navigate({ to: "/" })} />
    </div>
  );
}
