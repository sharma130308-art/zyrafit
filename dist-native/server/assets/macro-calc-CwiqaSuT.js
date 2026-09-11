const GOALS = [
  { value: "lose_weight", label: "Lose Weight", emoji: "🔥" },
  { value: "gain_weight", label: "Gain Weight", emoji: "📈" },
  { value: "maintain", label: "Maintain Weight", emoji: "⚖️" },
  { value: "muscle_gain", label: "Build Muscle", emoji: "💪" }
];
const GENDERS = [
  { value: "male", label: "Male", emoji: "♂️" },
  { value: "female", label: "Female", emoji: "♀️" },
  { value: "other", label: "Other", emoji: "⚧️" },
  { value: "prefer_not", label: "Prefer not to say", emoji: "🤐" }
];
function calculateMacros(params) {
  const { age, weight, height, gender, workoutDays, goal } = params;
  let bmr;
  if (gender === "female") {
    bmr = 10 * weight + 6.25 * height - 5 * age - 161;
  } else {
    bmr = 10 * weight + 6.25 * height - 5 * age + 5;
  }
  const activityMultipliers = [1.2, 1.25, 1.3, 1.375, 1.45, 1.55, 1.65, 1.725];
  const tdee = bmr * (activityMultipliers[workoutDays] ?? 1.375);
  let calories;
  let proteinRatio;
  let fatRatio;
  switch (goal) {
    case "lose_weight":
      calories = Math.round(tdee - 500);
      proteinRatio = 0.35;
      fatRatio = 0.25;
      break;
    case "gain_weight":
      calories = Math.round(tdee + 300);
      proteinRatio = 0.25;
      fatRatio = 0.25;
      break;
    case "muscle_gain":
      calories = Math.round(tdee + 250);
      proteinRatio = 0.35;
      fatRatio = 0.25;
      break;
    default:
      calories = Math.round(tdee);
      proteinRatio = 0.3;
      fatRatio = 0.25;
  }
  const carbRatio = 1 - proteinRatio - fatRatio;
  const protein = Math.round(calories * proteinRatio / 4);
  const fat = Math.round(calories * fatRatio / 9);
  const carbs = Math.round(calories * carbRatio / 4);
  return { calories, protein, carbs, fat };
}
export {
  GOALS as G,
  GENDERS as a,
  calculateMacros as c
};
