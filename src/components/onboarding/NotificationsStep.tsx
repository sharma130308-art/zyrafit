import { useState } from "react";
import { motion } from "framer-motion";
import { Bell, Check, Clock, Flame, TrendingUp, ArrowRight } from "lucide-react";
import { StepContainer } from "./StepContainer";
import {
  enableReminders,
  remindersBlockedByPreview,
  remindersSupported,
} from "@/lib/reminders";
import { hapticMedium, hapticLight } from "@/lib/haptics";

type Status = "idle" | "loading" | "granted" | "denied";

const BENEFITS = [
  {
    icon: Clock,
    title: "Gentle meal-time nudges",
    desc: "A quick tap at breakfast, lunch and dinner so you never forget to log.",
  },
  {
    icon: Flame,
    title: "Stay on your streak",
    desc: "People who enable reminders log 3× more often and hit their macros.",
  },
  {
    icon: TrendingUp,
    title: "Hit your goal faster",
    desc: "Consistent tracking is the #1 predictor of reaching your weight goal.",
  },
];

export function NotificationsStep({ onDone }: { onDone: () => void }) {
  const [status, setStatus] = useState<Status>("idle");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const supported = remindersSupported();
  const preview = remindersBlockedByPreview();

  const handleEnable = async () => {
    hapticMedium();
    setStatus("loading");
    setErrorMsg(null);

    if (!supported) {
      setErrorMsg("Notifications aren't supported on this device.");
      setStatus("denied");
      return;
    }

    if (preview) {
      // In preview / iframe, we can't actually subscribe — pretend success
      // so the user can complete onboarding. Real prompt fires in published app.
      setStatus("granted");
      setTimeout(onDone, 600);
      return;
    }

    const result = await enableReminders();
    if (result.ok) {
      setStatus("granted");
      setTimeout(onDone, 600);
    } else {
      setErrorMsg(result.error || "Couldn't enable notifications.");
      setStatus("denied");
    }
  };

  const handleSkip = () => {
    hapticLight();
    onDone();
  };

  return (
    <StepContainer
      icon={<Bell className="w-6 h-6" />}
      title="Never miss a meal"
      subtitle="Turn on reminders to stay on track"
    >
      <div className="space-y-4">
        {/* Hero card */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="rounded-3xl bg-gradient-to-br from-primary/15 via-primary/5 to-transparent border border-primary/20 p-5"
        >
          <div className="flex items-start gap-3">
            <div className="w-12 h-12 rounded-2xl bg-primary/20 flex items-center justify-center shrink-0">
              <Bell className="w-6 h-6 text-primary" />
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground leading-tight">
                Logging takes 5 seconds —
                <br />
                remembering is the hard part.
              </p>
              <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">
                Reminders gently tap you at meal times so tracking becomes effortless.
              </p>
            </div>
          </div>
        </motion.div>

        {/* Benefits list */}
        <div className="space-y-2.5">
          {BENEFITS.map((b, i) => (
            <motion.div
              key={b.title}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: 0.1 + i * 0.06 }}
              className="flex items-start gap-3 p-3.5 rounded-2xl bg-card border border-border/50"
            >
              <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
                <b.icon className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-foreground">{b.title}</p>
                <p className="text-xs text-muted-foreground leading-relaxed mt-0.5">
                  {b.desc}
                </p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Privacy reassurance */}
        <p className="text-[11px] text-muted-foreground text-center px-4 leading-relaxed">
          We only send reminders for meals you haven't logged. You can turn them off
          anytime in Profile.
        </p>

        {errorMsg && (
          <p className="text-xs text-destructive text-center bg-destructive/10 rounded-xl px-3 py-2">
            {errorMsg}
          </p>
        )}
      </div>

      {/* Actions */}
      <div className="mt-6 space-y-2.5">
        <motion.button
          onClick={handleEnable}
          disabled={status === "loading"}
          whileTap={{ scale: 0.97 }}
          className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl bg-primary text-primary-foreground font-semibold shadow-lg shadow-primary/25 disabled:opacity-60 transition-opacity"
        >
          {status === "loading" ? (
            <motion.div
              className="w-5 h-5 rounded-full border-2 border-primary-foreground border-t-transparent"
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            />
          ) : status === "granted" ? (
            <>
              <Check className="w-5 h-5" />
              Notifications enabled
            </>
          ) : (
            <>
              <Bell className="w-5 h-5" />
              Enable reminders
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </motion.button>

        <button
          onClick={handleSkip}
          disabled={status === "loading"}
          className="w-full py-3 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          Maybe later
        </button>
      </div>
    </StepContainer>
  );
}
