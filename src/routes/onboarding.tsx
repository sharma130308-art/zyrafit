import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { useAuth } from "@/hooks/use-auth";
import { calculateMacros, GOALS, GENDERS } from "@/lib/macro-calc";
import zyrafitIcon from "@/assets/zyrafit-icon.png";
import {
  ArrowRight,
  ArrowLeft,
  User,
  Weight,
  Ruler,
  Dumbbell,
  Target,
  AlertCircle,
  Heart,
  Check,
  Mail,
  Lock,
  Eye,
  EyeOff,
  Sparkles,
} from "lucide-react";

export const Route = createFileRoute("/onboarding")({
  component: OnboardingPage,
  head: () => ({
    meta: [
      { title: "ZyraFit — Set Up Your Profile" },
      { name: "description", content: "Tell us about yourself so we can personalize your experience." },
    ],
  }),
});

const STEPS = ["gender", "age", "height", "weight", "workout", "goal", "obstacles", "health", "results", "signup"] as const;
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
  const saved = useRef<Partial<SavedProgress> | null>(loadProgress()).current;
  const hadSavedProgress = useRef(saved !== null && (saved.currentStep ?? 0) > 0).current;

  const [currentStep, setCurrentStep] = useState(saved?.currentStep ?? 0);
  const [saving, setSaving] = useState(false);

  // Form state
  const [gender, setGender] = useState(saved?.gender ?? "");
  const [age, setAge] = useState(saved?.age ?? "");
  const [height, setHeight] = useState(saved?.height ?? "");
  const [weight, setWeight] = useState(saved?.weight ?? "");
  const [workoutDays, setWorkoutDays] = useState(saved?.workoutDays ?? 3);
  const [goal, setGoal] = useState(saved?.goal ?? "");
  const [obstacles, setObstacles] = useState<string[]>(saved?.obstacles ?? []);
  const [appleHealth, setAppleHealth] = useState(saved?.appleHealth ?? false);

  // Auth state (for signup step)
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  const step = STEPS[currentStep];
  const totalSteps = STEPS.length;
  const progress = ((currentStep + 1) / totalSteps) * 100;

  // Persist progress on every change (skip the final signup step — auth handles it)
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const data: SavedProgress = {
        currentStep, gender, age, height, weight, workoutDays, goal, obstacles, appleHealth,
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch {
      // ignore quota errors
    }
  }, [currentStep, gender, age, height, weight, workoutDays, goal, obstacles, appleHealth]);


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
      case "signup": return email !== "" && password.length >= 6;
      default: return false;
    }
  };

  const computeMacros = () => calculateMacros({
    age: parseInt(age),
    weight: parseFloat(weight),
    height: parseFloat(height),
    gender,
    workoutDays,
    goal,
  });

  const saveProfile = async (userId: string) => {
    const { calories, protein, carbs, fat } = computeMacros();
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
    if (currentStep > 0) {
      setAuthError(null);
      setCurrentStep((s) => s - 1);
    }
  };

  const toggleObstacle = (value: string) => {
    setObstacles((prev) =>
      prev.includes(value) ? prev.filter((o) => o !== value) : [...prev, value]
    );
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthLoading(true);
    setAuthError(null);

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: window.location.origin },
    });

    if (error) {
      setAuthError(error.message);
      setAuthLoading(false);
      return;
    }

    if (data.user) {
      await saveProfile(data.user.id);
      clearProgress();
      setAuthLoading(false);
      navigate({ to: "/" });
    } else {
      setAuthLoading(false);
      setAuthError("Check your email to confirm, then sign in.");
    }
  };

  const handleGoogleSignUp = async () => {
    setAuthError(null);
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin,
    });
    if (result.error) {
      setAuthError(result.error instanceof Error ? result.error.message : "Google sign-in failed");
    }
  };

  const handleAppleSignUp = async () => {
    setAuthError(null);
    const result = await lovable.auth.signInWithOAuth("apple", {
      redirect_uri: window.location.origin,
    });
    if (result.error) {
      setAuthError(result.error instanceof Error ? result.error.message : "Apple sign-in failed");
    }
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

            {step === "results" && (() => {
              const macros = computeMacros();
              const goalLabel = GOALS.find((g) => g.value === goal)?.label ?? "Your Goal";
              return (
                <StepContainer
                  icon={<Sparkles className="w-6 h-6" />}
                  title="Your Personalized Plan"
                  subtitle={`Based on your profile — ${goalLabel}`}
                >
                  <div className="space-y-4">
                    <div className="rounded-2xl bg-primary/10 border border-primary/20 p-5 text-center">
                      <p className="text-sm text-muted-foreground mb-1">Daily Calories</p>
                      <p className="text-5xl font-bold text-primary">{macros.calories}</p>
                      <p className="text-xs text-muted-foreground mt-1">kcal / day</p>
                    </div>

                    <div className="grid grid-cols-3 gap-3">
                      <div className="rounded-2xl bg-card border border-border/50 p-4 text-center">
                        <p className="text-2xl font-bold text-foreground">{macros.protein}g</p>
                        <p className="text-xs text-muted-foreground mt-1">Protein</p>
                        <div className="w-full h-1.5 rounded-full bg-muted mt-2 overflow-hidden">
                          <div className="h-full rounded-full bg-blue-500" style={{ width: "100%" }} />
                        </div>
                      </div>
                      <div className="rounded-2xl bg-card border border-border/50 p-4 text-center">
                        <p className="text-2xl font-bold text-foreground">{macros.carbs}g</p>
                        <p className="text-xs text-muted-foreground mt-1">Carbs</p>
                        <div className="w-full h-1.5 rounded-full bg-muted mt-2 overflow-hidden">
                          <div className="h-full rounded-full bg-amber-500" style={{ width: "100%" }} />
                        </div>
                      </div>
                      <div className="rounded-2xl bg-card border border-border/50 p-4 text-center">
                        <p className="text-2xl font-bold text-foreground">{macros.fat}g</p>
                        <p className="text-xs text-muted-foreground mt-1">Fat</p>
                        <div className="w-full h-1.5 rounded-full bg-muted mt-2 overflow-hidden">
                          <div className="h-full rounded-full bg-rose-500" style={{ width: "100%" }} />
                        </div>
                      </div>
                    </div>

                    <p className="text-xs text-muted-foreground text-center leading-relaxed">
                      {goal === "lose_weight" && "High protein preserves muscle while in a calorie deficit."}
                      {goal === "muscle_gain" && "Extra protein & calories support muscle growth and recovery."}
                      {goal === "gain_weight" && "A balanced surplus helps you gain weight steadily."}
                      {goal === "maintain" && "A balanced split keeps you energized and healthy."}
                      {" "}You can adjust these anytime in Settings.
                    </p>
                  </div>
                </StepContainer>
              );
            })()}

            {step === "signup" && (
              <StepContainer
                icon={<Mail className="w-6 h-6" />}
                title="Create your account"
                subtitle="Save your profile & sync across devices"
              >
                <form onSubmit={handleSignUp} className="space-y-4">
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <input
                      type="email"
                      placeholder="Email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="w-full pl-11 pr-4 py-3.5 rounded-2xl bg-card border border-border/50 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                    />
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <input
                      type={showPassword ? "text" : "password"}
                      placeholder="Password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      minLength={6}
                      className="w-full pl-11 pr-11 py-3.5 rounded-2xl bg-card border border-border/50 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>

                  {authError && (
                    <motion.p
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="text-sm text-destructive text-center bg-destructive/10 rounded-xl px-4 py-2"
                    >
                      {authError}
                    </motion.p>
                  )}

                  <motion.button
                    type="submit"
                    disabled={authLoading || !canProceed()}
                    whileTap={{ scale: 0.97 }}
                    className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl bg-primary text-primary-foreground font-semibold shadow-lg shadow-primary/25 disabled:opacity-40"
                  >
                    {authLoading ? (
                      <motion.div
                        className="w-5 h-5 rounded-full border-2 border-primary-foreground border-t-transparent"
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                      />
                    ) : (
                      <>
                        Create Account
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </motion.button>
                </form>

                <div className="flex items-center gap-3 my-5">
                  <div className="flex-1 h-px bg-border" />
                  <span className="text-xs text-muted-foreground">or continue with</span>
                  <div className="flex-1 h-px bg-border" />
                </div>

                <div className="flex gap-3">
                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    onClick={handleGoogleSignUp}
                    className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-card border border-border/50 text-foreground font-medium hover:bg-accent transition-colors"
                  >
                    <svg className="w-5 h-5" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
                    Google
                  </motion.button>
                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    onClick={handleAppleSignUp}
                    className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-card border border-border/50 text-foreground font-medium hover:bg-accent transition-colors"
                  >
                    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor"><path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/></svg>
                    Apple
                  </motion.button>
                </div>

                <p className="text-center text-sm text-muted-foreground mt-5">
                  Already have an account?{" "}
                  <Link to="/login" className="text-primary font-medium">
                    Sign In
                  </Link>
                </p>
              </StepContainer>
            )}
          </motion.div>
        </AnimatePresence>

        {/* Continue button (hide on signup step) */}
        {step !== "signup" && (
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
