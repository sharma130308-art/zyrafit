import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Bell, BellOff, Loader2 } from "lucide-react";
import { toast } from "sonner";
import {
  getRemindersEnabled,
  isPreviewEnvironment,
  isPushSupported,
  subscribeToPush,
  unsubscribeFromPush,
} from "@/lib/push";

export function RemindersToggle() {
  const [enabled, setEnabled] = useState(false);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [supported, setSupported] = useState(false);
  const [preview, setPreview] = useState(false);

  useEffect(() => {
    setSupported(isPushSupported());
    setPreview(isPreviewEnvironment());
    getRemindersEnabled()
      .then(setEnabled)
      .finally(() => setLoading(false));
  }, []);

  const handleToggle = async () => {
    if (busy) return;
    setBusy(true);
    if (enabled) {
      const { ok, error } = await unsubscribeFromPush();
      if (ok) {
        setEnabled(false);
        toast.success("Reminders turned off");
      } else {
        toast.error(error || "Failed to disable");
      }
    } else {
      const { ok, error } = await subscribeToPush();
      if (ok) {
        setEnabled(true);
        toast.success("Reminders enabled — you'll get a daily nudge");
      } else {
        toast.error(error || "Failed to enable");
      }
    }
    setBusy(false);
  };

  if (loading) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.12 }}
      className="rounded-2xl bg-card p-5 shadow-sm border border-border/50"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            {enabled ? (
              <Bell className="w-5 h-5 text-primary" />
            ) : (
              <BellOff className="w-5 h-5 text-muted-foreground" />
            )}
          </div>
          <div>
            <h3 className="font-semibold text-card-foreground">Meal reminders</h3>
            <p className="text-xs text-muted-foreground">
              Daily nudges at breakfast, lunch & dinner
            </p>
          </div>
        </div>
        <button
          onClick={handleToggle}
          disabled={busy || !supported || preview}
          className={`relative w-12 h-7 rounded-full transition-colors disabled:opacity-50 ${
            enabled ? "bg-primary" : "bg-muted"
          }`}
          aria-label={enabled ? "Disable reminders" : "Enable reminders"}
        >
          <motion.div
            className="absolute top-0.5 w-6 h-6 rounded-full bg-white shadow flex items-center justify-center"
            animate={{ left: enabled ? 22 : 2 }}
            transition={{ type: "spring", stiffness: 500, damping: 30 }}
          >
            {busy && <Loader2 className="w-3 h-3 animate-spin text-primary" />}
          </motion.div>
        </button>
      </div>
      {!supported && (
        <p className="mt-3 text-xs text-muted-foreground">
          Notifications aren't supported in this browser.
        </p>
      )}
      {supported && preview && (
        <p className="mt-3 text-xs text-muted-foreground">
          Available in the published app — install ZyraFit to your home screen first.
        </p>
      )}
    </motion.div>
  );
}
