import { Sparkles } from "lucide-react";
import { calculateMacros, GOALS } from "@/lib/macro-calc";
import { StepContainer } from "./StepContainer";

export function ResultsStep({
  age,
  weight,
  height,
  gender,
  workoutDays,
  goal,
}: {
  age: string;
  weight: string;
  height: string;
  gender: string;
  workoutDays: number;
  goal: string;
}) {
  const macros = calculateMacros({
    age: parseInt(age),
    weight: parseFloat(weight),
    height: parseFloat(height),
    gender,
    workoutDays,
    goal,
  });
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
}
