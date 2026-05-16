// Exercise library — static catalog. Images live in src/assets/exercises/
import benchPress from "@/assets/exercises/bench-press.png";
import pushUp from "@/assets/exercises/push-up.png";
import pullUp from "@/assets/exercises/pull-up.png";
import seatedRow from "@/assets/exercises/seated-row.png";
import shoulderPress from "@/assets/exercises/shoulder-press.png";
import lateralRaise from "@/assets/exercises/lateral-raise.png";
import bicepCurl from "@/assets/exercises/bicep-curl.png";
import hammerCurl from "@/assets/exercises/hammer-curl.png";
import tricepPushdown from "@/assets/exercises/tricep-pushdown.png";
import tricepDip from "@/assets/exercises/tricep-dip.png";
import squat from "@/assets/exercises/squat.png";
import lunge from "@/assets/exercises/lunge.png";
import plank from "@/assets/exercises/plank.png";
import crunch from "@/assets/exercises/crunch.png";
import running from "@/assets/exercises/running.png";
import cycling from "@/assets/exercises/cycling.png";

export type BodyPart =
  | "all"
  | "chest"
  | "back"
  | "shoulders"
  | "biceps"
  | "triceps"
  | "legs"
  | "core"
  | "cardio";

export interface Exercise {
  key: string;
  name: string;
  bodyPart: Exclude<BodyPart, "all">;
  image: string;
  /** MET (Metabolic Equivalent of Task) — used to estimate calories burned. */
  met: number;
}

export const BODY_PARTS: { id: BodyPart; label: string }[] = [
  { id: "all", label: "All" },
  { id: "chest", label: "Chest" },
  { id: "back", label: "Back" },
  { id: "shoulders", label: "Shoulders" },
  { id: "biceps", label: "Biceps" },
  { id: "triceps", label: "Triceps" },
  { id: "legs", label: "Legs" },
  { id: "core", label: "Core" },
  { id: "cardio", label: "Cardio" },
];

// MET values from the Compendium of Physical Activities (Ainsworth et al.).
// Strength training ~5, vigorous calisthenics ~8, jogging ~7, cycling moderate ~7.5.
export const EXERCISES: Exercise[] = [
  { key: "bench-press", name: "Bench Press", bodyPart: "chest", image: benchPress, met: 5 },
  { key: "push-up", name: "Push-up", bodyPart: "chest", image: pushUp, met: 8 },
  { key: "pull-up", name: "Pull-up", bodyPart: "back", image: pullUp, met: 8 },
  { key: "seated-row", name: "Seated Row", bodyPart: "back", image: seatedRow, met: 5 },
  { key: "shoulder-press", name: "Shoulder Press", bodyPart: "shoulders", image: shoulderPress, met: 5 },
  { key: "lateral-raise", name: "Lateral Raise", bodyPart: "shoulders", image: lateralRaise, met: 3.5 },
  { key: "bicep-curl", name: "Bicep Curl", bodyPart: "biceps", image: bicepCurl, met: 3.5 },
  { key: "hammer-curl", name: "Hammer Curl", bodyPart: "biceps", image: hammerCurl, met: 3.5 },
  { key: "tricep-pushdown", name: "Tricep Pushdown", bodyPart: "triceps", image: tricepPushdown, met: 3.5 },
  { key: "tricep-dip", name: "Tricep Dip", bodyPart: "triceps", image: tricepDip, met: 8 },
  { key: "squat", name: "Barbell Squat", bodyPart: "legs", image: squat, met: 6 },
  { key: "lunge", name: "Walking Lunge", bodyPart: "legs", image: lunge, met: 5 },
  { key: "plank", name: "Plank", bodyPart: "core", image: plank, met: 4 },
  { key: "crunch", name: "Crunch", bodyPart: "core", image: crunch, met: 3.8 },
  { key: "running", name: "Running", bodyPart: "cardio", image: running, met: 9.8 },
  { key: "cycling", name: "Cycling", bodyPart: "cardio", image: cycling, met: 7.5 },
];

/** Default MET when no exercise is selected (custom workout). */
export const DEFAULT_MET = 5;

/**
 * Estimate calories burned via the standard MET formula:
 *   kcal = MET × weightKg × hours
 * Falls back to a 70 kg reference weight when the user weight isn't set.
 */
export function estimateCalories(met: number, durationMin: number, weightKg?: number | null): number {
  if (!durationMin || durationMin <= 0) return 0;
  const w = weightKg && weightKg > 0 ? weightKg : 70;
  return Math.round(met * w * (durationMin / 60));
}

export const BODY_PART_LABELS: Record<Exclude<BodyPart, "all">, string> = {
  chest: "Chest",
  back: "Back",
  shoulders: "Shoulders",
  biceps: "Biceps",
  triceps: "Triceps",
  legs: "Legs",
  core: "Core",
  cardio: "Cardio",
};

export function getExercise(key: string | null | undefined): Exercise | undefined {
  if (!key) return undefined;
  return EXERCISES.find((e) => e.key === key);
}
