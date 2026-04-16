import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useCallback, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import {
  getEntries,
  addEntry,
  deleteEntry,
  getTodayDate,
  getDailyTotals,
  getEntriesByMeal,
  loadCalorieGoal,
  getWeeklyHistory,
  type FoodEntry,
  type MealType,
  type FoodSource,
  type DaySummary,
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

import { AIFoodPreview } from "@/components/AIFoodPreview";
import { QuickAddPicker } from "@/components/QuickAddPicker";
import { WeeklyChart } from "@/components/WeeklyChart";

export const Route = createFileRoute("/")({
  component: Dashboard,
  head: () => ({
    meta: [
      { title: "ZyraFit — Daily Calorie & Macro Tracker" },
      { name: "description", content: "Track your daily calories and macros with a beautiful, intuitive interface." },
    ],
  }),
});

function Dashboard() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const today = getTodayDate();
  const [entries, setEntries] = useState<FoodEntry[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMealType, setDialogMealType] = useState<MealType>("breakfast");
  const [quickAddMeal, setQuickAddMeal] = useState<MealType | null>(null);
  const [goal, setGoal] = useState(2000);
  const [loading, setLoading] = useState(true);

  // Redirect unauthenticated users to login, new users to onboarding
  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      navigate({ to: "/welcome" });
      return;
    }
    // Check onboarding status
    supabase
      .from("user_profiles")
      .select("onboarding_completed")
      .eq("user_id", user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (!data?.onboarding_completed) {
          navigate({ to: "/onboarding" });
        }
      });
  }, [user, authLoading, navigate]);

  // Barcode scanner state
  const [scannerOpen, setScannerOpen] = useState(false);
  const [scannedFood, setScannedFood] = useState<ScannedFood | null>(null);
  const [scanLoading, setScanLoading] = useState(false);
  const [scanError, setScanError] = useState<string | null>(null);

  // AI photo state
  const [aiLoading, setAiLoading] = useState(false);
  const aiAbortRef = useRef<AbortController | null>(null);
  const [aiItems, setAiItems] = useState<AIFoodItem[] | null>(null);
  const [aiImageUrl, setAiImageUrl] = useState<string>("");
  const [aiError, setAiError] = useState<string | null>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const [weeklyData, setWeeklyData] = useState<DaySummary[]>([]);

  const refresh = useCallback(async () => {
    const [fetchedEntries, fetchedGoal, fetchedWeekly] = await Promise.all([
      getEntries(today),
      loadCalorieGoal(),
      getWeeklyHistory(),
    ]);
    setEntries(fetchedEntries);
    setGoal(fetchedGoal);
    setWeeklyData(fetchedWeekly);
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
    photoUrl?: string;
  }) => {
    await addEntry({
      ...food,
      date: today,
      source: food.source || "manual",
      barcode: food.barcode || null,
      photoUrl: food.photoUrl || null,
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

  const handlePhotoCapture = async (file: File) => {
    const abortController = new AbortController();
    aiAbortRef.current = abortController;
    setAiLoading(true);
    setAiError(null);
    try {
      const base64 = await captureImageAsBase64(file);
      setAiImageUrl(base64);

      // Upload photo to storage
      let uploadedPhotoUrl: string | null = null;
      const userId = user?.id;
      if (userId) {
        const fileName = `${userId}/${Date.now()}-${file.name}`;
        const { error: uploadError } = await supabase.storage
          .from("food-photos")
          .upload(fileName, file, { contentType: file.type });
        if (!uploadError) {
          const { data: urlData } = supabase.storage
            .from("food-photos")
            .getPublicUrl(fileName);
          uploadedPhotoUrl = urlData.publicUrl;
        }
      }
      // Store the uploaded URL for use when adding, fallback to base64
      uploadedPhotoUrlRef.current = uploadedPhotoUrl || base64;

      if (abortController.signal.aborted) return;
      const result = await analyzePhoto(base64);
      if (abortController.signal.aborted) return;
      setAiLoading(false);
      if (!result.is_food || result.items.length === 0) {
        setAiError("No food detected in this photo. Try again with a clearer shot.");
        setTimeout(() => setAiError(null), 3000);
      } else {
        setAiItems(result.items);
      }
    } catch (err) {
      if (abortController.signal.aborted) return;
      setAiLoading(false);
      setAiError(err instanceof Error ? err.message : "AI analysis failed");
      setTimeout(() => setAiError(null), 3000);
    }
  };

  const handleCancelAiAnalysis = useCallback(() => {
    aiAbortRef.current?.abort();
    aiAbortRef.current = null;
    setAiLoading(false);
    setAiImageUrl("");
    setAiItems(null);
  }, []);
  const uploadedPhotoUrlRef = useRef<string | null>(null);

  const handleAddFromAi = async (foods: {
    name: string;
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    quantity: number;
    mealType: MealType;
    source: "ai";
  }[]) => {
    const photoUrl = uploadedPhotoUrlRef.current;
    for (const food of foods) {
      await handleAdd({ ...food, photoUrl: photoUrl || undefined });
    }
    setAiItems(null);
    setAiImageUrl("");
    uploadedPhotoUrlRef.current = null;
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

      {/* Weekly Chart */}
      <div className="px-6 mb-6">
        <WeeklyChart data={weeklyData} goal={goal} />
      </div>

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
              onAdd={(meal) => setQuickAddMeal(meal)}
            />
          </motion.div>
        ))}
      </div>

      <BottomNav onAddClick={() => setQuickAddMeal("breakfast")} />

      {/* Quick Add Picker */}
      <QuickAddPicker
        mealType={quickAddMeal}
        onClose={() => setQuickAddMeal(null)}
        onAiPhoto={() => {
          const meal = quickAddMeal;
          setQuickAddMeal(null);
          if (meal) setDialogMealType(meal);
          setTimeout(() => cameraInputRef.current?.click(), 100);
        }}
        onBarcodeScan={() => {
          const meal = quickAddMeal;
          setQuickAddMeal(null);
          if (meal) setDialogMealType(meal);
          setScannerOpen(true);
        }}
        onManual={() => {
          const meal = quickAddMeal;
          setQuickAddMeal(null);
          if (meal) setDialogMealType(meal);
          setDialogOpen(true);
        }}
      />

      <AddFoodDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        onAdd={handleAdd}
        initialMealType={dialogMealType}
        onScanClick={() => {
          setDialogOpen(false);
          setScannerOpen(true);
        }}
        onAiClick={() => {
          setDialogOpen(false);
          setTimeout(() => cameraInputRef.current?.click(), 100);
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

      {/* Hidden camera input for AI photo */}
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handlePhotoCapture(file);
          e.target.value = "";
        }}
        className="hidden"
      />

      {/* AI Food Preview */}
      <AnimatePresence>
        {aiItems && (
          <AIFoodPreview
            items={aiItems}
            imageUrl={aiImageUrl}
            onAdd={handleAddFromAi}
            onBack={() => { setAiItems(null); setAiImageUrl(""); }}
          />
        )}
      </AnimatePresence>

      {/* Scan/AI loading overlay */}
      <AnimatePresence>
        {(scanLoading || aiLoading) && (
          <motion.div
            className="fixed inset-0 z-50 bg-background/95 backdrop-blur-xl flex flex-col items-center justify-center px-8"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            {aiLoading && aiImageUrl ? (
              <>
                {/* Photo with shimmer overlay */}
                <motion.div
                  className="relative w-52 h-52 rounded-3xl overflow-hidden shadow-2xl shadow-primary/10 mb-8"
                  initial={{ scale: 0.85, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: "spring", damping: 20, stiffness: 200 }}
                >
                  <img src={aiImageUrl} alt="Analyzing" className="w-full h-full object-cover" />
                  {/* Shimmer sweep */}
                  <motion.div
                    className="absolute inset-0"
                    style={{
                      background: "linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.25) 50%, transparent 60%)",
                    }}
                    animate={{ x: ["-100%", "200%"] }}
                    transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut", repeatDelay: 0.3 }}
                  />
                  {/* Scanning line */}
                  <motion.div
                    className="absolute left-0 right-0 h-0.5 bg-primary/70 shadow-[0_0_12px_var(--color-primary)]"
                    animate={{ top: ["0%", "100%", "0%"] }}
                    transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
                  />
                </motion.div>

                {/* Shimmer placeholder rows */}
                <div className="w-full max-w-[260px] space-y-3 mb-6">
                  {[0.8, 0.6, 0.45].map((w, i) => (
                    <motion.div
                      key={i}
                      className="relative h-3.5 rounded-full bg-muted/60 overflow-hidden"
                      style={{ width: `${w * 100}%` }}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.3 + i * 0.1 }}
                    >
                      <motion.div
                        className="absolute inset-0"
                        style={{
                          background: "linear-gradient(90deg, transparent, var(--color-muted) 50%, transparent)",
                        }}
                        animate={{ x: ["-100%", "200%"] }}
                        transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut", delay: i * 0.15 }}
                      />
                    </motion.div>
                  ))}
                </div>

                <motion.p
                  className="text-foreground font-semibold text-[15px]"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.2 }}
                >
                  Analyzing your meal…
                </motion.p>
                <motion.p
                  className="text-muted-foreground text-xs mt-1"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: [0.4, 0.8, 0.4] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  Detecting calories & macros
                </motion.p>

                <motion.button
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 1.5 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleCancelAiAnalysis}
                  className="mt-6 px-6 py-2.5 rounded-2xl bg-muted/80 text-muted-foreground text-sm font-medium border border-border/40 active:bg-muted"
                >
                  Cancel
                </motion.button>
              </>
            ) : (
              <>
                <motion.div
                  className="w-14 h-14 rounded-full border-[3px] border-primary border-t-transparent"
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                />
                <p className="text-foreground font-medium mt-4">Looking up food...</p>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Error toast */}
      <AnimatePresence>
        {(scanError || aiError) && (
          <motion.div
            className="fixed top-16 inset-x-6 z-50 bg-destructive text-destructive-foreground rounded-2xl p-4 text-center shadow-lg"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <p className="font-medium text-sm">{scanError || aiError}</p>
            {scanError && <p className="text-xs mt-1 opacity-80">Opening manual entry...</p>}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
