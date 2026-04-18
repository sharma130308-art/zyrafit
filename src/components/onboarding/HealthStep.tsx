import { Heart, Check } from "lucide-react";
import { StepContainer } from "./StepContainer";

export function HealthStep({
  appleHealth,
  setAppleHealth,
}: {
  appleHealth: boolean;
  setAppleHealth: (v: boolean) => void;
}) {
  return (
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
  );
}
