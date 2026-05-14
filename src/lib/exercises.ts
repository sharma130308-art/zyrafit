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

export const EXERCISES: Exercise[] = [
  { key: "bench-press", name: "Bench Press", bodyPart: "chest", image: benchPress },
  { key: "push-up", name: "Push-up", bodyPart: "chest", image: pushUp },
  { key: "pull-up", name: "Pull-up", bodyPart: "back", image: pullUp },
  { key: "seated-row", name: "Seated Row", bodyPart: "back", image: seatedRow },
  { key: "shoulder-press", name: "Shoulder Press", bodyPart: "shoulders", image: shoulderPress },
  { key: "lateral-raise", name: "Lateral Raise", bodyPart: "shoulders", image: lateralRaise },
  { key: "bicep-curl", name: "Bicep Curl", bodyPart: "biceps", image: bicepCurl },
  { key: "hammer-curl", name: "Hammer Curl", bodyPart: "biceps", image: hammerCurl },
  { key: "tricep-pushdown", name: "Tricep Pushdown", bodyPart: "triceps", image: tricepPushdown },
  { key: "tricep-dip", name: "Tricep Dip", bodyPart: "triceps", image: tricepDip },
  { key: "squat", name: "Barbell Squat", bodyPart: "legs", image: squat },
  { key: "lunge", name: "Walking Lunge", bodyPart: "legs", image: lunge },
  { key: "plank", name: "Plank", bodyPart: "core", image: plank },
  { key: "crunch", name: "Crunch", bodyPart: "core", image: crunch },
  { key: "running", name: "Running", bodyPart: "cardio", image: running },
  { key: "cycling", name: "Cycling", bodyPart: "cardio", image: cycling },
];

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
