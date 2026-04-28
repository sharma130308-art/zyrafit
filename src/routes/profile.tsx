import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useEffect, useCallback, lazy, Suspense } from "react";
import { loadCalorieGoal, saveCalorieGoal } from "@/lib/food-store";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { calculateMacros, GOALS, GENDERS } from "@/lib/macro-calc";
import {
  User,
  Target,
  LogOut,
  LogIn,
  Pencil,
  Ruler,
  Weight,
  Dumbbell,
  Check,
  X,
  Plus,
  TrendingDown,
  TrendingUp,
  Trash2,
  Camera,
  Loader2,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { format, parseISO, subDays, subMonths } from "date-fns";
import { BottomNav } from "@/components/BottomNav";
import { RemindersToggle } from "@/components/RemindersToggle";
import { MealReminderTimes } from "@/components/MealReminderTimes";

// Lazy-load heavy chart (pulls in recharts) and the body-composition gauge card.
// These are below-the-fold and only matter once the user has weight logs.
const WeightChart = lazy(() => import("@/components/profile/WeightChart"));
const BodyCompositionCard = lazy(() => import("@/components/profile/BodyCompositionCard"));

export const Route = createFileRoute("/profile")({
  component: ProfilePage,
  head: () => ({
    meta: [
      { title: "ZyraFit — Profile" },
      { name: "description", content: "View and edit your profile and macro goals." },
    ],
  }),
});

interface ProfileData {
  age: number | null;
  weight_kg: number | null;
  gender: string | null;
  workout_days_per_week: number | null;
  goal: string | null;
  target_weight_kg: number | null;
  target_bmi: number | null;
  target_body_fat_percent: number | null;
}

interface WeightLog {
  id: string;
  weight_kg: number;
  logged_at: string;
  bmi: number | null;
  body_fat_percent: number | null;
  body_fat_mass_kg: number | null;
  height_m: number | null;
}

function ProfilePage() {
  const { user, loading: authLoading, signOut } = useAuth();
  const navigate = useNavigate();
  const [goal, setGoal] = useState(2000);
  const [profileLoading, setProfileLoading] = useState(true);
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [editingProfile, setEditingProfile] = useState(false);
  const [saving, setSaving] = useState(false);

  // Edit form state
  const [editAge, setEditAge] = useState("");
  const [editWeight, setEditWeight] = useState("");
  const [editHeight, setEditHeight] = useState("170");
  const [editGender, setEditGender] = useState("");
  const [editWorkoutDays, setEditWorkoutDays] = useState(3);
  const [editGoal, setEditGoal] = useState("");
  const [editTargetWeight, setEditTargetWeight] = useState("");
  const [editTargetBmi, setEditTargetBmi] = useState("");
  const [editTargetBodyFat, setEditTargetBodyFat] = useState("");

  // Macro display
  const [macros, setMacros] = useState({ calories: 2000, protein: 0, carbs: 0, fat: 0 });

  // Weight history
  const [weightLogs, setWeightLogs] = useState<WeightLog[]>([]);
  const [newWeight, setNewWeight] = useState("");
  const [newBmi, setNewBmi] = useState("");
  const [newBodyFat, setNewBodyFat] = useState("");
  const [newBodyFatMass, setNewBodyFatMass] = useState("");
  const [newHeightM, setNewHeightM] = useState("");
  const [addingWeight, setAddingWeight] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [showManualFields, setShowManualFields] = useState(false);
  const [activeChart, setActiveChart] = useState<"weight" | "bmi" | "bodyfat">("weight");
  const [timeRange, setTimeRange] = useState<"1w" | "1m" | "3m" | "all">("all");

  const filteredLogs = (() => {
    if (timeRange === "all") return weightLogs;
    const now = new Date();
    const cutoff = timeRange === "1w" ? subDays(now, 7) : timeRange === "1m" ? subMonths(now, 1) : subMonths(now, 3);
    return weightLogs.filter(l => parseISO(l.logged_at) >= cutoff);
  })();

  const fetchWeightLogs = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from("weight_logs")
      .select("*")
      .eq("user_id", user.id)
      .order("logged_at", { ascending: true })
      .limit(90);
    if (data) setWeightLogs(data.map((d: Record<string, unknown>) => ({
      id: d.id as string,
      weight_kg: Number(d.weight_kg),
      logged_at: d.logged_at as string,
      bmi: d.bmi != null ? Number(d.bmi) : null,
      body_fat_percent: d.body_fat_percent != null ? Number(d.body_fat_percent) : null,
      body_fat_mass_kg: d.body_fat_mass_kg != null ? Number(d.body_fat_mass_kg) : null,
      height_m: d.height_m != null ? Number(d.height_m) : null,
    })));
  }, [user]);

  const addWeightLog = async () => {
    if (!user || !newWeight) return;
    setAddingWeight(true);
    await supabase.from("weight_logs").insert({
      user_id: user.id,
      weight_kg: parseFloat(newWeight),
      logged_at: new Date().toISOString().slice(0, 10),
      bmi: newBmi ? parseFloat(newBmi) : null,
      body_fat_percent: newBodyFat ? parseFloat(newBodyFat) : null,
      body_fat_mass_kg: newBodyFatMass ? parseFloat(newBodyFatMass) : null,
      height_m: newHeightM ? parseFloat(newHeightM) : null,
    });
    setNewWeight("");
    setNewBmi("");
    setNewBodyFat("");
    setNewBodyFatMass("");
    setNewHeightM("");
    setShowManualFields(false);
    setAddingWeight(false);
    fetchWeightLogs();
  };

  const deleteWeightLog = async (id: string) => {
    await supabase.from("weight_logs").delete().eq("id", id);
    fetchWeightLogs();
  };

  const handleScanPhoto = async () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.capture = "environment";
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file || !user) return;

      // Downscale before sending — body scan receipts are mostly text,
      // so we need legible resolution but not full-camera megapixels.
      const { captureImageAsBase64 } = await import("@/lib/food-ai");
      const base64 = await captureImageAsBase64(file);

      // Offline → queue and bail out
      if (typeof navigator !== "undefined" && !navigator.onLine) {
        const { enqueueBodyScan } = await import("@/lib/ai-scan-queue");
        const { toast } = await import("sonner");
        await enqueueBodyScan(base64);
        toast("Body scan queued — will read when back online");
        return;
      }

      setScanning(true);
      try {
        const { data, error } = await supabase.functions.invoke("scan-body-stats", {
          body: { imageBase64: base64 },
        });

        if (error) {
          // Treat network failure as "queue and try later" if we just lost connection
          if (typeof navigator !== "undefined" && !navigator.onLine) {
            const { enqueueBodyScan } = await import("@/lib/ai-scan-queue");
            const { toast } = await import("sonner");
            await enqueueBodyScan(base64);
            toast("Body scan queued — will read when back online");
            setScanning(false);
            return;
          }
          throw error;
        }
        if (data?.ok === false) {
          alert(data.error || "Scan failed. Please try again.");
          setScanning(false);
          return;
        }
        if (!data?.found) {
          alert("Could not find body stats in this image. Try a clearer photo.");
          setScanning(false);
          return;
        }

        // Insert the scanned data
        await supabase.from("weight_logs").insert({
          user_id: user.id,
          weight_kg: data.weight_kg || 0,
          logged_at: data.date || new Date().toISOString().slice(0, 10),
          bmi: data.bmi || null,
          body_fat_percent: data.body_fat_percent || null,
          body_fat_mass_kg: data.body_fat_mass_kg || null,
          height_m: data.height_m || null,
        });

        fetchWeightLogs();
      } catch (err) {
        console.error("Scan error:", err);
        alert("Failed to scan. Please try again.");
      }
      setScanning(false);
    };
    input.click();
  };

  // Hydrate from cache instantly
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const cached = localStorage.getItem("zyrafit_profile_cache");
      if (!cached) return;
      const c = JSON.parse(cached);
      if (c.profile) {
        setProfile(c.profile);
        setEditAge(String(c.profile.age ?? ""));
        setEditWeight(String(c.profile.weight_kg ?? ""));
        setEditGender(c.profile.gender ?? "");
        setEditWorkoutDays(c.profile.workout_days_per_week ?? 3);
        setEditGoal(c.profile.goal ?? "");
        setEditTargetWeight(String(c.profile.target_weight_kg ?? ""));
        setEditTargetBmi(String(c.profile.target_bmi ?? ""));
        setEditTargetBodyFat(String(c.profile.target_body_fat_percent ?? ""));
      }
      if (c.macros) setMacros(c.macros);
      if (c.goal) setGoal(c.goal);
      if (c.weightLogs) setWeightLogs(c.weightLogs);
      setProfileLoading(false);
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      setProfileLoading(false);
      return;
    }
    // All 4 queries in parallel — single round-trip
    Promise.all([
      loadCalorieGoal(),
      supabase.from("user_profiles").select("*").eq("user_id", user.id).maybeSingle(),
      supabase.from("user_settings").select("*").eq("user_id", user.id).maybeSingle(),
      supabase
        .from("weight_logs")
        .select("*")
        .eq("user_id", user.id)
        .order("logged_at", { ascending: true })
        .limit(90),
    ]).then(([fetchedGoal, profileRes, settingsRes, weightRes]) => {
      setGoal(fetchedGoal);
      let profileData: ProfileData | null = null;
      let macrosData = { calories: fetchedGoal, protein: 0, carbs: 0, fat: 0 };
      let logsData: WeightLog[] = [];

      if (profileRes.data) {
        const p = profileRes.data as unknown as Record<string, unknown>;
        profileData = {
          age: profileRes.data.age,
          weight_kg: profileRes.data.weight_kg,
          gender: profileRes.data.gender,
          workout_days_per_week: profileRes.data.workout_days_per_week,
          goal: profileRes.data.goal,
          target_weight_kg: (p.target_weight_kg as number) ?? null,
          target_bmi: (p.target_bmi as number) ?? null,
          target_body_fat_percent: (p.target_body_fat_percent as number) ?? null,
        };
        setProfile(profileData);
        setEditAge(String(profileData.age ?? ""));
        setEditWeight(String(profileData.weight_kg ?? ""));
        setEditGender(profileData.gender ?? "");
        setEditWorkoutDays(profileData.workout_days_per_week ?? 3);
        setEditGoal(profileData.goal ?? "");
        setEditTargetWeight(String(profileData.target_weight_kg ?? ""));
        setEditTargetBmi(String(profileData.target_bmi ?? ""));
        setEditTargetBodyFat(String(profileData.target_body_fat_percent ?? ""));
      }
      if (settingsRes.data) {
        const s = settingsRes.data as unknown as Record<string, unknown>;
        macrosData = {
          calories: settingsRes.data.daily_calorie_goal,
          protein: (s.protein_goal as number) ?? 0,
          carbs: (s.carbs_goal as number) ?? 0,
          fat: (s.fat_goal as number) ?? 0,
        };
        setMacros(macrosData);
      }
      if (weightRes.data) {
        logsData = weightRes.data.map((d: Record<string, unknown>) => ({
          id: d.id as string,
          weight_kg: Number(d.weight_kg),
          logged_at: d.logged_at as string,
          bmi: d.bmi != null ? Number(d.bmi) : null,
          body_fat_percent: d.body_fat_percent != null ? Number(d.body_fat_percent) : null,
          body_fat_mass_kg: d.body_fat_mass_kg != null ? Number(d.body_fat_mass_kg) : null,
          height_m: d.height_m != null ? Number(d.height_m) : null,
        }));
        setWeightLogs(logsData);
      }
      setProfileLoading(false);

      try {
        localStorage.setItem(
          "zyrafit_profile_cache",
          JSON.stringify({ profile: profileData, macros: macrosData, goal: fetchedGoal, weightLogs: logsData })
        );
      } catch {
        /* ignore */
      }
    }).catch((err) => {
      console.error("[profile] load failed:", err);
      setProfileLoading(false);
    });
  }, [user, authLoading]);

  const startEditing = () => {
    setEditingProfile(true);
  };

  const cancelEditing = () => {
    if (profile) {
      setEditAge(String(profile.age ?? ""));
      setEditWeight(String(profile.weight_kg ?? ""));
      setEditGender(profile.gender ?? "");
      setEditWorkoutDays(profile.workout_days_per_week ?? 3);
      setEditGoal(profile.goal ?? "");
      setEditTargetWeight(String(profile.target_weight_kg ?? ""));
      setEditTargetBmi(String(profile.target_bmi ?? ""));
      setEditTargetBodyFat(String(profile.target_body_fat_percent ?? ""));
    }
    setEditingProfile(false);
  };

  const handleSaveProfile = async () => {
    if (!user) return;
    setSaving(true);

    const ageNum = parseInt(editAge);
    const weightNum = parseFloat(editWeight);
    const heightNum = parseFloat(editHeight) || 170;
    const targetWeightNum = editTargetWeight ? parseFloat(editTargetWeight) : null;
    const targetBmiNum = editTargetBmi ? parseFloat(editTargetBmi) : null;
    const targetBodyFatNum = editTargetBodyFat ? parseFloat(editTargetBodyFat) : null;

    const newMacros = calculateMacros({
      age: ageNum,
      weight: weightNum,
      height: heightNum,
      gender: editGender,
      workoutDays: editWorkoutDays,
      goal: editGoal,
    });

    await Promise.all([
      supabase.from("user_profiles").upsert({
        user_id: user.id,
        age: ageNum,
        weight_kg: weightNum,
        gender: editGender,
        workout_days_per_week: editWorkoutDays,
        goal: editGoal,
        target_weight_kg: targetWeightNum,
      }, { onConflict: "user_id" }).then(() => {
        // Update new goal columns separately since types may not include them yet
        return (supabase.from("user_profiles") as any).update({
          target_bmi: targetBmiNum,
          target_body_fat_percent: targetBodyFatNum,
        }).eq("user_id", user.id);
      }),
      supabase.from("user_settings").upsert({
        user_id: user.id,
        daily_calorie_goal: newMacros.calories,
        protein_goal: newMacros.protein,
        carbs_goal: newMacros.carbs,
        fat_goal: newMacros.fat,
      }, { onConflict: "user_id" }),
    ]);

    setGoal(newMacros.calories);
    setMacros(newMacros);
    setProfile({
      age: ageNum,
      weight_kg: weightNum,
      gender: editGender,
      workout_days_per_week: editWorkoutDays,
      goal: editGoal,
      target_weight_kg: targetWeightNum,
      target_bmi: targetBmiNum,
      target_body_fat_percent: targetBodyFatNum,
    });
    setEditingProfile(false);
    setSaving(false);
  };

  const handleSignOut = async () => {
    await signOut();
    navigate({ to: "/" });
  };

  const goalLabel = GOALS.find((g) => g.value === profile?.goal)?.label ?? "—";
  const genderLabel = GENDERS.find((g) => g.value === profile?.gender)?.label ?? "—";

  return (
    <div className="min-h-screen bg-background pb-28">
      <div className="px-6 pt-14 pb-6">
        <h1 className="text-2xl font-bold text-foreground">Profile</h1>
      </div>

      <div className="px-6 space-y-4">
        {/* User card */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl bg-card p-6 shadow-sm border border-border/50 flex flex-col items-center gap-4"
        >
          <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center">
            <User className="w-10 h-10 text-primary" />
          </div>
          {user ? (
            <div className="text-center">
              <h2 className="text-lg font-semibold text-card-foreground">{user.email}</h2>
              <p className="text-sm text-muted-foreground">Syncing across devices</p>
            </div>
          ) : (
            <div className="text-center">
              <h2 className="text-lg font-semibold text-card-foreground">Guest</h2>
              <p className="text-sm text-muted-foreground">Sign in to sync your data</p>
            </div>
          )}
        </motion.div>

        {/* Profile details / edit */}
        {user && !profileLoading && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="rounded-2xl bg-card shadow-sm border border-border/50 overflow-hidden"
          >
            <div className="flex items-center justify-between p-5 pb-3">
              <h3 className="font-semibold text-card-foreground">Your Details</h3>
              {!editingProfile ? (
                <button
                  onClick={startEditing}
                  className="flex items-center gap-1 text-sm text-primary font-medium"
                >
                  <Pencil className="w-3.5 h-3.5" /> Edit
                </button>
              ) : (
                <button
                  onClick={cancelEditing}
                  className="flex items-center gap-1 text-sm text-muted-foreground font-medium"
                >
                  <X className="w-3.5 h-3.5" /> Cancel
                </button>
              )}
            </div>

            <AnimatePresence mode="wait">
              {!editingProfile ? (
                <motion.div
                  key="view"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="px-5 pb-5 space-y-3"
                >
                  <ProfileRow icon={<User className="w-4 h-4" />} label="Gender" value={genderLabel} />
                  <ProfileRow icon={<User className="w-4 h-4" />} label="Age" value={profile?.age ? `${profile.age} years` : "—"} />
                  <ProfileRow icon={<Weight className="w-4 h-4" />} label="Weight" value={profile?.weight_kg ? `${profile.weight_kg} kg` : "—"} />
                  <ProfileRow icon={<Dumbbell className="w-4 h-4" />} label="Workouts" value={profile?.workout_days_per_week != null ? `${profile.workout_days_per_week} days/week` : "—"} />
                  <ProfileRow icon={<Target className="w-4 h-4" />} label="Goal" value={goalLabel} />
                  <ProfileRow icon={<Target className="w-4 h-4" />} label="Target Weight" value={profile?.target_weight_kg ? `${profile.target_weight_kg} kg` : "—"} />
                  <ProfileRow icon={<Target className="w-4 h-4" />} label="Target BMI" value={profile?.target_bmi ? `${profile.target_bmi}` : "—"} />
                  <ProfileRow icon={<Target className="w-4 h-4" />} label="Target Body Fat" value={profile?.target_body_fat_percent ? `${profile.target_body_fat_percent}%` : "—"} />
                </motion.div>
              ) : (
                <motion.div
                  key="edit"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="px-5 pb-5 space-y-4"
                >
                  {/* Gender */}
                  <div>
                    <label className="text-xs text-muted-foreground mb-1.5 block">Gender</label>
                    <div className="grid grid-cols-2 gap-2">
                      {GENDERS.map((g) => (
                        <button
                          key={g.value}
                          onClick={() => setEditGender(g.value)}
                          className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border text-sm transition-all ${
                            editGender === g.value
                              ? "border-primary bg-primary/10 text-foreground font-medium"
                              : "border-border/50 bg-muted/50 text-muted-foreground"
                          }`}
                        >
                          <span>{g.emoji}</span> {g.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Age */}
                  <div>
                    <label className="text-xs text-muted-foreground mb-1.5 block">Age</label>
                    <input
                      type="number"
                      value={editAge}
                      onChange={(e) => setEditAge(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl bg-muted text-foreground border-none outline-none focus:ring-2 focus:ring-primary/30"
                      min="10"
                      max="120"
                    />
                  </div>

                  {/* Height */}
                  <div>
                    <label className="text-xs text-muted-foreground mb-1.5 block">Height (cm)</label>
                    <input
                      type="number"
                      value={editHeight}
                      onChange={(e) => setEditHeight(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl bg-muted text-foreground border-none outline-none focus:ring-2 focus:ring-primary/30"
                      min="50"
                      max="300"
                    />
                  </div>

                  {/* Weight */}
                  <div>
                    <label className="text-xs text-muted-foreground mb-1.5 block">Weight (kg)</label>
                    <input
                      type="number"
                      value={editWeight}
                      onChange={(e) => setEditWeight(e.target.value)}
                      step="0.1"
                      className="w-full px-4 py-3 rounded-xl bg-muted text-foreground border-none outline-none focus:ring-2 focus:ring-primary/30"
                      min="20"
                      max="300"
                    />
                  </div>

                  {/* Workout days */}
                  <div>
                    <label className="text-xs text-muted-foreground mb-1.5 block">Workout days per week: {editWorkoutDays}</label>
                    <input
                      type="range"
                      min="0"
                      max="7"
                      value={editWorkoutDays}
                      onChange={(e) => setEditWorkoutDays(parseInt(e.target.value))}
                      className="w-full accent-primary"
                    />
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>0</span><span>7</span>
                    </div>
                  </div>

                  {/* Goal */}
                  <div>
                    <label className="text-xs text-muted-foreground mb-1.5 block">Goal</label>
                    <div className="space-y-2">
                      {GOALS.map((g) => (
                        <button
                          key={g.value}
                          onClick={() => setEditGoal(g.value)}
                          className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border text-sm transition-all ${
                            editGoal === g.value
                              ? "border-primary bg-primary/10 text-foreground font-medium"
                              : "border-border/50 bg-muted/50 text-muted-foreground"
                          }`}
                        >
                          <span className="text-lg">{g.emoji}</span> {g.label}
                          {editGoal === g.value && <Check className="w-4 h-4 ml-auto text-primary" />}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Target Weight */}
                  <div>
                    <label className="text-xs text-muted-foreground mb-1.5 block">Target Weight (kg)</label>
                    <input
                      type="number"
                      value={editTargetWeight}
                      onChange={(e) => setEditTargetWeight(e.target.value)}
                      placeholder="e.g. 65"
                      step="0.1"
                      className="w-full px-4 py-3 rounded-xl bg-muted text-foreground border-none outline-none focus:ring-2 focus:ring-primary/30 placeholder:text-muted-foreground/40"
                      min="20"
                      max="300"
                    />
                  </div>

                  {/* Target BMI */}
                  <div>
                    <label className="text-xs text-muted-foreground mb-1.5 block">Target BMI</label>
                    <input
                      type="number"
                      value={editTargetBmi}
                      onChange={(e) => setEditTargetBmi(e.target.value)}
                      placeholder="e.g. 22"
                      step="0.1"
                      className="w-full px-4 py-3 rounded-xl bg-muted text-foreground border-none outline-none focus:ring-2 focus:ring-primary/30 placeholder:text-muted-foreground/40"
                      min="10"
                      max="50"
                    />
                  </div>

                  {/* Target Body Fat % */}
                  <div>
                    <label className="text-xs text-muted-foreground mb-1.5 block">Target Body Fat %</label>
                    <input
                      type="number"
                      value={editTargetBodyFat}
                      onChange={(e) => setEditTargetBodyFat(e.target.value)}
                      placeholder="e.g. 15"
                      step="0.1"
                      className="w-full px-4 py-3 rounded-xl bg-muted text-foreground border-none outline-none focus:ring-2 focus:ring-primary/30 placeholder:text-muted-foreground/40"
                      min="3"
                      max="60"
                    />
                  </div>
                  <button
                    onClick={handleSaveProfile}
                    disabled={saving || !editAge || !editWeight || !editGoal}
                    className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-primary text-primary-foreground font-semibold shadow-lg shadow-primary/25 disabled:opacity-40"
                  >
                    {saving ? "Saving…" : "Save & Recalculate"}
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}

        {/* Macro Goals */}
        {user && !profileLoading && (
          <MacroGoalsCard
            macros={macros}
            setMacros={setMacros}
            goal={goal}
            setGoal={setGoal}
            userId={user.id}
          />
        )}

        {/* Weight Progress */}
        {user && !profileLoading && profile?.target_weight_kg && profile?.weight_kg && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.12 }}
            className="rounded-2xl bg-card p-5 shadow-sm border border-border/50"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <Weight className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-card-foreground">Weight Progress</h3>
                <p className="text-xs text-muted-foreground">Track your journey</p>
              </div>
            </div>

            {(() => {
              const current = Number(profile.weight_kg);
              const target = Number(profile.target_weight_kg);
              const diff = current - target;
              const absDiff = Math.abs(diff);
              const isAtGoal = absDiff < 0.5;
              // Progress: how close to target (capped 0-100)
              const startDiff = Math.max(absDiff, 1); // avoid division by zero on first set
              const progress = isAtGoal ? 100 : Math.min(95, Math.max(5, ((startDiff - absDiff) / startDiff) * 100 + 50));

              return (
                <div className="space-y-4">
                  <div className="flex justify-between items-end">
                    <div className="text-center">
                      <p className="text-2xl font-bold text-foreground">{current}</p>
                      <p className="text-xs text-muted-foreground">Current (kg)</p>
                    </div>
                    <div className="flex-1 flex items-center justify-center px-4">
                      <div className="text-center">
                        {isAtGoal ? (
                          <span className="text-lg font-semibold text-primary">🎉 Goal reached!</span>
                        ) : (
                          <>
                            <p className="text-lg font-bold text-foreground">
                              {diff > 0 ? `${absDiff.toFixed(1)} kg to lose` : `${absDiff.toFixed(1)} kg to gain`}
                            </p>
                          </>
                        )}
                      </div>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-primary">{target}</p>
                      <p className="text-xs text-muted-foreground">Target (kg)</p>
                    </div>
                  </div>

                  <div className="h-3 rounded-full bg-muted overflow-hidden">
                    <motion.div
                      className="h-full rounded-full bg-primary"
                      initial={{ width: 0 }}
                      animate={{ width: `${progress}%` }}
                      transition={{ duration: 0.8, ease: "easeOut" }}
                    />
                  </div>
                </div>
              );
            })()}
          </motion.div>
        )}

        {/* Body Composition Summary */}
        {user && !profileLoading && weightLogs.length > 0 && (() => {
          const latest = weightLogs[weightLogs.length - 1];
          if (latest.bmi == null && latest.body_fat_percent == null) return null;
          return (
            <Suspense fallback={null}>
              <BodyCompositionCard latest={latest} gender={profile?.gender} />
            </Suspense>
          );
        })()}

        {user && !profileLoading && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.14 }}
            className="rounded-2xl bg-card shadow-sm border border-border/50 overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-5 pb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Weight className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-card-foreground">Body Stats</h3>
                  <p className="text-xs text-muted-foreground">{weightLogs.length} entries</p>
                </div>
              </div>
              <button
                onClick={handleScanPhoto}
                disabled={scanning}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-primary text-primary-foreground font-medium text-xs disabled:opacity-40 shadow-sm"
              >
                {scanning ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Camera className="w-3.5 h-3.5" />}
                {scanning ? "Scanning…" : "📷 Scan"}
              </button>
            </div>

            {/* Latest stats summary */}
            {weightLogs.length > 0 && (() => {
              const latest = weightLogs[weightLogs.length - 1];
              const prev = weightLogs.length > 1 ? weightLogs[weightLogs.length - 2] : null;
              const weightDiff = prev ? latest.weight_kg - prev.weight_kg : null;
              const bmiCategory = latest.bmi != null
                ? latest.bmi < 18.5 ? "Underweight" : latest.bmi < 25 ? "Normal" : latest.bmi < 30 ? "Overweight" : "Obese"
                : null;
              const bmiColor = latest.bmi != null
                ? latest.bmi < 18.5 ? "text-blue-500" : latest.bmi < 25 ? "text-primary" : latest.bmi < 30 ? "text-amber-500" : "text-destructive"
                : "";

              return (
                <div className="px-5 pb-3">
                  <div className="grid grid-cols-3 gap-2">
                    <div className="rounded-xl bg-muted/50 p-3 text-center">
                      <p className="text-lg font-bold text-foreground">{latest.weight_kg}</p>
                      <p className="text-[10px] text-muted-foreground">Weight (kg)</p>
                      {weightDiff != null && (
                        <p className={`text-[10px] font-medium mt-0.5 ${weightDiff < 0 ? "text-primary" : weightDiff > 0 ? "text-destructive" : "text-muted-foreground"}`}>
                          {weightDiff > 0 ? "+" : ""}{weightDiff.toFixed(1)}
                        </p>
                      )}
                    </div>
                    <div className="rounded-xl bg-muted/50 p-3 text-center">
                      <p className="text-lg font-bold text-foreground">{latest.bmi ?? "—"}</p>
                      <p className="text-[10px] text-muted-foreground">BMI</p>
                      {bmiCategory && <p className={`text-[10px] font-medium mt-0.5 ${bmiColor}`}>{bmiCategory}</p>}
                    </div>
                    <div className="rounded-xl bg-muted/50 p-3 text-center">
                      <p className="text-lg font-bold text-foreground">{latest.body_fat_percent != null ? `${latest.body_fat_percent}` : "—"}</p>
                      <p className="text-[10px] text-muted-foreground">Body Fat %</p>
                      {latest.body_fat_mass_kg != null && <p className="text-[10px] text-muted-foreground mt-0.5">{latest.body_fat_mass_kg} kg</p>}
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* Chart tabs */}
             {weightLogs.length >= 2 && (
              <div className="px-5">
                {/* Time range filter */}
                <div className="flex gap-1 mb-2">
                  {([
                    { key: "1w", label: "1W" },
                    { key: "1m", label: "1M" },
                    { key: "3m", label: "3M" },
                    { key: "all", label: "All" },
                  ] as const).map((r) => (
                    <button
                      key={r.key}
                      onClick={() => setTimeRange(r.key)}
                      className={`px-3 py-1 rounded-lg text-[11px] font-semibold transition-all ${
                        timeRange === r.key
                          ? "bg-foreground text-background shadow-sm"
                          : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      {r.label}
                    </button>
                  ))}
                </div>

                <div className="flex gap-1 mb-3 bg-muted/50 rounded-xl p-1">
                  {(["weight", "bmi", "bodyfat"] as const).map((tab) => {
                    const labels = { weight: "Weight", bmi: "BMI", bodyfat: "Fat" };
                    const activeColors = {
                      weight: "bg-primary text-primary-foreground shadow-md shadow-primary/25",
                      bmi: "bg-blue-500 text-white shadow-md shadow-blue-500/25",
                      bodyfat: "bg-rose-500 text-white shadow-md shadow-rose-500/25",
                    };
                    const values = filteredLogs.map(l => tab === "weight" ? l.weight_kg : tab === "bmi" ? l.bmi : l.body_fat_percent).filter((v): v is number => v != null);
                    const first = values.length >= 2 ? values[0] : null;
                    const last = values.length >= 2 ? values[values.length - 1] : null;
                    const change = first != null && last != null ? last - first : null;
                    const pctChange = first != null && change != null && first !== 0 ? (change / first) * 100 : null;
                    const isGood = change != null ? change <= 0 : null;
                    const isActive = activeChart === tab;

                    return (
                      <button
                        key={tab}
                        onClick={() => setActiveChart(tab)}
                        className={`flex-1 flex flex-col items-center gap-0.5 py-2 rounded-lg text-xs font-semibold transition-all ${
                          isActive ? activeColors[tab] : "text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        <span>{labels[tab]}</span>
                        {pctChange != null && (
                          <span className={`flex items-center gap-0.5 text-[9px] font-bold ${
                            isActive
                              ? "opacity-90"
                              : isGood ? "text-primary" : "text-destructive"
                          }`}>
                            {change! > 0 ? "↑" : change! < 0 ? "↓" : "→"}
                            {Math.abs(pctChange).toFixed(1)}%
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>

                {filteredLogs.length < 2 ? (
                  <div className="text-center py-8 text-sm text-muted-foreground">
                    Not enough data for this time range
                  </div>
                ) : (
                <>

                {/* Chart header with context */}
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <p className="text-xs font-medium text-foreground">
                      {activeChart === "weight" && "Weight Trend"}
                      {activeChart === "bmi" && "BMI Trend"}
                      {activeChart === "bodyfat" && "Body Fat Trend"}
                    </p>
                    <p className="text-[10px] text-muted-foreground">
                      {activeChart === "weight" && "Tracking your weight over time"}
                      {activeChart === "bmi" && "18.5–25 is the healthy range"}
                      {activeChart === "bodyfat" && "Lower is leaner"}
                    </p>
                  </div>
                  {activeChart === "weight" && profile?.target_weight_kg && (
                    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-primary/10 border border-primary/20">
                      <span className="text-[10px] text-primary font-semibold">🎯 {Number(profile.target_weight_kg)} kg</span>
                    </div>
                  )}
                  {activeChart === "bmi" && profile?.target_bmi && (
                    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-blue-500/10 border border-blue-500/20">
                      <span className="text-[10px] text-blue-600 font-semibold">🎯 BMI {profile.target_bmi}</span>
                    </div>
                  )}
                  {activeChart === "bmi" && !profile?.target_bmi && (
                    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-blue-500/10 border border-blue-500/20">
                      <span className="text-[10px] text-blue-600 font-semibold">Healthy: 18.5–25</span>
                    </div>
                  )}
                  {activeChart === "bodyfat" && profile?.target_body_fat_percent && (
                    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-rose-500/10 border border-rose-500/20">
                      <span className="text-[10px] text-rose-600 font-semibold">🎯 {profile.target_body_fat_percent}%</span>
                    </div>
                  )}
                </div>

                {/* Min/Max/Avg summary */}
                {(() => {
                  const key = activeChart === "bodyfat" ? "body_fat_percent" : activeChart === "bmi" ? "bmi" : "weight_kg";
                  const values = filteredLogs.map(l => activeChart === "weight" ? l.weight_kg : activeChart === "bmi" ? l.bmi : l.body_fat_percent).filter((v): v is number => v != null);
                  if (values.length < 2) return null;
                  const min = Math.min(...values);
                  const max = Math.max(...values);
                  const avg = values.reduce((a, b) => a + b, 0) / values.length;
                  const unit = activeChart === "weight" ? " kg" : activeChart === "bodyfat" ? "%" : "";
                  const change = values[values.length - 1] - values[0];
                  return (
                    <div className="grid grid-cols-4 gap-1.5 mb-3">
                      {[
                        { label: "Min", value: min.toFixed(1) + unit },
                        { label: "Max", value: max.toFixed(1) + unit },
                        { label: "Avg", value: avg.toFixed(1) + unit },
                        { label: "Change", value: (change > 0 ? "+" : "") + change.toFixed(1) + unit, isChange: true, positive: activeChart === "weight" ? change < 0 : change < 0 },
                      ].map((stat) => (
                        <div key={stat.label} className="rounded-lg bg-muted/40 px-2 py-1.5 text-center">
                          <p className={`text-xs font-bold ${stat.isChange ? (stat.positive ? "text-primary" : "text-destructive") : "text-foreground"}`}>{stat.value}</p>
                          <p className="text-[9px] text-muted-foreground">{stat.label}</p>
                        </div>
                      ))}
                    </div>
                  );
                })()}

                <Suspense fallback={<div className="h-52 flex items-center justify-center"><Loader2 className="w-5 h-5 text-muted-foreground animate-spin" /></div>}>
                  <WeightChart filteredLogs={filteredLogs} activeChart={activeChart} profile={profile} />
                </Suspense>

                {/* Legend */}
                <div className="flex items-center justify-center gap-3 mt-2 pb-1">
                  <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
                    <span className={`w-2.5 h-2.5 rounded-full ${activeChart === "weight" ? "bg-primary" : activeChart === "bmi" ? "bg-blue-500" : "bg-rose-500"}`} />
                    {activeChart === "weight" ? "Weight (kg)" : activeChart === "bmi" ? "BMI" : "Body Fat %"}
                  </span>
                  {activeChart === "weight" && profile?.target_weight_kg && (
                    <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
                      <span className="w-4 border-t-2 border-dashed border-primary" /> Target
                    </span>
                  )}
                  {activeChart === "bmi" && (
                    <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
                      <span className="w-4 border-t-2 border-dashed border-destructive" /> Thresholds
                    </span>
                  )}
                  {activeChart === "bmi" && profile?.target_bmi && (
                    <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
                      <span className="w-4 border-t-2 border-dashed border-blue-500" /> Target
                    </span>
                  )}
                  {activeChart === "bodyfat" && profile?.target_body_fat_percent && (
                    <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
                      <span className="w-4 border-t-2 border-dashed border-rose-500" /> Target
                    </span>
                  )}
                  <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
                    <span className={`w-3.5 h-3.5 rounded-full border-2 ${activeChart === "weight" ? "border-primary" : activeChart === "bmi" ? "border-blue-500" : "border-rose-500"}`} /> Latest
                  </span>
                </div>
                </>
                )}
              </div>
            )}

            {weightLogs.length === 1 && (
              <p className="text-center text-sm text-muted-foreground py-6 px-5">
                Log one more entry to see your trends 📈
              </p>
            )}
            {weightLogs.length === 0 && (
              <div className="text-center py-8 px-5">
                <p className="text-4xl mb-2">📷</p>
                <p className="text-sm font-medium text-foreground mb-1">No entries yet</p>
                <p className="text-xs text-muted-foreground">Log manually or scan a gym receipt to start tracking</p>
              </div>
            )}

            {/* Add entry */}
            <div className="px-5 py-3 border-t border-border/30">
              <div className="flex gap-2">
                <input
                  type="number"
                  value={newWeight}
                  onChange={(e) => setNewWeight(e.target.value)}
                  placeholder="Weight (kg)"
                  step="0.1"
                  min="20"
                  max="300"
                  className="flex-1 px-3 py-2.5 rounded-xl bg-muted text-foreground border-none outline-none focus:ring-2 focus:ring-primary/30 text-sm placeholder:text-muted-foreground/40"
                />
                <button
                  onClick={() => setShowManualFields(!showManualFields)}
                  className={`px-3 py-2.5 rounded-xl text-xs font-medium transition-colors ${showManualFields ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"}`}
                >
                  {showManualFields ? "Less" : "+ More"}
                </button>
                <button
                  onClick={addWeightLog}
                  disabled={addingWeight || !newWeight}
                  className="px-4 py-2.5 rounded-xl bg-primary text-primary-foreground font-medium text-sm disabled:opacity-40"
                >
                  Log
                </button>
              </div>

              <AnimatePresence>
                {showManualFields && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="grid grid-cols-2 gap-2 pt-2">
                      <div>
                        <label className="text-[10px] text-muted-foreground mb-0.5 block">BMI</label>
                        <input
                          type="number"
                          value={newBmi}
                          onChange={(e) => setNewBmi(e.target.value)}
                          placeholder="e.g. 27.5"
                          step="0.1"
                          className="w-full px-3 py-2 rounded-xl bg-muted text-foreground border-none outline-none focus:ring-2 focus:ring-primary/30 text-sm placeholder:text-muted-foreground/40"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-muted-foreground mb-0.5 block">Body Fat %</label>
                        <input
                          type="number"
                          value={newBodyFat}
                          onChange={(e) => setNewBodyFat(e.target.value)}
                          placeholder="e.g. 32.5"
                          step="0.1"
                          className="w-full px-3 py-2 rounded-xl bg-muted text-foreground border-none outline-none focus:ring-2 focus:ring-primary/30 text-sm placeholder:text-muted-foreground/40"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-muted-foreground mb-0.5 block">Fat Mass (kg)</label>
                        <input
                          type="number"
                          value={newBodyFatMass}
                          onChange={(e) => setNewBodyFatMass(e.target.value)}
                          placeholder="e.g. 32.2"
                          step="0.1"
                          className="w-full px-3 py-2 rounded-xl bg-muted text-foreground border-none outline-none focus:ring-2 focus:ring-primary/30 text-sm placeholder:text-muted-foreground/40"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-muted-foreground mb-0.5 block">Height (m)</label>
                        <input
                          type="number"
                          value={newHeightM}
                          onChange={(e) => setNewHeightM(e.target.value)}
                          placeholder="e.g. 1.90"
                          step="0.01"
                          className="w-full px-3 py-2 rounded-xl bg-muted text-foreground border-none outline-none focus:ring-2 focus:ring-primary/30 text-sm placeholder:text-muted-foreground/40"
                        />
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Recent logs */}
            {weightLogs.length > 0 && (
              <div className="border-t border-border/30">
                <div className="px-5 pt-3 pb-1">
                  <p className="text-xs text-muted-foreground font-semibold">Recent Entries</p>
                </div>
                <div className="px-5 pb-4 space-y-1.5">
                  {[...weightLogs].reverse().slice(0, 5).map((log, i) => {
                    const prev = [...weightLogs].reverse()[i + 1];
                    const diff = prev ? log.weight_kg - prev.weight_kg : null;
                    return (
                      <div key={log.id} className="flex items-center gap-3 py-2 px-3 rounded-xl hover:bg-muted/30 transition-colors group">
                        <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center text-xs font-bold text-muted-foreground shrink-0">
                          {format(parseISO(log.logged_at), "d")}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-semibold text-foreground">{log.weight_kg} kg</span>
                            {diff != null && (
                              <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full ${
                                diff < 0 ? "bg-primary/10 text-primary" : diff > 0 ? "bg-destructive/10 text-destructive" : "bg-muted text-muted-foreground"
                              }`}>
                                {diff > 0 ? "+" : ""}{diff.toFixed(1)}
                              </span>
                            )}
                          </div>
                          <div className="flex gap-3 text-[10px] text-muted-foreground">
                            <span>{format(parseISO(log.logged_at), "MMM yyyy")}</span>
                            {log.bmi != null && <span>BMI {log.bmi}</span>}
                            {log.body_fat_percent != null && <span>{log.body_fat_percent}% fat</span>}
                          </div>
                        </div>
                        <button onClick={() => deleteWeightLog(log.id)} className="p-1.5 text-muted-foreground/30 hover:text-destructive transition-colors opacity-0 group-hover:opacity-100">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </motion.div>
        )}

        {/* Notifications */}
        {user && <RemindersToggle />}
        {user && <MealReminderTimes />}

        {/* Auth action */}
        {!authLoading && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.15 }}>
            {user ? (
              <button
                onClick={handleSignOut}
                className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-destructive/10 text-destructive font-medium hover:bg-destructive/20 transition-colors"
              >
                <LogOut className="w-4 h-4" />
                Sign Out
              </button>
            ) : (
              <button
                onClick={() => navigate({ to: "/login" })}
                className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-primary text-primary-foreground font-semibold shadow-lg shadow-primary/25"
              >
                <LogIn className="w-4 h-4" />
                Sign In
              </button>
            )}
          </motion.div>
        )}
      </div>

      <BottomNav onAddClick={() => navigate({ to: "/" })} />
    </div>
  );
}

function ProfileRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center gap-3 py-2">
      <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center text-muted-foreground">
        {icon}
      </div>
      <span className="text-sm text-muted-foreground flex-1">{label}</span>
      <span className="text-sm font-medium text-foreground">{value}</span>
    </div>
  );
}

function MacroCard({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className="rounded-xl bg-muted/50 p-3 text-center">
      <p className="text-lg font-bold text-foreground">{value}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
      <div className={`w-full h-1 rounded-full mt-2 ${color} opacity-60`} />
    </div>
  );
}

function MacroGoalsCard({
  macros,
  setMacros,
  goal,
  setGoal,
  userId,
}: {
  macros: { calories: number; protein: number; carbs: number; fat: number };
  setMacros: (m: { calories: number; protein: number; carbs: number; fat: number }) => void;
  goal: number;
  setGoal: (g: number) => void;
  userId: string;
}) {
  const [editing, setEditing] = useState(false);
  const [editCal, setEditCal] = useState(String(macros.calories));
  const [editProtein, setEditProtein] = useState(String(macros.protein));
  const [editCarbs, setEditCarbs] = useState(String(macros.carbs));
  const [editFat, setEditFat] = useState(String(macros.fat));
  const [saving, setSaving] = useState(false);

  const startEdit = () => {
    setEditCal(String(macros.calories));
    setEditProtein(String(macros.protein));
    setEditCarbs(String(macros.carbs));
    setEditFat(String(macros.fat));
    setEditing(true);
  };

  const handleSave = async () => {
    setSaving(true);
    const newMacros = {
      calories: parseInt(editCal) || macros.calories,
      protein: parseInt(editProtein) || 0,
      carbs: parseInt(editCarbs) || 0,
      fat: parseInt(editFat) || 0,
    };

    await supabase.from("user_settings").upsert({
      user_id: userId,
      daily_calorie_goal: newMacros.calories,
      protein_goal: newMacros.protein,
      carbs_goal: newMacros.carbs,
      fat_goal: newMacros.fat,
    }, { onConflict: "user_id" });

    await saveCalorieGoal(newMacros.calories);
    setMacros(newMacros);
    setGoal(newMacros.calories);
    setEditing(false);
    setSaving(false);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
      className="rounded-2xl bg-card p-5 shadow-sm border border-border/50"
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <Target className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold text-card-foreground">Daily Goals</h3>
            <p className="text-xs text-muted-foreground">Your personalized targets</p>
          </div>
        </div>
        {!editing ? (
          <button onClick={startEdit} className="flex items-center gap-1 text-sm text-primary font-medium">
            <Pencil className="w-3.5 h-3.5" /> Edit
          </button>
        ) : (
          <button onClick={() => setEditing(false)} className="flex items-center gap-1 text-sm text-muted-foreground font-medium">
            <X className="w-3.5 h-3.5" /> Cancel
          </button>
        )}
      </div>

      <AnimatePresence mode="wait">
        {!editing ? (
          <motion.div key="view" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <div className="rounded-xl bg-primary/10 border border-primary/20 p-4 text-center mb-3">
              <p className="text-3xl font-bold text-primary">{macros.calories}</p>
              <p className="text-xs text-muted-foreground">kcal / day</p>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <MacroCard label="Protein" value={`${macros.protein}g`} color="bg-blue-500" />
              <MacroCard label="Carbs" value={`${macros.carbs}g`} color="bg-amber-500" />
              <MacroCard label="Fat" value={`${macros.fat}g`} color="bg-rose-500" />
            </div>
          </motion.div>
        ) : (
          <motion.div key="edit" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-3">
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Calories (kcal)</label>
              <input
                type="number"
                value={editCal}
                onChange={(e) => setEditCal(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-muted text-foreground border-none outline-none focus:ring-2 focus:ring-primary/30 text-center text-xl font-bold"
                min="500"
                max="10000"
              />
            </div>
            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="text-xs text-muted-foreground mb-1 block text-center">Protein (g)</label>
                <input
                  type="number"
                  value={editProtein}
                  onChange={(e) => setEditProtein(e.target.value)}
                  className="w-full px-2 py-2.5 rounded-xl bg-muted text-foreground border-none outline-none focus:ring-2 focus:ring-primary/30 text-center font-semibold"
                  min="0"
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block text-center">Carbs (g)</label>
                <input
                  type="number"
                  value={editCarbs}
                  onChange={(e) => setEditCarbs(e.target.value)}
                  className="w-full px-2 py-2.5 rounded-xl bg-muted text-foreground border-none outline-none focus:ring-2 focus:ring-primary/30 text-center font-semibold"
                  min="0"
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block text-center">Fat (g)</label>
                <input
                  type="number"
                  value={editFat}
                  onChange={(e) => setEditFat(e.target.value)}
                  className="w-full px-2 py-2.5 rounded-xl bg-muted text-foreground border-none outline-none focus:ring-2 focus:ring-primary/30 text-center font-semibold"
                  min="0"
                />
              </div>
            </div>
            <button
              onClick={handleSave}
              disabled={saving}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl bg-primary text-primary-foreground font-semibold shadow-lg shadow-primary/25 disabled:opacity-40"
            >
              {saving ? "Saving…" : "Save Goals"}
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
