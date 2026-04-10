import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Plus } from "lucide-react";
import type { MealType } from "@/lib/food-store";
import { MEAL_LABELS } from "@/lib/food-store";

interface AddFoodDialogProps {
  open: boolean;
  onClose: () => void;
  onAdd: (food: {
    name: string;
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    quantity: number;
    mealType: MealType;
  }) => void;
}

const mealTypes: MealType[] = ["breakfast", "lunch", "dinner", "snack"];

export function AddFoodDialog({ open, onClose, onAdd }: AddFoodDialogProps) {
  const [name, setName] = useState("");
  const [calories, setCalories] = useState("");
  const [protein, setProtein] = useState("");
  const [carbs, setCarbs] = useState("");
  const [fat, setFat] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [mealType, setMealType] = useState<MealType>("breakfast");

  const resetForm = () => {
    setName("");
    setCalories("");
    setProtein("");
    setCarbs("");
    setFat("");
    setQuantity("1");
    setMealType("breakfast");
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !calories) return;
    onAdd({
      name,
      calories: parseFloat(calories) || 0,
      protein: parseFloat(protein) || 0,
      carbs: parseFloat(carbs) || 0,
      fat: parseFloat(fat) || 0,
      quantity: parseInt(quantity, 10) || 1,
      mealType,
    });
    resetForm();
    onClose();
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            className="fixed inset-0 bg-foreground/20 backdrop-blur-sm z-40"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.div
            className="fixed inset-x-0 bottom-0 z-50 bg-card rounded-t-3xl shadow-2xl max-h-[90vh] overflow-y-auto"
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
          >
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-card-foreground">Add Food</h2>
                <button
                  onClick={onClose}
                  className="p-2 rounded-full bg-muted text-muted-foreground hover:bg-accent transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-card-foreground mb-1.5 block">Food Name</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Grilled Chicken"
                    className="w-full px-4 py-3 rounded-xl bg-muted text-foreground placeholder:text-muted-foreground border-none outline-none focus:ring-2 focus:ring-primary/30 transition-shadow"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-sm font-medium text-card-foreground mb-1.5 block">Calories</label>
                    <input
                      type="number"
                      value={calories}
                      onChange={(e) => setCalories(e.target.value)}
                      placeholder="0"
                      min="0"
                      className="w-full px-4 py-3 rounded-xl bg-muted text-foreground placeholder:text-muted-foreground border-none outline-none focus:ring-2 focus:ring-primary/30 transition-shadow"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-card-foreground mb-1.5 block">Quantity</label>
                    <input
                      type="number"
                      value={quantity}
                      onChange={(e) => setQuantity(e.target.value)}
                      min="1"
                      className="w-full px-4 py-3 rounded-xl bg-muted text-foreground placeholder:text-muted-foreground border-none outline-none focus:ring-2 focus:ring-primary/30 transition-shadow"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="text-sm font-medium text-protein mb-1.5 block">Protein (g)</label>
                    <input
                      type="number"
                      value={protein}
                      onChange={(e) => setProtein(e.target.value)}
                      placeholder="0"
                      min="0"
                      className="w-full px-4 py-3 rounded-xl bg-muted text-foreground placeholder:text-muted-foreground border-none outline-none focus:ring-2 focus:ring-protein/30 transition-shadow"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-carbs mb-1.5 block">Carbs (g)</label>
                    <input
                      type="number"
                      value={carbs}
                      onChange={(e) => setCarbs(e.target.value)}
                      placeholder="0"
                      min="0"
                      className="w-full px-4 py-3 rounded-xl bg-muted text-foreground placeholder:text-muted-foreground border-none outline-none focus:ring-2 focus:ring-carbs/30 transition-shadow"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-fat mb-1.5 block">Fat (g)</label>
                    <input
                      type="number"
                      value={fat}
                      onChange={(e) => setFat(e.target.value)}
                      placeholder="0"
                      min="0"
                      className="w-full px-4 py-3 rounded-xl bg-muted text-foreground placeholder:text-muted-foreground border-none outline-none focus:ring-2 focus:ring-fat/30 transition-shadow"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-card-foreground mb-2 block">Meal</label>
                  <div className="grid grid-cols-4 gap-2">
                    {mealTypes.map((type) => (
                      <button
                        key={type}
                        type="button"
                        onClick={() => setMealType(type)}
                        className={`px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                          mealType === type
                            ? "bg-primary text-primary-foreground shadow-md"
                            : "bg-muted text-muted-foreground hover:bg-accent"
                        }`}
                      >
                        {MEAL_LABELS[type]}
                      </button>
                    ))}
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-3.5 rounded-xl bg-primary text-primary-foreground font-semibold text-base flex items-center justify-center gap-2 shadow-lg hover:opacity-90 active:scale-[0.98] transition-all"
                >
                  <Plus className="w-5 h-5" />
                  Add Food
                </button>
              </form>
            </div>
            <div className="h-8" />
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
