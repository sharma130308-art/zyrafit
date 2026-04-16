import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Bell, X } from "lucide-react";
import { toast } from "sonner";
import {
  hasShownPrompt,
  isPreviewEnvironment,
  isPushSupported,
  markPromptShown,
  subscribeToPush,
} from "@/lib/push";

interface Props {
  isAuthenticated: boolean;
}

export function ReminderPrompt({ isAuthenticated }: Props) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) return;
    if (!isPushSupported()) return;
    if (isPreviewEnvironment()) return;
    if (hasShownPrompt()) return;
    if (typeof Notification !== "undefined" && Notification.permission !== "default") {
      // Already granted or denied — skip the prompt
      markPromptShown();
      return;
    }
    const t = setTimeout(() => setOpen(true), 1500);
    return () => clearTimeout(t);
  }, [isAuthenticated]);

  const close = () => {
    markPromptShown();
    setOpen(false);
  };

  const handleEnable = async () => {
    setBusy(true);
    const { ok, error } = await subscribeToPush();
    setBusy(false);
    if (ok) {
      toast.success("Meal reminders enabled");
    } else if (error) {
      toast.error(error);
    }
    close();
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 30 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          className="fixed bottom-24 left-4 right-4 z-40 mx-auto max-w-[400px] rounded-2xl bg-card border border-border shadow-2xl p-4"
        >
          <button
            onClick={close}
            className="absolute top-2 right-2 p-1.5 rounded-full text-muted-foreground hover:bg-muted"
            aria-label="Dismiss"
          >
            <X className="w-4 h-4" />
          </button>
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
              <Bell className="w-5 h-5 text-primary" />
            </div>
            <div className="flex-1 pr-6">
              <h3 className="font-semibold text-card-foreground">Stay on track</h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Get gentle reminders at breakfast, lunch, and dinner — only if you haven't logged yet.
              </p>
            </div>
          </div>
          <div className="flex gap-2 mt-4">
            <button
              onClick={close}
              className="flex-1 py-2.5 rounded-xl bg-muted text-foreground text-sm font-medium"
            >
              Not now
            </button>
            <button
              onClick={handleEnable}
              disabled={busy}
              className="flex-1 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold disabled:opacity-50"
            >
              {busy ? "Enabling…" : "Enable"}
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
