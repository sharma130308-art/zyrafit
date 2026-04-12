import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { useAuth } from "@/hooks/use-auth";
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
      { title: "CalTrack — Set Up Your Profile" },
      { name: "description", content: "Tell us about yourself so we can personalize your experience." },
    ],
  }),
});

const STEPS = ["gender", "age", "height", "weight", "workout", "goal", "obstacles", "health", "results", "signup"] as const;
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
  const [height, setHeight] = useState("");
  const [weight, setWeight] = useState("");
  const [workoutDays, setWorkoutDays] = useState(3);
  const [goal, setGoal] = useState("");
  const [obstacles, setObstacles] = useState<string[]>([]);
  const [appleHealth, setAppleHealth] = useState(false);

  // Auth state (for signup step)
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  const step = STEPS[currentStep];
  const totalSteps = STEPS.length;
  const progress = ((currentStep + 1) / totalSteps) * 100;

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

  const calculateMacros = () => {
    const ageNum = parseInt(age);
    const weightNum = parseFloat(weight);
    const heightCm = parseFloat(height);
    let bmr: number;
    if (gender === "female") {
      bmr = 10 * weightNum + 6.25 * heightCm - 5 * ageNum - 161;
    } else {
      bmr = 10 * weightNum + 6.25 * heightCm - 5 * ageNum + 5;
    }
    const activityMultipliers = [1.2, 1.25, 1.3, 1.375, 1.45, 1.55, 1.65, 1.725];
    const tdee = bmr * (activityMultipliers[workoutDays] ?? 1.375);

    let calories: number;
    let proteinRatio: number;
    let fatRatio: number;

    switch (goal) {
      case "lose_weight":
        calories = Math.round(tdee - 500);
        proteinRatio = 0.35; fatRatio = 0.25; // high protein to preserve muscle
        break;
      case "gain_weight":
        calories = Math.round(tdee + 300);
        proteinRatio = 0.25; fatRatio = 0.25;
        break;
      case "muscle_gain":
        calories = Math.round(tdee + 250);
        proteinRatio = 0.35; fatRatio = 0.25; // high protein for muscle
        break;
      default: // maintain
        calories = Math.round(tdee);
        proteinRatio = 0.30; fatRatio = 0.25;
    }

    const carbRatio = 1 - proteinRatio - fatRatio;
    const protein = Math.round((calories * proteinRatio) / 4); // 4 cal/g
    const fat = Math.round((calories * fatRatio) / 9); // 9 cal/g
    const carbs = Math.round((calories * carbRatio) / 4); // 4 cal/g

    return { calories, protein, carbs, fat };
  };

  const saveProfile = async (userId: string) => {
    const { calories, protein, carbs, fat } = calculateMacros();
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

  const handleNext = async () => {
    if (step === "health") {
      // If already authenticated, save and go home
      if (user) {
        setSaving(true);
        await saveProfile(user.id);
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
      {/* Progress bar */}
      <div className="px-6 pt-14 pb-4">
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
