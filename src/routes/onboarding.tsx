import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import {
  ArrowRight,
  ArrowLeft,
  User,
  Weight,
  Dumbbell,
  Target,
  AlertCircle,
  Heart,
  Check,
} from "lucide-react";

export const Route = createFileRoute("/onboarding")({
  component: OnboardingPage,
  head: () => ({
    meta: [
      { title: "CalTrack — Set Up Your Profile" },
      { name: "description", content: "Tell us about yourself so we can personalize your experience." },
    ],
  }),
});

const STEPS = ["gender", "age", "weight", "workout", "goal", "obstacles", "health"] as const;
type Step = (typeof STEPS)[number];

const GOALS = [
  { value: "lose_weight", label: "Lose Weight", emoji: "🔥" },
  { value: "gain_weight", label: "Gain Weight", emoji: "📈" },
  { value: "maintain", label: "Maintain Weight", emoji: "⚖️" },
  { value: "muscle_gain", label: "Build Muscle", emoji: "💪" },
];

const OBSTACLES = [
  { value: "time", label: "Not Enough Time", emoji: "⏰" },
  { value: "motivation", label: "Lack of Motivation", emoji: "😴" },
  { value: "diet", label: "Sticking to a Diet", emoji: "🍕" },
  { value: "knowledge", label: "Not Sure What to Do", emoji: "🤔" },
  { value: "consistency", label: "Staying Consistent", emoji: "📅" },
  { value: "stress", label: "Stress & Emotional Eating", emoji: "😰" },
];

const GENDERS = [
  { value: "male", label: "Male", emoji: "♂️" },
  { value: "female", label: "Female", emoji: "♀️" },
  { value: "other", label: "Other", emoji: "⚧️" },
  { value: "prefer_not", label: "Prefer not to say", emoji: "🤐" },
];

function OnboardingPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [currentStep, setCurrentStep] = useState(0);
  const [saving, setSaving] = useState(false);

  // Form state
  const [gender, setGender] = useState("");
  const [age, setAge] = useState("");
  const [weight, setWeight] = useState("");
  const [workoutDays, setWorkoutDays] = useState(3);
  const [goal, setGoal] = useState("");
  const [obstacles, setObstacles] = useState<string[]>([]);
  const [appleHealth, setAppleHealth] = useState(false);

  const step = STEPS[currentStep];
  const totalSteps = STEPS.length;
  const progress = ((currentStep + 1) / totalSteps) * 100;

  const canProceed = () => {
    switch (step) {
      case "gender": return gender !== "";
      case "age": return age !== "" && parseInt(age) > 0 && parseInt(age) < 120;
      case "weight": return weight !== "" && parseFloat(weight) > 0;
      case "workout": return true;
      case "goal": return goal !== "";
      case "obstacles": return obstacles.length > 0;
      case "health": return true;
      default: return false;
    }
  };

  const handleNext = async () => {
    if (currentStep < totalSteps - 1) {
      setCurrentStep((s) => s + 1);
    } else {
      await handleFinish();
    }
  };

  const handleBack = () => {
    if (currentStep > 0) setCurrentStep((s) => s - 1);
  };

  const toggleObstacle = (value: string) => {
    setObstacles((prev) =>
      prev.includes(value) ? prev.filter((o) => o !== value) : [...prev, value]
    );
  };

  const handleFinish = async () => {
    if (!user) return;
    setSaving(true);

    await supabase.from("user_profiles").upsert({
      user_id: user.id,
      age: parseInt(age),
      weight_kg: parseFloat(weight),
      gender,
      workout_days_per_week: workoutDays,
      goal,
      obstacles: obstacles.join(", "),
      apple_health_connected: appleHealth,
      onboarding_completed: true,
    }, { onConflict: "user_id" });

    setSaving(false);
    navigate({ to: "/" });
  };

  const slideVariants = {
    enter: { x: 60, opacity: 0 },
    center: { x: 0, opacity: 1 },
    exit: { x: -60, opacity: 0 },
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Progress bar */}
      <div className="px-6 pt-14 pb-4">
        <div className="flex items-center justify-between mb-3">
          {currentStep > 0 ? (
            <button onClick={handleBack} className="text-muted-foreground p-1">
              <ArrowLeft className="w-5 h-5" />
            </button>
          ) : (
            <div className="w-7" />
          )}
          <span className="text-xs text-muted-foreground font-medium">
            {currentStep + 1} / {totalSteps}
          </span>
          <div className="w-7" />
        </div>
        <div className="h-1.5 rounded-full bg-muted overflow-hidden">
          <motion.div
            className="h-full rounded-full bg-primary"
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 px-6 flex flex-col">
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.25 }}
            className="flex-1 flex flex-col"
          >
            {step === "gender" && (
              <StepContainer
                icon={<User className="w-6 h-6" />}
                title="What's your gender?"
                subtitle="This helps us personalize your calorie goals"
              >
                <div className="grid grid-cols-2 gap-3">
                  {GENDERS.map((g) => (
                    <OptionCard
                      key={g.value}
                      emoji={g.emoji}
                      label={g.label}
                      selected={gender === g.value}
                      onClick={() => setGender(g.value)}
                    />
                  ))}
                </div>
              </StepContainer>
            )}

            {step === "age" && (
              <StepContainer
                icon={<User className="w-6 h-6" />}
                title="How old are you?"
                subtitle="Age affects your metabolic rate"
              >
                <div className="flex flex-col items-center gap-4">
                  <input
                    type="number"
                    value={age}
                    onChange={(e) => setAge(e.target.value)}
                    placeholder="25"
                    min="10"
                    max="120"
                    className="w-32 text-center text-5xl font-bold bg-transparent text-foreground border-none outline-none placeholder:text-muted-foreground/30"
                  />
                  <span className="text-sm text-muted-foreground">years old</span>
                </div>
              </StepContainer>
            )}

            {step === "weight" && (
              <StepContainer
                icon={<Weight className="w-6 h-6" />}
                title="What's your weight?"
                subtitle="We'll use this to calculate your needs"
              >
                <div className="flex flex-col items-center gap-4">
                  <input
                    type="number"
                    value={weight}
                    onChange={(e) => setWeight(e.target.value)}
                    placeholder="70"
                    min="20"
                    max="300"
                    step="0.1"
                    className="w-32 text-center text-5xl font-bold bg-transparent text-foreground border-none outline-none placeholder:text-muted-foreground/30"
                  />
                  <span className="text-sm text-muted-foreground">kg</span>
                </div>
              </StepContainer>
            )}

            {step === "workout" && (
              <StepContainer
                icon={<Dumbbell className="w-6 h-6" />}
                title="How often do you work out?"
                subtitle="Days per week"
              >
                <div className="flex flex-col items-center gap-6">
                  <span className="text-6xl font-bold text-foreground">{workoutDays}</span>
                  <input
                    type="range"
                    min="0"
                    max="7"
                    value={workoutDays}
                    onChange={(e) => setWorkoutDays(parseInt(e.target.value))}
                    className="w-full accent-primary"
                  />
                  <div className="flex justify-between w-full text-xs text-muted-foreground">
                    <span>0</span>
                    <span>7</span>
                  </div>
                </div>
              </StepContainer>
            )}

            {step === "goal" && (
              <StepContainer
                icon={<Target className="w-6 h-6" />}
                title="What's your goal?"
                subtitle="We'll tailor your daily targets"
              >
                <div className="space-y-3">
                  {GOALS.map((g) => (
                    <OptionCard
                      key={g.value}
                      emoji={g.emoji}
                      label={g.label}
                      selected={goal === g.value}
                      onClick={() => setGoal(g.value)}
                      wide
                    />
                  ))}
                </div>
              </StepContainer>
            )}

            {step === "obstacles" && (
              <StepContainer
                icon={<AlertCircle className="w-6 h-6" />}
                title="What's stopping you?"
                subtitle="Select all that apply"
              >
                <div className="grid grid-cols-2 gap-3">
                  {OBSTACLES.map((o) => (
                    <OptionCard
                      key={o.value}
                      emoji={o.emoji}
                      label={o.label}
                      selected={obstacles.includes(o.value)}
                      onClick={() => toggleObstacle(o.value)}
                    />
                  ))}
                </div>
              </StepContainer>
            )}

            {step === "health" && (
              <StepContainer
                icon={<Heart className="w-6 h-6" />}
                title="Connect Apple Health?"
                subtitle="Sync your activity and nutrition data"
              >
                <div className="space-y-4">
                  <button
                    onClick={() => setAppleHealth(!appleHealth)}
                    className={`w-full flex items-center gap-4 p-5 rounded-2xl border-2 transition-all ${
                      appleHealth
                        ? "border-primary bg-primary/10"
                        : "border-border/50 bg-card"
                    }`}
                  >
                    <div className="text-3xl">🍎</div>
                    <div className="text-left flex-1">
                      <h3 className="font-semibold text-foreground">Apple Health</h3>
                      <p className="text-xs text-muted-foreground">
                        Sync steps, workouts & more
                      </p>
                    </div>
                    {appleHealth && (
                      <div className="w-7 h-7 rounded-full bg-primary flex items-center justify-center">
                        <Check className="w-4 h-4 text-primary-foreground" />
                      </div>
                    )}
                  </button>
                  <p className="text-xs text-muted-foreground text-center">
                    You can always connect it later in Settings
                  </p>
                </div>
              </StepContainer>
            )}
          </motion.div>
        </AnimatePresence>

        {/* Continue button */}
        <div className="pb-10 pt-4">
          <motion.button
            onClick={handleNext}
            disabled={!canProceed() || saving}
            whileTap={{ scale: 0.97 }}
            className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl bg-primary text-primary-foreground font-semibold shadow-lg shadow-primary/25 disabled:opacity-40 transition-opacity"
          >
            {saving ? (
              <motion.div
                className="w-5 h-5 rounded-full border-2 border-primary-foreground border-t-transparent"
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              />
            ) : (
              <>
                {currentStep === totalSteps - 1 ? "Get Started" : "Continue"}
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </motion.button>
        </div>
      </div>
    </div>
  );
}

