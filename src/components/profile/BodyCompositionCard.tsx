import { motion } from "framer-motion";
import { format, parseISO } from "date-fns";
import type { WeightLog } from "./WeightChart";

interface Props {
  latest: WeightLog;
  gender: string | null | undefined;
}

export function BodyCompositionCard({ latest, gender }: Props) {
  const bmi = latest.bmi;
  const fat = latest.body_fat_percent;
  const fatMass = latest.body_fat_mass_kg;
  const leanMass = fatMass != null ? (latest.weight_kg - fatMass) : null;

  const bmiCategory = bmi != null
    ? bmi < 18.5 ? "Underweight" : bmi < 25 ? "Normal" : bmi < 30 ? "Overweight" : "Obese"
    : null;
  const bmiEmoji = bmi != null
    ? bmi < 18.5 ? "🔵" : bmi < 25 ? "🟢" : bmi < 30 ? "🟡" : "🔴"
    : "";
  const bmiPercent = bmi != null ? Math.min(100, Math.max(0, ((bmi - 10) / 35) * 100)) : 0;

  const fatCategory = fat != null
    ? gender === "female"
      ? fat < 14 ? "Essential" : fat < 21 ? "Athletic" : fat < 25 ? "Fit" : fat < 32 ? "Average" : "Above Avg"
      : fat < 6 ? "Essential" : fat < 14 ? "Athletic" : fat < 18 ? "Fit" : fat < 25 ? "Average" : "Above Avg"
    : null;
  const fatEmoji = fat != null
    ? (gender === "female"
      ? fat < 21 ? "🟢" : fat < 25 ? "🟡" : "🟠"
      : fat < 14 ? "🟢" : fat < 18 ? "🟡" : "🟠")
    : "";

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.13 }}
      className="rounded-2xl bg-card p-5 shadow-sm border border-border/50"
    >
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-lg">
          🏋️
        </div>
        <div>
          <h3 className="font-semibold text-card-foreground">Body Composition</h3>
          <p className="text-xs text-muted-foreground">Latest assessment · {format(parseISO(latest.logged_at), "MMM d, yyyy")}</p>
        </div>
      </div>

      <div className="space-y-4">
        {bmi != null && (
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-medium text-foreground">BMI</span>
              <span className="text-xs font-semibold text-foreground">{bmiEmoji} {bmi} — {bmiCategory}</span>
            </div>
            <div className="relative h-3 rounded-full overflow-hidden bg-gradient-to-r from-blue-400 via-green-400 via-50% via-yellow-400 to-red-500">
              <motion.div
                className="absolute top-0 w-3 h-3 rounded-full bg-white border-2 border-foreground shadow-md"
                style={{ left: `calc(${bmiPercent}% - 6px)` }}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.3, type: "spring" }}
              />
            </div>
            <div className="flex justify-between mt-1">
              <span className="text-[9px] text-muted-foreground">Under 18.5</span>
              <span className="text-[9px] text-muted-foreground">Normal</span>
              <span className="text-[9px] text-muted-foreground">Over 25</span>
              <span className="text-[9px] text-muted-foreground">Obese 30+</span>
            </div>
          </div>
        )}

        {fat != null && (
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-medium text-foreground">Body Fat</span>
              <span className="text-xs font-semibold text-foreground">{fatEmoji} {fat}% — {fatCategory}</span>
            </div>
            <div className="h-3 rounded-full overflow-hidden bg-muted">
              <motion.div
                className="h-full rounded-full"
                style={{
                  width: `${Math.min(fat, 50)}%`,
                  background: `linear-gradient(90deg, hsl(142, 70%, 45%), hsl(${Math.max(0, 142 - fat * 4)}, 70%, 50%))`,
                }}
                initial={{ width: 0 }}
                animate={{ width: `${Math.min(fat * 2, 100)}%` }}
                transition={{ duration: 0.8, ease: "easeOut" }}
              />
            </div>
            {gender === "male" && (
              <div className="flex justify-between mt-1">
                <span className="text-[9px] text-muted-foreground">Athletic &lt;14%</span>
                <span className="text-[9px] text-muted-foreground">Fit 14-18%</span>
                <span className="text-[9px] text-muted-foreground">Avg 18-25%</span>
              </div>
            )}
            {gender === "female" && (
              <div className="flex justify-between mt-1">
                <span className="text-[9px] text-muted-foreground">Athletic &lt;21%</span>
                <span className="text-[9px] text-muted-foreground">Fit 21-25%</span>
                <span className="text-[9px] text-muted-foreground">Avg 25-32%</span>
              </div>
            )}
          </div>
        )}

        {leanMass != null && fatMass != null && (
          <div className="grid grid-cols-2 gap-2">
            <div className="rounded-xl bg-primary/10 border border-primary/20 p-3 text-center">
              <p className="text-lg font-bold text-primary">{leanMass.toFixed(1)}</p>
              <p className="text-[10px] text-muted-foreground">Lean Mass (kg)</p>
              <p className="text-[10px] font-medium text-primary mt-0.5">{((leanMass / latest.weight_kg) * 100).toFixed(0)}%</p>
            </div>
            <div className="rounded-xl bg-rose-500/10 border border-rose-500/20 p-3 text-center">
              <p className="text-lg font-bold text-rose-600">{fatMass.toFixed(1)}</p>
              <p className="text-[10px] text-muted-foreground">Fat Mass (kg)</p>
              <p className="text-[10px] font-medium text-rose-600 mt-0.5">{((fatMass / latest.weight_kg) * 100).toFixed(0)}%</p>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}

export default BodyCompositionCard;
