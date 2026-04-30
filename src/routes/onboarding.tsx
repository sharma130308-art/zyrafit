import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState, useEffect, lazy, Suspense } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { calculateMacros, GOALS, GENDERS } from "@/lib/macro-calc";
import zyrafitIcon from "@/assets/zyrafit-icon.png";
import { StepContainer } from "@/components/onboarding/StepContainer";
import { hapticLight, hapticMedium } from "@/lib/haptics";
import {
  ArrowRight,
  ArrowLeft,
  User,
  Weight,
  Ruler,
  Dumbbell,
  Target,
  AlertCircle,
  Check,
} from "lucide-react";

// Lazy-load heavy/late steps so the first onboarding screen paints faster.
// SignupStep pulls in supabase auth + lovable OAuth; ResultsStep + HealthStep
// are only reached after several earlier steps.
const HealthStep = lazy(() => import("@/components/onboarding/HealthStep").then(m => ({ default: m.HealthStep })));
const ResultsStep = lazy(() => import("@/components/onboarding/ResultsStep").then(m => ({ default: m.ResultsStep })));
const SignupStep = lazy(() => import("@/components/onboarding/SignupStep").then(m => ({ default: m.SignupStep })));
const NotificationsStep = lazy(() => import("@/components/onboarding/NotificationsStep").then(m => ({ default: m.NotificationsStep })));

export const Route = createFileRoute("/onboarding")({
  component: OnboardingPage,
  head: () => ({
    meta: [
      { title: "ZyraFit — Set Up Your Profile" },
      { name: "description", content: "Tell us about yourself so we can personalize your experience." },
    ],
  }),
});

const STEPS = ["gender", "age", "height", "weight", "workout", "goal", "obstacles", "health", "results", "signup", "notifications"] as const;
type Step = (typeof STEPS)[number];

const OBSTACLES = [
  { value: "time", label: "Not Enough Time", emoji: "⏰" },
  { value: "motivation", label: "Lack of Motivation", emoji: "😴" },
  { value: "diet", label: "Sticking to a Diet", emoji: "🍕" },
  { value: "knowledge", label: "Not Sure What to Do", emoji: "🤔" },
  { value: "consistency", label: "Staying Consistent", emoji: "📅" },
  { value: "stress", label: "Stress & Emotional Eating", emoji: "😰" },
];

const STORAGE_KEY = "zyrafit:onboarding-progress";

type SavedProgress = {
  currentStep: number;
  gender: string;
  age: string;
  height: string;
  weight: string;
  workoutDays: number;
  goal: string;
  obstacles: string[];
  appleHealth: boolean;
};

function loadProgress(): Partial<SavedProgress> | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Partial<SavedProgress>) : null;
  } catch {
    return null;
  }
}

