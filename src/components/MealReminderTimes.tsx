import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Clock, Loader2, Coffee, UtensilsCrossed, Moon, Apple } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { hapticLight, hapticSuccess } from "@/lib/haptics";
import { scheduleMealReminders, cancelMealReminders } from "@/lib/local-notifications";

interface Times {
  breakfast: string;
  lunch: string;
  dinner: string;
  snack: string;
  snackEnabled: boolean;
}

const DEFAULTS: Times = {
  breakfast: "08:00",
  lunch: "13:00",
  dinner: "19:00",
  snack: "16:00",
  snackEnabled: false,
};

const ROWS: Array<{
  key: keyof Omit<Times, "snackEnabled">;
  label: string;
  icon: React.ReactNode;
  toggleable?: boolean;
}> = [
  { key: "breakfast", label: "Breakfast", icon: <Coffee className="w-4 h-4" /> },
  { key: "lunch", label: "Lunch", icon: <UtensilsCrossed className="w-4 h-4" /> },
  { key: "dinner", label: "Dinner", icon: <Moon className="w-4 h-4" /> },
  { key: "snack", label: "Snack", icon: <Apple className="w-4 h-4" />, toggleable: true },
];

export function MealReminderTimes() {
  const { user } = useAuth();
  const [times, setTimes] = useState<Times>(DEFAULTS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }
    (async () => {
      const { data } = await (supabase.from("user_settings") as any)
        .select(
          "breakfast_time, lunch_time, dinner_time, snack_time, snack_reminder_enabled, reminders_enabled",
        )
        .eq("user_id", user.id)
        .maybeSingle();
      if (data) {
        setTimes({
          breakfast: (data.breakfast_time || "08:00:00").slice(0, 5),
          lunch: (data.lunch_time || "13:00:00").slice(0, 5),
          dinner: (data.dinner_time || "19:00:00").slice(0, 5),
          snack: (data.snack_time || "16:00:00").slice(0, 5),
          snackEnabled: !!data.snack_reminder_enabled,
        });
        setEnabled(!!data.reminders_enabled);
      }
      setLoading(false);
    })();
  }, [user]);

  const updateTime = (key: keyof Omit<Times, "snackEnabled">, value: string) => {
    hapticLight();
    setTimes((prev) => ({ ...prev, [key]: value }));
  };

  const toggleSnack = () => {
    hapticLight();
    setTimes((prev) => ({ ...prev, snackEnabled: !prev.snackEnabled }));
  };

  const save = async () => {
    if (!user) return;
    setSaving(true);
    const { error } = await (supabase.from("user_settings") as any)
      .update({
        breakfast_time: times.breakfast + ":00",
        lunch_time: times.lunch + ":00",
        dinner_time: times.dinner + ":00",
        snack_time: times.snack + ":00",
        snack_reminder_enabled: times.snackEnabled,
      })
      .eq("user_id", user.id);

    if (error) {
      toast.error("Couldn't save: " + error.message);
      setSaving(false);
      return;
    }

    // If reminders are on, also (re)schedule native local notifications
    if (enabled) {
      await scheduleMealReminders(times);
    } else {
      await cancelMealReminders();
    }

    hapticSuccess();
    toast.success("Reminder times saved");
    setSaving(false);
  };

  if (loading) return null;
  if (!user) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.14 }}
      className="rounded-2xl bg-card p-5 shadow-sm border border-border/50 space-y-4"
    >
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
          <Clock className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h3 className="font-semibold text-card-foreground">Reminder times</h3>
          <p className="text-xs text-muted-foreground">Pick when each nudge fires</p>
        </div>
      </div>

      <div className="space-y-2">
        {ROWS.map((row) => {
          const isSnack = row.key === "snack";
          const dimmed = isSnack && !times.snackEnabled;
          return (
            <div
              key={row.key}
              className={`flex items-center justify-between rounded-xl bg-muted/40 px-3 py-2.5 transition-opacity ${
                dimmed ? "opacity-50" : ""
              }`}
            >
              <div className="flex items-center gap-2.5 text-card-foreground">
                <span className="text-muted-foreground">{row.icon}</span>
                <span className="text-sm font-medium">{row.label}</span>
                {isSnack && (
                  <button
                    type="button"
                    onClick={toggleSnack}
                    className={`ml-1 text-[10px] px-2 py-0.5 rounded-full font-semibold ${
                      times.snackEnabled
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {times.snackEnabled ? "ON" : "OFF"}
                  </button>
                )}
              </div>
              <input
                type="time"
                value={times[row.key]}
                disabled={dimmed}
                onChange={(e) => updateTime(row.key, e.target.value)}
                className="bg-transparent text-card-foreground text-sm font-semibold tabular-nums focus:outline-none disabled:opacity-60"
              />
            </div>
          );
        })}
      </div>

      <button
        onClick={save}
        disabled={saving}
        className="w-full h-11 rounded-xl bg-primary text-primary-foreground font-semibold text-sm flex items-center justify-center gap-2 disabled:opacity-60"
      >
        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save times"}
      </button>
    </motion.div>
  );
}
