import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
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
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { BottomNav } from "@/components/BottomNav";

export const Route = createFileRoute("/profile")({
  component: ProfilePage,
  head: () => ({
    meta: [
      { title: "CalTrack — Profile" },
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

  // Macro display
  const [macros, setMacros] = useState({ calories: 2000, protein: 0, carbs: 0, fat: 0 });

  useEffect(() => {
    if (!user) return;
    Promise.all([
      loadCalorieGoal(),
      supabase.from("user_profiles").select("*").eq("user_id", user.id).maybeSingle(),
      supabase.from("user_settings").select("*").eq("user_id", user.id).maybeSingle(),
    ]).then(([fetchedGoal, profileRes, settingsRes]) => {
      setGoal(fetchedGoal);
      if (profileRes.data) {
        const p = profileRes.data as unknown as Record<string, unknown>;
        const profileData: ProfileData = {
          age: profileRes.data.age,
          weight_kg: profileRes.data.weight_kg,
          gender: profileRes.data.gender,
          workout_days_per_week: profileRes.data.workout_days_per_week,
          goal: profileRes.data.goal,
          target_weight_kg: (p.target_weight_kg as number) ?? null,
        };
        setProfile(profileData);
        setEditAge(String(profileData.age ?? ""));
        setEditWeight(String(profileData.weight_kg ?? ""));
        setEditGender(profileData.gender ?? "");
        setEditWorkoutDays(profileData.workout_days_per_week ?? 3);
        setEditGoal(profileData.goal ?? "");
        setEditTargetWeight(String(profileData.target_weight_kg ?? ""));
      }
      if (settingsRes.data) {
        const s = settingsRes.data as unknown as Record<string, unknown>;
        setMacros({
          calories: settingsRes.data.daily_calorie_goal,
          protein: (s.protein_goal as number) ?? 0,
          carbs: (s.carbs_goal as number) ?? 0,
          fat: (s.fat_goal as number) ?? 0,
        });
      }
      setProfileLoading(false);
    });
  }, [user]);

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
      }, { onConflict: "user_id" }),
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
        {user && !profileLoading && macros.protein > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="rounded-2xl bg-card p-5 shadow-sm border border-border/50"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <Target className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-card-foreground">Daily Goals</h3>
                <p className="text-xs text-muted-foreground">Your personalized targets</p>
              </div>
            </div>

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
        )}

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
