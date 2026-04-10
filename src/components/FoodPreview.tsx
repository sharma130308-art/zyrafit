import { useState } from "react";
import { motion } from "framer-motion";
import { Plus, Minus, ArrowLeft, ScanBarcode } from "lucide-react";
import type { ScannedFood } from "@/lib/barcode-api";
import { calculateNutrition } from "@/lib/barcode-api";
import type { MealType } from "@/lib/food-store";
import { MEAL_LABELS } from "@/lib/food-store";

interface FoodPreviewProps {
  food: ScannedFood;
  onAdd: (food: {
    name: string;
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    quantity: number;
    mealType: MealType;
    barcode: string;
  }) => void;
  onBack: () => void;
}

const mealTypes: MealType[] = ["breakfast", "lunch", "dinner", "snack"];

export function FoodPreview({ food, onAdd, onBack }: FoodPreviewProps) {
  const [grams, setGrams] = useState(food.servingGrams || 100);
  const [mealType, setMealType] = useState<MealType>("lunch");
  const [adding, setAdding] = useState(false);

  const nutrition = calculateNutrition(food, grams);

  const adjustGrams = (delta: number) => {
    setGrams((prev) => Math.max(10, prev + delta));
  };

  const handleAdd = async () => {
    setAdding(true);
    await onAdd({
      name: food.brand ? `${food.name} (${food.brand})` : food.name,
      calories: nutrition.calories,
      protein: nutrition.protein,
      carbs: nutrition.carbs,
      fat: nutrition.fat,
      quantity: 1,
      mealType,
      barcode: food.barcode,
    });
    setAdding(false);
  };

  return (
    <motion.div
      className="fixed inset-0 z-50 bg-background flex flex-col"
      initial={{ x: "100%" }}
      animate={{ x: 0 }}
      exit={{ x: "100%" }}
      transition={{ type: "spring", damping: 30, stiffness: 300 }}
    >
      {/* Header */}
      <div className="flex items-center gap-3 px-5 pt-14 pb-4">
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={onBack}
          className="w-10 h-10 rounded-full bg-muted flex items-center justify-center"
        >
          <ArrowLeft className="w-5 h-5 text-foreground" />
        </motion.button>
        <h2 className="text-lg font-bold text-foreground">Food Found</h2>
      </div>

      <div className="flex-1 overflow-y-auto px-6 pb-6">
        {/* Product card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="rounded-3xl bg-card border border-border/40 shadow-sm overflow-hidden mb-5"
        >
          {food.imageUrl ? (
            <div className="h-48 bg-muted flex items-center justify-center overflow-hidden">
              <img
                src={food.imageUrl}
                alt={food.name}
                className="w-full h-full object-contain p-4"
                onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
              />
            </div>
          ) : (
            <div className="h-32 bg-muted/50 flex items-center justify-center">
              <ScanBarcode className="w-12 h-12 text-muted-foreground/30" />
            </div>
          )}

          <div className="p-5">
            <h3 className="text-xl font-bold text-card-foreground">{food.name}</h3>
            {food.brand && (
              <p className="text-sm text-muted-foreground mt-0.5">{food.brand}</p>
            )}
            <p className="text-xs text-muted-foreground/60 mt-1">
              Barcode: {food.barcode}
            </p>
          </div>
        </motion.div>

        {/* Quantity selector */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="rounded-2xl bg-card border border-border/40 shadow-sm p-5 mb-5"
        >
          <label className="text-[13px] font-medium text-muted-foreground uppercase tracking-wide block mb-3">
            Serving Size
          </label>
          <div className="flex items-center justify-between">
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={() => adjustGrams(-10)}
              className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center"
            >
              <Minus className="w-5 h-5 text-foreground" />
            </motion.button>

            <div className="text-center">
              <input
                type="number"
                value={grams}
                onChange={(e) => setGrams(Math.max(1, parseInt(e.target.value) || 0))}
                className="text-3xl font-bold text-foreground bg-transparent text-center w-24 outline-none"
              />
              <p className="text-xs text-muted-foreground">grams</p>
            </div>

            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={() => adjustGrams(10)}
              className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center"
            >
              <Plus className="w-5 h-5 text-foreground" />
            </motion.button>
          </div>

          {food.servingSize && food.servingSize !== "100g" && (
            <button
              onClick={() => setGrams(food.servingGrams)}
              className="mt-3 w-full py-2 text-sm text-primary font-medium bg-primary/5 rounded-xl"
            >
              Use serving size ({food.servingSize})
            </button>
          )}
        </motion.div>

        {/* Nutrition info */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="rounded-2xl bg-card border border-border/40 shadow-sm p-5 mb-5"
        >
          <label className="text-[13px] font-medium text-muted-foreground uppercase tracking-wide block mb-4">
            Nutrition for {grams}g
          </label>

          <div className="text-center mb-4">
            <motion.span
              key={nutrition.calories}
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              className="text-4xl font-extrabold text-calories"
            >
              {nutrition.calories}
            </motion.span>
            <p className="text-sm text-muted-foreground">calories</p>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="text-center p-3 rounded-xl bg-protein/8">
              <span className="text-lg font-bold text-protein">{nutrition.protein}g</span>
              <p className="text-[11px] text-muted-foreground mt-0.5">Protein</p>
            </div>
            <div className="text-center p-3 rounded-xl bg-carbs/8">
              <span className="text-lg font-bold text-carbs">{nutrition.carbs}g</span>
              <p className="text-[11px] text-muted-foreground mt-0.5">Carbs</p>
            </div>
            <div className="text-center p-3 rounded-xl bg-fat/8">
              <span className="text-lg font-bold text-fat">{nutrition.fat}g</span>
              <p className="text-[11px] text-muted-foreground mt-0.5">Fat</p>
            </div>
          </div>
        </motion.div>

        {/* Meal selector */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="mb-5"
        >
          <label className="text-[13px] font-medium text-muted-foreground uppercase tracking-wide block mb-2">
            Meal
          </label>
          <div className="grid grid-cols-4 gap-2">
            {mealTypes.map((type) => (
              <motion.button
                key={type}
                whileTap={{ scale: 0.95 }}
                onClick={() => setMealType(type)}
                className={`px-3 py-2.5 rounded-2xl text-[13px] font-semibold transition-all ${
                  mealType === type
                    ? "bg-primary text-primary-foreground shadow-md shadow-primary/20"
                    : "bg-muted/60 text-muted-foreground border border-border/30"
                }`}
              >
                {MEAL_LABELS[type]}
              </motion.button>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Add button - fixed bottom */}
      <div className="px-6 pb-[max(1.5rem,env(safe-area-inset-bottom))]">
        <motion.button
          whileTap={{ scale: 0.97 }}
          disabled={adding}
          onClick={handleAdd}
          className="w-full py-4 rounded-2xl bg-primary text-primary-foreground font-semibold text-[15px] flex items-center justify-center gap-2 shadow-lg shadow-primary/25 disabled:opacity-60"
        >
          <Plus className="w-5 h-5" />
          {adding ? "Adding..." : `Add ${nutrition.calories} cal to diary`}
        </motion.button>
      </div>
    </motion.div>
  );
}