function OnboardingPage() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [currentStep, setCurrentStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [hadSavedProgress, setHadSavedProgress] = useState(false);

  // Form state
  const [gender, setGender] = useState("");
  const [age, setAge] = useState("");
  const [height, setHeight] = useState("");
  const [weight, setWeight] = useState("");
  const [workoutDays, setWorkoutDays] = useState(3);
  const [goal, setGoal] = useState("");
  const [obstacles, setObstacles] = useState<string[]>([]);
  const [appleHealth, setAppleHealth] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  // Hydrate from localStorage after mount to avoid SSR/client mismatch
  useEffect(() => {
    const saved = loadProgress();
    if (saved) {
      if (typeof saved.currentStep === "number") setCurrentStep(saved.currentStep);
      if (saved.gender) setGender(saved.gender);
      if (saved.age) setAge(saved.age);
      if (saved.height) setHeight(saved.height);
      if (saved.weight) setWeight(saved.weight);
      if (typeof saved.workoutDays === "number") setWorkoutDays(saved.workoutDays);
      if (saved.goal) setGoal(saved.goal);
      if (saved.obstacles) setObstacles(saved.obstacles);
      if (typeof saved.appleHealth === "boolean") setAppleHealth(saved.appleHealth);
      setHadSavedProgress((saved.currentStep ?? 0) > 0);
    }
    setHydrated(true);
  }, []);

  const step = STEPS[currentStep];
  const totalSteps = STEPS.length;
  const progress = ((currentStep + 1) / totalSteps) * 100;

  // Prefetch lazy chunks ahead of time so later steps feel instant.
  // When the user reaches "goal", warm up Health, Results, and Signup chunks.
  useEffect(() => {
    if (step === "goal") {
      import("@/components/onboarding/HealthStep");
      import("@/components/onboarding/ResultsStep");
      import("@/components/onboarding/SignupStep");
    }
  }, [step]);

  // Persist progress on every change (after hydration)
  useEffect(() => {
    if (!hydrated) return;
    if (typeof window === "undefined") return;
    try {
      const data: SavedProgress = {
        currentStep, gender, age, height, weight, workoutDays, goal, obstacles, appleHealth,
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch {
      // ignore quota errors
    }
  }, [hydrated, currentStep, gender, age, height, weight, workoutDays, goal, obstacles, appleHealth]);


  const canProceed = () => {
    switch (step) {
      case "gender": return gender !== "";
      case "age": return age !== "" && parseInt(age) > 0 && parseInt(age) < 120;
      case "height": return height !== "" && parseFloat(height) > 50 && parseFloat(height) < 300;
      case "weight": return weight !== "" && parseFloat(weight) > 0;
      case "workout": return true;
      case "goal": return goal !== "";
      case "obstacles": return obstacles.length > 0;
      case "health": return true;
      case "results": return true;
      case "signup": return true;
      case "notifications": return true;
      default: return false;
    }
  };

  const saveProfile = async (userId: string) => {
    const { calories, protein, carbs, fat } = calculateMacros({
      age: parseInt(age),
      weight: parseFloat(weight),
      height: parseFloat(height),
      gender,
      workoutDays,
      goal,
    });
    await Promise.all([
      supabase.from("user_profiles").upsert({
        user_id: userId,
        age: parseInt(age),
        weight_kg: parseFloat(weight),
        gender,
        workout_days_per_week: workoutDays,
        goal,
        obstacles: obstacles.join(", "),
        apple_health_connected: appleHealth,
        onboarding_completed: true,
      }, { onConflict: "user_id" }),
      supabase.from("user_settings").upsert({
        user_id: userId,
        daily_calorie_goal: calories,
        protein_goal: protein,
        carbs_goal: carbs,
        fat_goal: fat,
      }, { onConflict: "user_id" }),
    ]);
  };

  const clearProgress = () => {
    if (typeof window !== "undefined") {
      try { localStorage.removeItem(STORAGE_KEY); } catch { /* ignore */ }
    }
  };

  const handleNext = async () => {
    hapticMedium();
    if (step === "health") {
      // If already authenticated, save and go home
      if (user) {
        setSaving(true);
        await saveProfile(user.id);
        clearProgress();
        setSaving(false);
        navigate({ to: "/" });
        return;
      }
    }

    if (currentStep < totalSteps - 1) {
      setCurrentStep((s) => s + 1);
    }
  };

  const handleBack = () => {
    hapticLight();
    if (currentStep > 0) {
      setCurrentStep((s) => s - 1);
    }
  };

  const toggleObstacle = (value: string) => {
    hapticLight();
    setObstacles((prev) =>
      prev.includes(value) ? prev.filter((o) => o !== value) : [...prev, value]
    );
  };

  const handleAccountCreated = async (userId: string) => {
    await saveProfile(userId);
    clearProgress();
  };

  const slideVariants = {
    enter: { x: 60, opacity: 0 },
    center: { x: 0, opacity: 1 },
    exit: { x: -60, opacity: 0 },
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Logo + Progress bar */}
      <div className="px-6 pt-14 pb-4">
        <div className="flex items-center justify-center mb-4">
          <img src={zyrafitIcon} alt="ZyraFit" className="w-10 h-10 rounded-xl" />
        </div>
        <div className="flex items-center justify-between mb-3">
          {currentStep > 0 ? (
            <button onClick={handleBack} className="text-muted-foreground p-1">
              <ArrowLeft className="w-5 h-5" />
            </button>
          ) : (
            <Link to="/welcome" className="text-muted-foreground p-1">
              <ArrowLeft className="w-5 h-5" />
            </Link>
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
      <div className="flex-1 px-6 flex flex-col overflow-hidden">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={step}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.25 }}
            className="flex-1 flex flex-col min-h-0"
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
                {hadSavedProgress && (
                  <button
                    type="button"
                    onClick={() => {
                      clearProgress();
                      setGender("");
                      setAge("");
                      setHeight("");
                      setWeight("");
                      setWorkoutDays(3);
                      setGoal("");
                      setObstacles([]);
                      setAppleHealth(false);
                      setCurrentStep(0);
                    }}
                    className="mt-6 mx-auto block text-xs text-muted-foreground hover:text-foreground underline underline-offset-4 transition-colors"
                  >
                    Start over
                  </button>
                )}
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

            {step === "height" && (
              <StepContainer
                icon={<Ruler className="w-6 h-6" />}
                title="How tall are you?"
                subtitle="Height helps us calculate your metabolism"
              >
                <div className="flex flex-col items-center gap-4">
                  <input
                    type="number"
                    value={height}
                    onChange={(e) => setHeight(e.target.value)}
                    placeholder="170"
                    min="50"
                    max="300"
                    className="w-32 text-center text-5xl font-bold bg-transparent text-foreground border-none outline-none placeholder:text-muted-foreground/30"
                  />
                  <span className="text-sm text-muted-foreground">cm</span>
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

            {(step === "health" || step === "results" || step === "signup" || step === "notifications") && (
              <Suspense fallback={<StepFallback />}>
                {step === "health" && (
                  <HealthStep appleHealth={appleHealth} setAppleHealth={setAppleHealth} />
                )}
                {step === "results" && (
                  <ResultsStep
                    age={age}
                    weight={weight}
                    height={height}
                    gender={gender}
                    workoutDays={workoutDays}
                    goal={goal}
                  />
                )}
                {step === "signup" && (
                  <SignupStep
                    onAccountCreated={handleAccountCreated}
                    onComplete={() => setCurrentStep((s) => s + 1)}
                  />
                )}
                {step === "notifications" && (
                  <NotificationsStep onDone={() => navigate({ to: "/" })} />
                )}
              </Suspense>
            )}
          </motion.div>
        </AnimatePresence>

        {/* Continue button (hide on signup + notifications — they have their own actions) */}
        {step !== "signup" && step !== "notifications" && (
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
                  Continue
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </motion.button>
          </div>
        )}
      </div>
    </div>
  );
}

function StepFallback() {
  return (
    <div className="flex-1 flex items-center justify-center">
      <motion.div
        className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent"
        animate={{ rotate: 360 }}
        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
      />
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
      onClick={() => { hapticLight(); onClick(); }}
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
