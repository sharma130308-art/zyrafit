import { createFileRoute } from "@tanstack/react-router";
import { useState, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  getEntries,
  addEntry,
  deleteEntry,
  getTodayDate,
  getDailyTotals,
  getEntriesByMeal,
  loadCalorieGoal,
  type FoodEntry,
  type MealType,
  type FoodSource,
} from "@/lib/food-store";
import { lookupBarcode, type ScannedFood } from "@/lib/barcode-api";
import { analyzePhoto, captureImageAsBase64, type AIFoodItem } from "@/lib/food-ai";
import { CalorieRing } from "@/components/CalorieRing";
import { MacroBar } from "@/components/MacroBar";
import { MealSection } from "@/components/MealSection";
import { AddFoodDialog } from "@/components/AddFoodDialog";
import { BottomNav } from "@/components/BottomNav";
import { BarcodeScanner } from "@/components/BarcodeScanner";
import { FoodPreview } from "@/components/FoodPreview";
import { PhotoCapture } from "@/components/PhotoCapture";
import { AIFoodPreview } from "@/components/AIFoodPreview";

export const Route = createFileRoute("/")({
  component: Dashboard,
  head: () => ({
    meta: [
      { title: "CalTrack — Daily Calorie & Macro Tracker" },
      { name: "description", content: "Track your daily calories and macros with a beautiful, intuitive interface." },
    ],
  }),
});

function Dashboard() {
  const today = getTodayDate();
  const [entries, setEntries] = useState<FoodEntry[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [goal, setGoal] = useState(2000);
  const [loading, setLoading] = useState(true);

  // Barcode scanner state
  const [scannerOpen, setScannerOpen] = useState(false);
  const [scannedFood, setScannedFood] = useState<ScannedFood | null>(null);
  const [scanLoading, setScanLoading] = useState(false);
  const [scanError, setScanError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    const [fetchedEntries, fetchedGoal] = await Promise.all([
      getEntries(today),
      loadCalorieGoal(),
    ]);
    setEntries(fetchedEntries);
    setGoal(fetchedGoal);
    setLoading(false);
  }, [today]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const handleAdd = async (food: {
    name: string;
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    quantity: number;
    mealType: MealType;
    barcode?: string;
    source?: FoodSource;
  }) => {
    await addEntry({
      ...food,
      date: today,
      source: food.source || "manual",
      barcode: food.barcode || null,
    });
    refresh();
  };

  const handleDelete = async (id: string) => {
    await deleteEntry(id);
    refresh();
  };

  const handleBarcodeScan = async (barcode: string) => {
    setScannerOpen(false);
    setScanLoading(true);
    setScanError(null);

    const food = await lookupBarcode(barcode);
    setScanLoading(false);

    if (food) {
      setScannedFood(food);
    } else {
      setScanError(`No food found for barcode ${barcode}`);
      // Auto-dismiss error and open manual add
      setTimeout(() => {
        setScanError(null);
        setDialogOpen(true);
      }, 2500);
    }
  };

  const handleAddFromScan = async (food: {
    name: string;
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    quantity: number;
    mealType: MealType;
    barcode: string;
  }) => {
    await handleAdd({ ...food, source: "barcode" });
    setScannedFood(null);
  };

  const totals = getDailyTotals(entries);
  const byMeal = getEntriesByMeal(entries);
  const mealTypes: MealType[] = ["breakfast", "lunch", "dinner", "snack"];

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <motion.div
          className="w-12 h-12 rounded-full border-4 border-primary border-t-transparent"
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-28">
      {/* Header */}
      <div className="px-6 pt-14 pb-2">
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
          <p className="text-sm text-muted-foreground">Today</p>
          <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
        </motion.div>
      </div>

      {/* Calorie Ring */}
      <motion.div
        className="flex justify-center py-6"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.1 }}
      >
        <CalorieRing consumed={totals.calories} goal={goal} />
      </motion.div>

      {/* Macros */}
      <motion.div
        className="px-6 mb-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <div className="rounded-2xl bg-card p-4 shadow-sm border border-border/50 flex gap-4">
          <MacroBar label="Protein" current={totals.protein} color="var(--color-protein)" />
          <MacroBar label="Carbs" current={totals.carbs} color="var(--color-carbs)" />
          <MacroBar label="Fat" current={totals.fat} color="var(--color-fat)" />
        </div>
      </motion.div>

      {/* Meal Sections */}
      <div className="px-6 space-y-3">
        {mealTypes.map((type, i) => (
          <motion.div
            key={type}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 + i * 0.05 }}
          >
            <MealSection
              mealType={type}
              entries={byMeal[type]}
              onDelete={handleDelete}
            />
          </motion.div>
        ))}
      </div>

      <BottomNav
        onAddClick={() => setDialogOpen(true)}
        onScanClick={() => setScannerOpen(true)}
      />

      <AddFoodDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        onAdd={handleAdd}
        onScanClick={() => {
          setDialogOpen(false);
          setScannerOpen(true);
        }}
      />

      {/* Barcode Scanner */}
      <BarcodeScanner
        open={scannerOpen}
        onClose={() => setScannerOpen(false)}
        onScan={handleBarcodeScan}
      />

      {/* Scanned Food Preview */}
      <AnimatePresence>
        {scannedFood && (
          <FoodPreview
            food={scannedFood}
            onAdd={handleAddFromScan}
            onBack={() => setScannedFood(null)}
          />
        )}
      </AnimatePresence>

      {/* Scan loading overlay */}
      <AnimatePresence>
        {scanLoading && (
          <motion.div
            className="fixed inset-0 z-50 bg-background/90 backdrop-blur-md flex flex-col items-center justify-center gap-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="w-16 h-16 rounded-full border-4 border-primary border-t-transparent"
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            />
            <p className="text-foreground font-medium">Looking up food...</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Scan error toast */}
      <AnimatePresence>
        {scanError && (
          <motion.div
            className="fixed top-16 inset-x-6 z-50 bg-destructive text-destructive-foreground rounded-2xl p-4 text-center shadow-lg"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <p className="font-medium text-sm">{scanError}</p>
            <p className="text-xs mt-1 opacity-80">Opening manual entry...</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