// ── Reusable sub-components ──────────────────────────────

function StepContainer({
  icon,
  title,
  subtitle,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex-1 flex flex-col">
      <div className="flex items-center gap-3 mb-2">
        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
          {icon}
        </div>
        <div>
          <h2 className="text-xl font-bold text-foreground">{title}</h2>
          <p className="text-xs text-muted-foreground">{subtitle}</p>
        </div>
      </div>
      <div className="flex-1 flex flex-col justify-center py-6">{children}</div>
    </div>
  );
}

function OptionCard({
  emoji,
  label,
  selected,
  onClick,
  wide,
}: {
  emoji: string;
  label: string;
  selected: boolean;
  onClick: () => void;
  wide?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-3 p-4 rounded-2xl border-2 transition-all ${
        wide ? "w-full" : ""
      } ${
        selected
          ? "border-primary bg-primary/10 shadow-sm"
          : "border-border/50 bg-card hover:border-border"
      }`}
    >
      <span className="text-2xl">{emoji}</span>
      <span className={`font-medium ${selected ? "text-foreground" : "text-muted-foreground"}`}>
        {label}
      </span>
      {selected && (
        <div className="ml-auto w-5 h-5 rounded-full bg-primary flex items-center justify-center">
          <Check className="w-3 h-3 text-primary-foreground" />
        </div>
      )}
    </button>
  );
}
