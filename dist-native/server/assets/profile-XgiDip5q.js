import { jsxs, jsx, Fragment } from "react/jsx-runtime";
import { useNavigate } from "@tanstack/react-router";
import { useState, useEffect, useCallback, Suspense, lazy } from "react";
import { s as supabase, h as hapticLight, a as hapticSuccess, l as loadCalorieGoal, b as saveCalorieGoal } from "./router-L3bJVu16.js";
import { u as useAuth } from "./use-auth-gfzAGvwo.js";
import { G as GOALS, a as GENDERS, c as calculateMacros } from "./macro-calc-CwiqaSuT.js";
import { Bell, BellOff, Loader2, Clock, Coffee, UtensilsCrossed, Moon, Apple, User, Pencil, X, Weight, Dumbbell, Target, Phone, Check, Camera, Trash2, LogOut, LogIn } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { subDays, subMonths, parseISO, format } from "date-fns";
import { D as DashboardSkeleton, B as BottomNav } from "./DashboardSkeleton-DQgJUb9_.js";
import { toast } from "sonner";
import { i as isPushSupported, a as isPreviewEnvironment, g as getRemindersEnabled, u as unsubscribeFromPush, s as subscribeToPush } from "./push-CbfwDtlI.js";
import { Capacitor } from "@capacitor/core";
import { LocalNotifications } from "@capacitor/local-notifications";
import "@supabase/supabase-js";
import "@capacitor/haptics";
import "mcp-tanstack-start";
import "zod";
const MEAL_IDS = {
  breakfast: 1001,
  lunch: 1002,
  dinner: 1003,
  snack: 1004
};
const COPY = {
  breakfast: { title: "Good morning! 🌅", body: "Time to log your breakfast." },
  lunch: { title: "Lunch time 🍽️", body: "What's on the menu? Log your lunch." },
  dinner: { title: "Dinner check-in 🌙", body: "Wrap up your day — log dinner." },
  snack: { title: "Snack break 🍎", body: "Log your snack to stay on track." }
};
function isNative() {
  try {
    return Capacitor.isNativePlatform();
  } catch {
    return false;
  }
}
function parseHHMM(t) {
  const m = /^(\d{1,2}):(\d{2})/.exec(t || "");
  if (!m) return null;
  const hour = Math.min(23, Math.max(0, parseInt(m[1], 10)));
  const minute = Math.min(59, Math.max(0, parseInt(m[2], 10)));
  return { hour, minute };
}
async function ensureLocalNotificationPermission() {
  if (!isNative()) return false;
  try {
    const status = await LocalNotifications.checkPermissions();
    if (status.display === "granted") return true;
    const req = await LocalNotifications.requestPermissions();
    return req.display === "granted";
  } catch {
    return false;
  }
}
async function cancelMealReminders() {
  if (!isNative()) return;
  try {
    await LocalNotifications.cancel({
      notifications: Object.values(MEAL_IDS).map((id) => ({ id }))
    });
  } catch {
  }
}
async function scheduleMealReminders(times) {
  if (!isNative()) return;
  const granted = await ensureLocalNotificationPermission();
  if (!granted) return;
  await cancelMealReminders();
  const meals = ["breakfast", "lunch", "dinner"];
  if (times.snackEnabled) meals.push("snack");
  const notifications = meals.map((meal) => {
    const t = parseHHMM(times[meal]);
    if (!t) return null;
    const copy = COPY[meal];
    return {
      id: MEAL_IDS[meal],
      title: copy.title,
      body: copy.body,
      schedule: {
        on: { hour: t.hour, minute: t.minute },
        allowWhileIdle: true
      },
      smallIcon: "ic_stat_icon_config_sample"
    };
  }).filter(Boolean);
  if (notifications.length === 0) return;
  try {
    await LocalNotifications.schedule({ notifications });
  } catch (err) {
    console.error("[local-notifications] schedule failed:", err);
  }
}
function RemindersToggle() {
  const [enabled, setEnabled] = useState(false);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [supported, setSupported] = useState(false);
  const [preview, setPreview] = useState(false);
  useEffect(() => {
    setSupported(isPushSupported());
    setPreview(isPreviewEnvironment());
    getRemindersEnabled().then(setEnabled).finally(() => setLoading(false));
  }, []);
  const handleToggle = async () => {
    if (busy) return;
    setBusy(true);
    if (enabled) {
      const { ok, error } = await unsubscribeFromPush();
      if (ok) {
        setEnabled(false);
        await cancelMealReminders();
        toast.success("Reminders turned off");
      } else {
        toast.error(error || "Failed to disable");
      }
    } else {
      const webRes = preview ? { ok: false, error: "preview" } : await subscribeToPush();
      const nativeGranted = await ensureLocalNotificationPermission();
      if (nativeGranted) {
        const { data: u } = await supabase.auth.getUser();
        if (u.user) {
          const { data } = await supabase.from("user_settings").select(
            "breakfast_time, lunch_time, dinner_time, snack_time, snack_reminder_enabled, timezone"
          ).eq("user_id", u.user.id).maybeSingle();
          await scheduleMealReminders({
            breakfast: (data?.breakfast_time || "08:00:00").slice(0, 5),
            lunch: (data?.lunch_time || "13:00:00").slice(0, 5),
            dinner: (data?.dinner_time || "19:00:00").slice(0, 5),
            snack: (data?.snack_time || "16:00:00").slice(0, 5),
            snackEnabled: !!data?.snack_reminder_enabled
          });
          if (!webRes.ok) {
            await supabase.from("user_settings").update({ reminders_enabled: true }).eq("user_id", u.user.id);
          }
        }
      }
      if (webRes.ok || nativeGranted) {
        setEnabled(true);
        toast.success("Reminders enabled — you'll get a daily nudge");
      } else {
        toast.error(webRes.error || "Failed to enable");
      }
    }
    setBusy(false);
  };
  if (loading) return null;
  return /* @__PURE__ */ jsxs(
    motion.div,
    {
      initial: { opacity: 0, y: 10 },
      animate: { opacity: 1, y: 0 },
      transition: { delay: 0.12 },
      className: "rounded-2xl bg-card p-5 shadow-sm border border-border/50",
      children: [
        /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3", children: [
            /* @__PURE__ */ jsx("div", { className: "w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center", children: enabled ? /* @__PURE__ */ jsx(Bell, { className: "w-5 h-5 text-primary" }) : /* @__PURE__ */ jsx(BellOff, { className: "w-5 h-5 text-muted-foreground" }) }),
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("h3", { className: "font-semibold text-card-foreground", children: "Meal reminders" }),
              /* @__PURE__ */ jsx("p", { className: "text-xs text-muted-foreground", children: "Daily nudges at breakfast, lunch & dinner" })
            ] })
          ] }),
          /* @__PURE__ */ jsx(
            "button",
            {
              onClick: handleToggle,
              disabled: busy || !supported || preview,
              className: `relative w-12 h-7 rounded-full transition-colors disabled:opacity-50 ${enabled ? "bg-primary" : "bg-muted"}`,
              "aria-label": enabled ? "Disable reminders" : "Enable reminders",
              children: /* @__PURE__ */ jsx(
                motion.div,
                {
                  className: "absolute top-0.5 w-6 h-6 rounded-full bg-white shadow flex items-center justify-center",
                  animate: { left: enabled ? 22 : 2 },
                  transition: { type: "spring", stiffness: 500, damping: 30 },
                  children: busy && /* @__PURE__ */ jsx(Loader2, { className: "w-3 h-3 animate-spin text-primary" })
                }
              )
            }
          )
        ] }),
        !supported && /* @__PURE__ */ jsx("p", { className: "mt-3 text-xs text-muted-foreground", children: "Notifications aren't supported in this browser." }),
        supported && preview && /* @__PURE__ */ jsx("p", { className: "mt-3 text-xs text-muted-foreground", children: "Available in the published app — install ZyraFit to your home screen first." })
      ]
    }
  );
}
const DEFAULTS = {
  breakfast: "08:00",
  lunch: "13:00",
  dinner: "19:00",
  snack: "16:00",
  snackEnabled: false
};
const ROWS = [
  { key: "breakfast", label: "Breakfast", icon: /* @__PURE__ */ jsx(Coffee, { className: "w-4 h-4" }) },
  { key: "lunch", label: "Lunch", icon: /* @__PURE__ */ jsx(UtensilsCrossed, { className: "w-4 h-4" }) },
  { key: "dinner", label: "Dinner", icon: /* @__PURE__ */ jsx(Moon, { className: "w-4 h-4" }) },
  { key: "snack", label: "Snack", icon: /* @__PURE__ */ jsx(Apple, { className: "w-4 h-4" }), toggleable: true }
];
function MealReminderTimes() {
  const { user } = useAuth();
  const [times, setTimes] = useState(DEFAULTS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [enabled, setEnabled] = useState(false);
  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }
    (async () => {
      const { data } = await supabase.from("user_settings").select(
        "breakfast_time, lunch_time, dinner_time, snack_time, snack_reminder_enabled, reminders_enabled"
      ).eq("user_id", user.id).maybeSingle();
      if (data) {
        setTimes({
          breakfast: (data.breakfast_time || "08:00:00").slice(0, 5),
          lunch: (data.lunch_time || "13:00:00").slice(0, 5),
          dinner: (data.dinner_time || "19:00:00").slice(0, 5),
          snack: (data.snack_time || "16:00:00").slice(0, 5),
          snackEnabled: !!data.snack_reminder_enabled
        });
        setEnabled(!!data.reminders_enabled);
      }
      setLoading(false);
    })();
  }, [user]);
  const updateTime = (key, value) => {
    hapticLight();
    setTimes((prev) => ({ ...prev, [key]: value }));
  };
  const toggleSnack = () => {
    hapticLight();
    setTimes((prev) => ({ ...prev, snackEnabled: !prev.snackEnabled }));
  };
  const save = async () => {
    if (!user) return;
    setSaving(true);
    const { error } = await supabase.from("user_settings").update({
      breakfast_time: times.breakfast + ":00",
      lunch_time: times.lunch + ":00",
      dinner_time: times.dinner + ":00",
      snack_time: times.snack + ":00",
      snack_reminder_enabled: times.snackEnabled
    }).eq("user_id", user.id);
    if (error) {
      toast.error("Couldn't save: " + error.message);
      setSaving(false);
      return;
    }
    if (enabled) {
      await scheduleMealReminders(times);
    } else {
      await cancelMealReminders();
    }
    hapticSuccess();
    toast.success("Reminder times saved");
    setSaving(false);
  };
  if (loading) return null;
  if (!user) return null;
  return /* @__PURE__ */ jsxs(
    motion.div,
    {
      initial: { opacity: 0, y: 10 },
      animate: { opacity: 1, y: 0 },
      transition: { delay: 0.14 },
      className: "rounded-2xl bg-card p-5 shadow-sm border border-border/50 space-y-4",
      children: [
        /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3", children: [
          /* @__PURE__ */ jsx("div", { className: "w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center", children: /* @__PURE__ */ jsx(Clock, { className: "w-5 h-5 text-primary" }) }),
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("h3", { className: "font-semibold text-card-foreground", children: "Reminder times" }),
            /* @__PURE__ */ jsx("p", { className: "text-xs text-muted-foreground", children: "Pick when each nudge fires" })
          ] })
        ] }),
        /* @__PURE__ */ jsx("div", { className: "space-y-2", children: ROWS.map((row) => {
          const isSnack = row.key === "snack";
          const dimmed = isSnack && !times.snackEnabled;
          return /* @__PURE__ */ jsxs(
            "div",
            {
              className: `flex items-center justify-between rounded-xl bg-muted/40 px-3 py-2.5 transition-opacity ${dimmed ? "opacity-50" : ""}`,
              children: [
                /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2.5 text-card-foreground", children: [
                  /* @__PURE__ */ jsx("span", { className: "text-muted-foreground", children: row.icon }),
                  /* @__PURE__ */ jsx("span", { className: "text-sm font-medium", children: row.label }),
                  isSnack && /* @__PURE__ */ jsx(
                    "button",
                    {
                      type: "button",
                      onClick: toggleSnack,
                      className: `ml-1 text-[10px] px-2 py-0.5 rounded-full font-semibold ${times.snackEnabled ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`,
                      children: times.snackEnabled ? "ON" : "OFF"
                    }
                  )
                ] }),
                /* @__PURE__ */ jsx(
                  "input",
                  {
                    type: "time",
                    value: times[row.key],
                    disabled: dimmed,
                    onChange: (e) => updateTime(row.key, e.target.value),
                    className: "bg-transparent text-card-foreground text-sm font-semibold tabular-nums focus:outline-none disabled:opacity-60"
                  }
                )
              ]
            },
            row.key
          );
        }) }),
        /* @__PURE__ */ jsx(
          "button",
          {
            onClick: save,
            disabled: saving,
            className: "w-full h-11 rounded-xl bg-primary text-primary-foreground font-semibold text-sm flex items-center justify-center gap-2 disabled:opacity-60",
            children: saving ? /* @__PURE__ */ jsx(Loader2, { className: "w-4 h-4 animate-spin" }) : "Save times"
          }
        )
      ]
    }
  );
}
const WeightChart = lazy(() => import("./WeightChart-Q2-Qo06X.js"));
const BodyCompositionCard = lazy(() => import("./BodyCompositionCard-BrDx5zfp.js"));
const PHONE_RE = /^\+?[0-9][0-9\s\-().]{5,19}$/;
function isValidPhone(value) {
  const trimmed = value.trim();
  if (!trimmed) return true;
  if (!PHONE_RE.test(trimmed)) return false;
  const digits = trimmed.replace(/\D/g, "");
  return digits.length >= 7 && digits.length <= 15;
}
function ProfilePage() {
  const {
    user,
    loading: authLoading,
    signOut
  } = useAuth();
  const navigate = useNavigate();
  const [goal, setGoal] = useState(2e3);
  const [guardReady, setGuardReady] = useState(false);
  const [profileLoading, setProfileLoading] = useState(true);
  const [profile, setProfile] = useState(null);
  const [editingProfile, setEditingProfile] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editAge, setEditAge] = useState("");
  const [editWeight, setEditWeight] = useState("");
  const [editHeight, setEditHeight] = useState("170");
  const [editGender, setEditGender] = useState("");
  const [editWorkoutDays, setEditWorkoutDays] = useState(3);
  const [editGoal, setEditGoal] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const phoneError = editPhone.trim() !== "" && !isValidPhone(editPhone);
  const [editTargetWeight, setEditTargetWeight] = useState("");
  const [editTargetBmi, setEditTargetBmi] = useState("");
  const [editTargetBodyFat, setEditTargetBodyFat] = useState("");
  const [macros, setMacros] = useState({
    calories: 2e3,
    protein: 0,
    carbs: 0,
    fat: 0
  });
  const [weightLogs, setWeightLogs] = useState([]);
  const [newWeight, setNewWeight] = useState("");
  const [newBmi, setNewBmi] = useState("");
  const [newBodyFat, setNewBodyFat] = useState("");
  const [newBodyFatMass, setNewBodyFatMass] = useState("");
  const [newHeightM, setNewHeightM] = useState("");
  const [addingWeight, setAddingWeight] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [showManualFields, setShowManualFields] = useState(false);
  const [activeChart, setActiveChart] = useState("weight");
  const [timeRange, setTimeRange] = useState("all");
  const filteredLogs = (() => {
    if (timeRange === "all") return weightLogs;
    const now = /* @__PURE__ */ new Date();
    const cutoff = timeRange === "1w" ? subDays(now, 7) : timeRange === "1m" ? subMonths(now, 1) : subMonths(now, 3);
    return weightLogs.filter((l) => parseISO(l.logged_at) >= cutoff);
  })();
  const fetchWeightLogs = useCallback(async () => {
    if (!user) return;
    const {
      data
    } = await supabase.from("weight_logs").select("*").eq("user_id", user.id).order("logged_at", {
      ascending: true
    }).limit(90);
    if (data) setWeightLogs(data.map((d) => ({
      id: d.id,
      weight_kg: Number(d.weight_kg),
      logged_at: d.logged_at,
      bmi: d.bmi != null ? Number(d.bmi) : null,
      body_fat_percent: d.body_fat_percent != null ? Number(d.body_fat_percent) : null,
      body_fat_mass_kg: d.body_fat_mass_kg != null ? Number(d.body_fat_mass_kg) : null,
      height_m: d.height_m != null ? Number(d.height_m) : null
    })));
  }, [user]);
  const addWeightLog = async () => {
    if (!user || !newWeight) return;
    setAddingWeight(true);
    await supabase.from("weight_logs").insert({
      user_id: user.id,
      weight_kg: parseFloat(newWeight),
      logged_at: (/* @__PURE__ */ new Date()).toISOString().slice(0, 10),
      bmi: newBmi ? parseFloat(newBmi) : null,
      body_fat_percent: newBodyFat ? parseFloat(newBodyFat) : null,
      body_fat_mass_kg: newBodyFatMass ? parseFloat(newBodyFatMass) : null,
      height_m: newHeightM ? parseFloat(newHeightM) : null
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
  const deleteWeightLog = async (id) => {
    await supabase.from("weight_logs").delete().eq("id", id);
    fetchWeightLogs();
  };
  const handleScanPhoto = async () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.capture = "environment";
    input.onchange = async (e) => {
      const file = e.target.files?.[0];
      if (!file || !user) return;
      const {
        captureReceiptAsBase64
      } = await import("./food-ai-CQBBSUQI.js");
      const base64 = await captureReceiptAsBase64(file);
      if (typeof navigator !== "undefined" && !navigator.onLine) {
        const {
          enqueueBodyScan
        } = await import("./router-L3bJVu16.js").then((n) => n.v);
        const {
          toast: toast2
        } = await import("sonner");
        await enqueueBodyScan(base64);
        toast2("Body scan queued — will read when back online");
        return;
      }
      setScanning(true);
      try {
        const {
          data,
          error
        } = await supabase.functions.invoke("scan-body-stats", {
          body: {
            imageBase64: base64
          }
        });
        if (error) {
          if (typeof navigator !== "undefined" && !navigator.onLine) {
            const {
              enqueueBodyScan
            } = await import("./router-L3bJVu16.js").then((n) => n.v);
            const {
              toast: toast2
            } = await import("sonner");
            await enqueueBodyScan(base64);
            toast2("Body scan queued — will read when back online");
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
        await supabase.from("weight_logs").insert({
          user_id: user.id,
          weight_kg: data.weight_kg || 0,
          logged_at: data.date || (/* @__PURE__ */ new Date()).toISOString().slice(0, 10),
          bmi: data.bmi || null,
          body_fat_percent: data.body_fat_percent || null,
          body_fat_mass_kg: data.body_fat_mass_kg || null,
          height_m: data.height_m || null
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
        setEditPhone(c.profile.phone ?? "");
        setEditTargetWeight(String(c.profile.target_weight_kg ?? ""));
        setEditTargetBmi(String(c.profile.target_bmi ?? ""));
        setEditTargetBodyFat(String(c.profile.target_body_fat_percent ?? ""));
      }
      if (c.macros) setMacros(c.macros);
      if (c.goal) setGoal(c.goal);
      if (c.weightLogs) setWeightLogs(c.weightLogs);
      setProfileLoading(false);
    } catch {
    }
  }, []);
  useEffect(() => {
    if (authLoading || !user) return;
    supabase.from("user_profiles").select("onboarding_completed").eq("user_id", user.id).maybeSingle().then(({
      data
    }) => {
      if (!data?.onboarding_completed) {
        navigate({
          to: "/onboarding",
          replace: true
        });
      }
      setGuardReady(true);
    });
  }, [user, authLoading, navigate]);
  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      navigate({
        to: "/welcome",
        replace: true
      });
      setProfileLoading(false);
      return;
    }
    Promise.all([loadCalorieGoal(), supabase.from("user_profiles").select("*").eq("user_id", user.id).maybeSingle(), supabase.from("user_settings").select("*").eq("user_id", user.id).maybeSingle(), supabase.from("weight_logs").select("*").eq("user_id", user.id).order("logged_at", {
      ascending: true
    }).limit(90)]).then(([fetchedGoal, profileRes, settingsRes, weightRes]) => {
      setGoal(fetchedGoal);
      let profileData = null;
      let macrosData = {
        calories: fetchedGoal,
        protein: 0,
        carbs: 0,
        fat: 0
      };
      let logsData = [];
      if (profileRes.data) {
        const p = profileRes.data;
        profileData = {
          age: profileRes.data.age,
          weight_kg: profileRes.data.weight_kg,
          gender: profileRes.data.gender,
          workout_days_per_week: profileRes.data.workout_days_per_week,
          goal: profileRes.data.goal,
          phone: p.phone ?? null,
          target_weight_kg: p.target_weight_kg ?? null,
          target_bmi: p.target_bmi ?? null,
          target_body_fat_percent: p.target_body_fat_percent ?? null
        };
        setProfile(profileData);
        setEditAge(String(profileData.age ?? ""));
        setEditWeight(String(profileData.weight_kg ?? ""));
        setEditGender(profileData.gender ?? "");
        setEditWorkoutDays(profileData.workout_days_per_week ?? 3);
        setEditGoal(profileData.goal ?? "");
        setEditPhone(profileData.phone ?? "");
        setEditTargetWeight(String(profileData.target_weight_kg ?? ""));
        setEditTargetBmi(String(profileData.target_bmi ?? ""));
        setEditTargetBodyFat(String(profileData.target_body_fat_percent ?? ""));
      }
      if (settingsRes.data) {
        const s = settingsRes.data;
        macrosData = {
          calories: settingsRes.data.daily_calorie_goal,
          protein: s.protein_goal ?? 0,
          carbs: s.carbs_goal ?? 0,
          fat: s.fat_goal ?? 0
        };
        setMacros(macrosData);
      }
      if (weightRes.data) {
        logsData = weightRes.data.map((d) => ({
          id: d.id,
          weight_kg: Number(d.weight_kg),
          logged_at: d.logged_at,
          bmi: d.bmi != null ? Number(d.bmi) : null,
          body_fat_percent: d.body_fat_percent != null ? Number(d.body_fat_percent) : null,
          body_fat_mass_kg: d.body_fat_mass_kg != null ? Number(d.body_fat_mass_kg) : null,
          height_m: d.height_m != null ? Number(d.height_m) : null
        }));
        setWeightLogs(logsData);
      }
      setProfileLoading(false);
      try {
        localStorage.setItem("zyrafit_profile_cache", JSON.stringify({
          profile: profileData,
          macros: macrosData,
          goal: fetchedGoal,
          weightLogs: logsData
        }));
      } catch {
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
      setEditPhone(profile.phone ?? "");
      setEditTargetWeight(String(profile.target_weight_kg ?? ""));
      setEditTargetBmi(String(profile.target_bmi ?? ""));
      setEditTargetBodyFat(String(profile.target_body_fat_percent ?? ""));
    }
    setEditingProfile(false);
  };
  const handleSaveProfile = async () => {
    if (!user) return;
    if (phoneError) return;
    setSaving(true);
    const ageNum = parseInt(editAge);
    const weightNum = parseFloat(editWeight);
    const heightNum = parseFloat(editHeight) || 170;
    const phoneVal = editPhone.trim() ? editPhone.trim().slice(0, 20) : null;
    const targetWeightNum = editTargetWeight ? parseFloat(editTargetWeight) : null;
    const targetBmiNum = editTargetBmi ? parseFloat(editTargetBmi) : null;
    const targetBodyFatNum = editTargetBodyFat ? parseFloat(editTargetBodyFat) : null;
    const newMacros = calculateMacros({
      age: ageNum,
      weight: weightNum,
      height: heightNum,
      gender: editGender,
      workoutDays: editWorkoutDays,
      goal: editGoal
    });
    await Promise.all([supabase.from("user_profiles").upsert({
      user_id: user.id,
      age: ageNum,
      weight_kg: weightNum,
      gender: editGender,
      workout_days_per_week: editWorkoutDays,
      goal: editGoal,
      target_weight_kg: targetWeightNum
    }, {
      onConflict: "user_id"
    }).then(() => {
      return supabase.from("user_profiles").update({
        phone: phoneVal,
        target_bmi: targetBmiNum,
        target_body_fat_percent: targetBodyFatNum
      }).eq("user_id", user.id);
    }), supabase.from("user_settings").upsert({
      user_id: user.id,
      daily_calorie_goal: newMacros.calories,
      protein_goal: newMacros.protein,
      carbs_goal: newMacros.carbs,
      fat_goal: newMacros.fat
    }, {
      onConflict: "user_id"
    })]);
    setGoal(newMacros.calories);
    setMacros(newMacros);
    setProfile({
      age: ageNum,
      weight_kg: weightNum,
      gender: editGender,
      workout_days_per_week: editWorkoutDays,
      goal: editGoal,
      phone: phoneVal,
      target_weight_kg: targetWeightNum,
      target_bmi: targetBmiNum,
      target_body_fat_percent: targetBodyFatNum
    });
    setEditingProfile(false);
    setSaving(false);
  };
  const handleSignOut = async () => {
    await signOut();
    navigate({
      to: "/app"
    });
  };
  const goalLabel = GOALS.find((g) => g.value === profile?.goal)?.label ?? "—";
  const genderLabel = GENDERS.find((g) => g.value === profile?.gender)?.label ?? "—";
  if (!guardReady) {
    return /* @__PURE__ */ jsx(DashboardSkeleton, {});
  }
  return /* @__PURE__ */ jsxs("div", { className: "min-h-screen bg-background pb-28", children: [
    /* @__PURE__ */ jsx("div", { className: "px-6 pt-14 pb-6", children: /* @__PURE__ */ jsx("h1", { className: "text-2xl font-bold text-foreground", children: "Profile" }) }),
    /* @__PURE__ */ jsxs("div", { className: "px-6 space-y-4", children: [
      /* @__PURE__ */ jsxs(motion.div, { initial: {
        opacity: 0,
        y: 10
      }, animate: {
        opacity: 1,
        y: 0
      }, className: "rounded-2xl bg-card p-6 shadow-sm border border-border/50 flex flex-col items-center gap-4", children: [
        /* @__PURE__ */ jsx("div", { className: "w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center", children: /* @__PURE__ */ jsx(User, { className: "w-10 h-10 text-primary" }) }),
        user ? /* @__PURE__ */ jsxs("div", { className: "text-center", children: [
          /* @__PURE__ */ jsx("h2", { className: "text-lg font-semibold text-card-foreground", children: user.email }),
          /* @__PURE__ */ jsx("p", { className: "text-sm text-muted-foreground", children: "Syncing across devices" })
        ] }) : /* @__PURE__ */ jsxs("div", { className: "text-center", children: [
          /* @__PURE__ */ jsx("h2", { className: "text-lg font-semibold text-card-foreground", children: "Guest" }),
          /* @__PURE__ */ jsx("p", { className: "text-sm text-muted-foreground", children: "Sign in to sync your data" })
        ] })
      ] }),
      user && !profileLoading && /* @__PURE__ */ jsxs(motion.div, { initial: {
        opacity: 0,
        y: 10
      }, animate: {
        opacity: 1,
        y: 0
      }, transition: {
        delay: 0.05
      }, className: "rounded-2xl bg-card shadow-sm border border-border/50 overflow-hidden", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between p-5 pb-3", children: [
          /* @__PURE__ */ jsx("h3", { className: "font-semibold text-card-foreground", children: "Your Details" }),
          !editingProfile ? /* @__PURE__ */ jsxs("button", { onClick: startEditing, className: "flex items-center gap-1 text-sm text-primary font-medium", children: [
            /* @__PURE__ */ jsx(Pencil, { className: "w-3.5 h-3.5" }),
            " Edit"
          ] }) : /* @__PURE__ */ jsxs("button", { onClick: cancelEditing, className: "flex items-center gap-1 text-sm text-muted-foreground font-medium", children: [
            /* @__PURE__ */ jsx(X, { className: "w-3.5 h-3.5" }),
            " Cancel"
          ] })
        ] }),
        /* @__PURE__ */ jsx(AnimatePresence, { mode: "wait", children: !editingProfile ? /* @__PURE__ */ jsxs(motion.div, { initial: {
          opacity: 0
        }, animate: {
          opacity: 1
        }, exit: {
          opacity: 0
        }, className: "px-5 pb-5 space-y-3", children: [
          /* @__PURE__ */ jsx(ProfileRow, { icon: /* @__PURE__ */ jsx(User, { className: "w-4 h-4" }), label: "Gender", value: genderLabel }),
          /* @__PURE__ */ jsx(ProfileRow, { icon: /* @__PURE__ */ jsx(User, { className: "w-4 h-4" }), label: "Age", value: profile?.age ? `${profile.age} years` : "—" }),
          /* @__PURE__ */ jsx(ProfileRow, { icon: /* @__PURE__ */ jsx(Weight, { className: "w-4 h-4" }), label: "Weight", value: profile?.weight_kg ? `${profile.weight_kg} kg` : "—" }),
          /* @__PURE__ */ jsx(ProfileRow, { icon: /* @__PURE__ */ jsx(Dumbbell, { className: "w-4 h-4" }), label: "Workouts", value: profile?.workout_days_per_week != null ? `${profile.workout_days_per_week} days/week` : "—" }),
          /* @__PURE__ */ jsx(ProfileRow, { icon: /* @__PURE__ */ jsx(Target, { className: "w-4 h-4" }), label: "Goal", value: goalLabel }),
          /* @__PURE__ */ jsx(ProfileRow, { icon: /* @__PURE__ */ jsx(Phone, { className: "w-4 h-4" }), label: "Phone", value: profile?.phone || "—" }),
          /* @__PURE__ */ jsx(ProfileRow, { icon: /* @__PURE__ */ jsx(Target, { className: "w-4 h-4" }), label: "Target Weight", value: profile?.target_weight_kg ? `${profile.target_weight_kg} kg` : "—" }),
          /* @__PURE__ */ jsx(ProfileRow, { icon: /* @__PURE__ */ jsx(Target, { className: "w-4 h-4" }), label: "Target BMI", value: profile?.target_bmi ? `${profile.target_bmi}` : "—" }),
          /* @__PURE__ */ jsx(ProfileRow, { icon: /* @__PURE__ */ jsx(Target, { className: "w-4 h-4" }), label: "Target Body Fat", value: profile?.target_body_fat_percent ? `${profile.target_body_fat_percent}%` : "—" })
        ] }, "view") : /* @__PURE__ */ jsxs(motion.div, { initial: {
          opacity: 0
        }, animate: {
          opacity: 1
        }, exit: {
          opacity: 0
        }, className: "px-5 pb-5 space-y-4", children: [
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("label", { className: "text-xs text-muted-foreground mb-1.5 block", children: "Gender" }),
            /* @__PURE__ */ jsx("div", { className: "grid grid-cols-2 gap-2", children: GENDERS.map((g) => /* @__PURE__ */ jsxs("button", { onClick: () => setEditGender(g.value), className: `flex items-center gap-2 px-3 py-2.5 rounded-xl border text-sm transition-all ${editGender === g.value ? "border-primary bg-primary/10 text-foreground font-medium" : "border-border/50 bg-muted/50 text-muted-foreground"}`, children: [
              /* @__PURE__ */ jsx("span", { children: g.emoji }),
              " ",
              g.label
            ] }, g.value)) })
          ] }),
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("label", { className: "text-xs text-muted-foreground mb-1.5 block", children: "Age" }),
            /* @__PURE__ */ jsx("input", { type: "number", value: editAge, onChange: (e) => setEditAge(e.target.value), className: "w-full px-4 py-3 rounded-xl bg-muted text-foreground border-none outline-none focus:ring-2 focus:ring-primary/30", min: "10", max: "120" })
          ] }),
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("label", { className: "text-xs text-muted-foreground mb-1.5 block", children: "Height (cm)" }),
            /* @__PURE__ */ jsx("input", { type: "number", value: editHeight, onChange: (e) => setEditHeight(e.target.value), className: "w-full px-4 py-3 rounded-xl bg-muted text-foreground border-none outline-none focus:ring-2 focus:ring-primary/30", min: "50", max: "300" })
          ] }),
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("label", { className: "text-xs text-muted-foreground mb-1.5 block", children: "Weight (kg)" }),
            /* @__PURE__ */ jsx("input", { type: "number", value: editWeight, onChange: (e) => setEditWeight(e.target.value), step: "0.1", className: "w-full px-4 py-3 rounded-xl bg-muted text-foreground border-none outline-none focus:ring-2 focus:ring-primary/30", min: "20", max: "300" })
          ] }),
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsxs("label", { className: "text-xs text-muted-foreground mb-1.5 block", children: [
              "Workout days per week: ",
              editWorkoutDays
            ] }),
            /* @__PURE__ */ jsx("input", { type: "range", min: "0", max: "7", value: editWorkoutDays, onChange: (e) => setEditWorkoutDays(parseInt(e.target.value)), className: "w-full accent-primary" }),
            /* @__PURE__ */ jsxs("div", { className: "flex justify-between text-xs text-muted-foreground", children: [
              /* @__PURE__ */ jsx("span", { children: "0" }),
              /* @__PURE__ */ jsx("span", { children: "7" })
            ] })
          ] }),
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("label", { className: "text-xs text-muted-foreground mb-1.5 block", children: "Goal" }),
            /* @__PURE__ */ jsx("div", { className: "space-y-2", children: GOALS.map((g) => /* @__PURE__ */ jsxs("button", { onClick: () => setEditGoal(g.value), className: `w-full flex items-center gap-3 px-4 py-3 rounded-xl border text-sm transition-all ${editGoal === g.value ? "border-primary bg-primary/10 text-foreground font-medium" : "border-border/50 bg-muted/50 text-muted-foreground"}`, children: [
              /* @__PURE__ */ jsx("span", { className: "text-lg", children: g.emoji }),
              " ",
              g.label,
              editGoal === g.value && /* @__PURE__ */ jsx(Check, { className: "w-4 h-4 ml-auto text-primary" })
            ] }, g.value)) })
          ] }),
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("label", { className: "text-xs text-muted-foreground mb-1.5 block", children: "Phone number" }),
            /* @__PURE__ */ jsx("input", { type: "tel", inputMode: "tel", autoComplete: "tel", value: editPhone, onChange: (e) => setEditPhone(e.target.value.slice(0, 20)), placeholder: "+44 7700 900123", maxLength: 20, className: `w-full px-4 py-3 rounded-xl bg-muted text-foreground border outline-none focus:ring-2 focus:ring-primary/30 placeholder:text-muted-foreground/40 ${phoneError ? "border-destructive" : "border-transparent"}` }),
            phoneError && /* @__PURE__ */ jsx("p", { className: "text-xs text-destructive mt-1.5", children: "Enter a valid phone number (7–15 digits)." })
          ] }),
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("label", { className: "text-xs text-muted-foreground mb-1.5 block", children: "Target Weight (kg)" }),
            /* @__PURE__ */ jsx("input", { type: "number", value: editTargetWeight, onChange: (e) => setEditTargetWeight(e.target.value), placeholder: "e.g. 65", step: "0.1", className: "w-full px-4 py-3 rounded-xl bg-muted text-foreground border-none outline-none focus:ring-2 focus:ring-primary/30 placeholder:text-muted-foreground/40", min: "20", max: "300" })
          ] }),
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("label", { className: "text-xs text-muted-foreground mb-1.5 block", children: "Target BMI" }),
            /* @__PURE__ */ jsx("input", { type: "number", value: editTargetBmi, onChange: (e) => setEditTargetBmi(e.target.value), placeholder: "e.g. 22", step: "0.1", className: "w-full px-4 py-3 rounded-xl bg-muted text-foreground border-none outline-none focus:ring-2 focus:ring-primary/30 placeholder:text-muted-foreground/40", min: "10", max: "50" })
          ] }),
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("label", { className: "text-xs text-muted-foreground mb-1.5 block", children: "Target Body Fat %" }),
            /* @__PURE__ */ jsx("input", { type: "number", value: editTargetBodyFat, onChange: (e) => setEditTargetBodyFat(e.target.value), placeholder: "e.g. 15", step: "0.1", className: "w-full px-4 py-3 rounded-xl bg-muted text-foreground border-none outline-none focus:ring-2 focus:ring-primary/30 placeholder:text-muted-foreground/40", min: "3", max: "60" })
          ] }),
          /* @__PURE__ */ jsx("button", { onClick: handleSaveProfile, disabled: saving || phoneError || !editAge || !editWeight || !editGoal, className: "w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-primary text-primary-foreground font-semibold shadow-lg shadow-primary/25 disabled:opacity-40", children: saving ? "Saving…" : "Save & Recalculate" })
        ] }, "edit") })
      ] }),
      user && !profileLoading && /* @__PURE__ */ jsx(MacroGoalsCard, { macros, setMacros, goal, setGoal, userId: user.id }),
      user && !profileLoading && profile?.target_weight_kg && profile?.weight_kg && /* @__PURE__ */ jsxs(motion.div, { initial: {
        opacity: 0,
        y: 10
      }, animate: {
        opacity: 1,
        y: 0
      }, transition: {
        delay: 0.12
      }, className: "rounded-2xl bg-card p-5 shadow-sm border border-border/50", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3 mb-4", children: [
          /* @__PURE__ */ jsx("div", { className: "w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center", children: /* @__PURE__ */ jsx(Weight, { className: "w-5 h-5 text-primary" }) }),
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("h3", { className: "font-semibold text-card-foreground", children: "Weight Progress" }),
            /* @__PURE__ */ jsx("p", { className: "text-xs text-muted-foreground", children: "Track your journey" })
          ] })
        ] }),
        (() => {
          const current = Number(profile.weight_kg);
          const target = Number(profile.target_weight_kg);
          const diff = current - target;
          const absDiff = Math.abs(diff);
          const isAtGoal = absDiff < 0.5;
          const startDiff = Math.max(absDiff, 1);
          const progress = isAtGoal ? 100 : Math.min(95, Math.max(5, (startDiff - absDiff) / startDiff * 100 + 50));
          return /* @__PURE__ */ jsxs("div", { className: "space-y-4", children: [
            /* @__PURE__ */ jsxs("div", { className: "flex justify-between items-end", children: [
              /* @__PURE__ */ jsxs("div", { className: "text-center", children: [
                /* @__PURE__ */ jsx("p", { className: "text-2xl font-bold text-foreground", children: current }),
                /* @__PURE__ */ jsx("p", { className: "text-xs text-muted-foreground", children: "Current (kg)" })
              ] }),
              /* @__PURE__ */ jsx("div", { className: "flex-1 flex items-center justify-center px-4", children: /* @__PURE__ */ jsx("div", { className: "text-center", children: isAtGoal ? /* @__PURE__ */ jsx("span", { className: "text-lg font-semibold text-primary", children: "🎉 Goal reached!" }) : /* @__PURE__ */ jsx(Fragment, { children: /* @__PURE__ */ jsx("p", { className: "text-lg font-bold text-foreground", children: diff > 0 ? `${absDiff.toFixed(1)} kg to lose` : `${absDiff.toFixed(1)} kg to gain` }) }) }) }),
              /* @__PURE__ */ jsxs("div", { className: "text-center", children: [
                /* @__PURE__ */ jsx("p", { className: "text-2xl font-bold text-primary", children: target }),
                /* @__PURE__ */ jsx("p", { className: "text-xs text-muted-foreground", children: "Target (kg)" })
              ] })
            ] }),
            /* @__PURE__ */ jsx("div", { className: "h-3 rounded-full bg-muted overflow-hidden", children: /* @__PURE__ */ jsx(motion.div, { className: "h-full rounded-full bg-primary", initial: {
              width: 0
            }, animate: {
              width: `${progress}%`
            }, transition: {
              duration: 0.8,
              ease: "easeOut"
            } }) })
          ] });
        })()
      ] }),
      user && !profileLoading && weightLogs.length > 0 && (() => {
        const latest = weightLogs[weightLogs.length - 1];
        if (latest.bmi == null && latest.body_fat_percent == null) return null;
        return /* @__PURE__ */ jsx(Suspense, { fallback: null, children: /* @__PURE__ */ jsx(BodyCompositionCard, { latest, gender: profile?.gender }) });
      })(),
      user && !profileLoading && /* @__PURE__ */ jsxs(motion.div, { initial: {
        opacity: 0,
        y: 10
      }, animate: {
        opacity: 1,
        y: 0
      }, transition: {
        delay: 0.14
      }, className: "rounded-2xl bg-card shadow-sm border border-border/50 overflow-hidden", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between p-5 pb-3", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3", children: [
            /* @__PURE__ */ jsx("div", { className: "w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center", children: /* @__PURE__ */ jsx(Weight, { className: "w-5 h-5 text-primary" }) }),
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("h3", { className: "font-semibold text-card-foreground", children: "Body Stats" }),
              /* @__PURE__ */ jsxs("p", { className: "text-xs text-muted-foreground", children: [
                weightLogs.length,
                " entries"
              ] })
            ] })
          ] }),
          /* @__PURE__ */ jsxs("button", { onClick: handleScanPhoto, disabled: scanning, className: "flex items-center gap-1.5 px-3 py-2 rounded-xl bg-primary text-primary-foreground font-medium text-xs disabled:opacity-40 shadow-sm", children: [
            scanning ? /* @__PURE__ */ jsx(Loader2, { className: "w-3.5 h-3.5 animate-spin" }) : /* @__PURE__ */ jsx(Camera, { className: "w-3.5 h-3.5" }),
            scanning ? "Scanning…" : "📷 Scan"
          ] })
        ] }),
        weightLogs.length > 0 && (() => {
          const latest = weightLogs[weightLogs.length - 1];
          const prev = weightLogs.length > 1 ? weightLogs[weightLogs.length - 2] : null;
          const weightDiff = prev ? latest.weight_kg - prev.weight_kg : null;
          const bmiCategory = latest.bmi != null ? latest.bmi < 18.5 ? "Underweight" : latest.bmi < 25 ? "Normal" : latest.bmi < 30 ? "Overweight" : "Obese" : null;
          const bmiColor = latest.bmi != null ? latest.bmi < 18.5 ? "text-blue-500" : latest.bmi < 25 ? "text-primary" : latest.bmi < 30 ? "text-amber-500" : "text-destructive" : "";
          return /* @__PURE__ */ jsx("div", { className: "px-5 pb-3", children: /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-3 gap-2", children: [
            /* @__PURE__ */ jsxs("div", { className: "rounded-xl bg-muted/50 p-3 text-center", children: [
              /* @__PURE__ */ jsx("p", { className: "text-lg font-bold text-foreground", children: latest.weight_kg }),
              /* @__PURE__ */ jsx("p", { className: "text-[10px] text-muted-foreground", children: "Weight (kg)" }),
              weightDiff != null && /* @__PURE__ */ jsxs("p", { className: `text-[10px] font-medium mt-0.5 ${weightDiff < 0 ? "text-primary" : weightDiff > 0 ? "text-destructive" : "text-muted-foreground"}`, children: [
                weightDiff > 0 ? "+" : "",
                weightDiff.toFixed(1)
              ] })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "rounded-xl bg-muted/50 p-3 text-center", children: [
              /* @__PURE__ */ jsx("p", { className: "text-lg font-bold text-foreground", children: latest.bmi ?? "—" }),
              /* @__PURE__ */ jsx("p", { className: "text-[10px] text-muted-foreground", children: "BMI" }),
              bmiCategory && /* @__PURE__ */ jsx("p", { className: `text-[10px] font-medium mt-0.5 ${bmiColor}`, children: bmiCategory })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "rounded-xl bg-muted/50 p-3 text-center", children: [
              /* @__PURE__ */ jsx("p", { className: "text-lg font-bold text-foreground", children: latest.body_fat_percent != null ? `${latest.body_fat_percent}` : "—" }),
              /* @__PURE__ */ jsx("p", { className: "text-[10px] text-muted-foreground", children: "Body Fat %" }),
              latest.body_fat_mass_kg != null && /* @__PURE__ */ jsxs("p", { className: "text-[10px] text-muted-foreground mt-0.5", children: [
                latest.body_fat_mass_kg,
                " kg"
              ] })
            ] })
          ] }) });
        })(),
        weightLogs.length >= 2 && /* @__PURE__ */ jsxs("div", { className: "px-5", children: [
          /* @__PURE__ */ jsx("div", { className: "flex gap-1 mb-2", children: [{
            key: "1w",
            label: "1W"
          }, {
            key: "1m",
            label: "1M"
          }, {
            key: "3m",
            label: "3M"
          }, {
            key: "all",
            label: "All"
          }].map((r) => /* @__PURE__ */ jsx("button", { onClick: () => setTimeRange(r.key), className: `px-3 py-1 rounded-lg text-[11px] font-semibold transition-all ${timeRange === r.key ? "bg-foreground text-background shadow-sm" : "text-muted-foreground hover:text-foreground"}`, children: r.label }, r.key)) }),
          /* @__PURE__ */ jsx("div", { className: "flex gap-1 mb-3 bg-muted/50 rounded-xl p-1", children: ["weight", "bmi", "bodyfat"].map((tab) => {
            const labels = {
              weight: "Weight",
              bmi: "BMI",
              bodyfat: "Fat"
            };
            const activeColors = {
              weight: "bg-primary text-primary-foreground shadow-md shadow-primary/25",
              bmi: "bg-blue-500 text-white shadow-md shadow-blue-500/25",
              bodyfat: "bg-rose-500 text-white shadow-md shadow-rose-500/25"
            };
            const values = filteredLogs.map((l) => tab === "weight" ? l.weight_kg : tab === "bmi" ? l.bmi : l.body_fat_percent).filter((v) => v != null);
            const first = values.length >= 2 ? values[0] : null;
            const last = values.length >= 2 ? values[values.length - 1] : null;
            const change = first != null && last != null ? last - first : null;
            const pctChange = first != null && change != null && first !== 0 ? change / first * 100 : null;
            const isGood = change != null ? change <= 0 : null;
            const isActive = activeChart === tab;
            return /* @__PURE__ */ jsxs("button", { onClick: () => setActiveChart(tab), className: `flex-1 flex flex-col items-center gap-0.5 py-2 rounded-lg text-xs font-semibold transition-all ${isActive ? activeColors[tab] : "text-muted-foreground hover:text-foreground"}`, children: [
              /* @__PURE__ */ jsx("span", { children: labels[tab] }),
              pctChange != null && /* @__PURE__ */ jsxs("span", { className: `flex items-center gap-0.5 text-[9px] font-bold ${isActive ? "opacity-90" : isGood ? "text-primary" : "text-destructive"}`, children: [
                change > 0 ? "↑" : change < 0 ? "↓" : "→",
                Math.abs(pctChange).toFixed(1),
                "%"
              ] })
            ] }, tab);
          }) }),
          filteredLogs.length < 2 ? /* @__PURE__ */ jsx("div", { className: "text-center py-8 text-sm text-muted-foreground", children: "Not enough data for this time range" }) : /* @__PURE__ */ jsxs(Fragment, { children: [
            /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between mb-2", children: [
              /* @__PURE__ */ jsxs("div", { children: [
                /* @__PURE__ */ jsxs("p", { className: "text-xs font-medium text-foreground", children: [
                  activeChart === "weight" && "Weight Trend",
                  activeChart === "bmi" && "BMI Trend",
                  activeChart === "bodyfat" && "Body Fat Trend"
                ] }),
                /* @__PURE__ */ jsxs("p", { className: "text-[10px] text-muted-foreground", children: [
                  activeChart === "weight" && "Tracking your weight over time",
                  activeChart === "bmi" && "18.5–25 is the healthy range",
                  activeChart === "bodyfat" && "Lower is leaner"
                ] })
              ] }),
              activeChart === "weight" && profile?.target_weight_kg && /* @__PURE__ */ jsx("div", { className: "flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-primary/10 border border-primary/20", children: /* @__PURE__ */ jsxs("span", { className: "text-[10px] text-primary font-semibold", children: [
                "🎯 ",
                Number(profile.target_weight_kg),
                " kg"
              ] }) }),
              activeChart === "bmi" && profile?.target_bmi && /* @__PURE__ */ jsx("div", { className: "flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-blue-500/10 border border-blue-500/20", children: /* @__PURE__ */ jsxs("span", { className: "text-[10px] text-blue-600 font-semibold", children: [
                "🎯 BMI ",
                profile.target_bmi
              ] }) }),
              activeChart === "bmi" && !profile?.target_bmi && /* @__PURE__ */ jsx("div", { className: "flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-blue-500/10 border border-blue-500/20", children: /* @__PURE__ */ jsx("span", { className: "text-[10px] text-blue-600 font-semibold", children: "Healthy: 18.5–25" }) }),
              activeChart === "bodyfat" && profile?.target_body_fat_percent && /* @__PURE__ */ jsx("div", { className: "flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-rose-500/10 border border-rose-500/20", children: /* @__PURE__ */ jsxs("span", { className: "text-[10px] text-rose-600 font-semibold", children: [
                "🎯 ",
                profile.target_body_fat_percent,
                "%"
              ] }) })
            ] }),
            (() => {
              const values = filteredLogs.map((l) => activeChart === "weight" ? l.weight_kg : activeChart === "bmi" ? l.bmi : l.body_fat_percent).filter((v) => v != null);
              if (values.length < 2) return null;
              const min = Math.min(...values);
              const max = Math.max(...values);
              const avg = values.reduce((a, b) => a + b, 0) / values.length;
              const unit = activeChart === "weight" ? " kg" : activeChart === "bodyfat" ? "%" : "";
              const change = values[values.length - 1] - values[0];
              return /* @__PURE__ */ jsx("div", { className: "grid grid-cols-4 gap-1.5 mb-3", children: [{
                label: "Min",
                value: min.toFixed(1) + unit
              }, {
                label: "Max",
                value: max.toFixed(1) + unit
              }, {
                label: "Avg",
                value: avg.toFixed(1) + unit
              }, {
                label: "Change",
                value: (change > 0 ? "+" : "") + change.toFixed(1) + unit,
                isChange: true,
                positive: activeChart === "weight" ? change < 0 : change < 0
              }].map((stat) => /* @__PURE__ */ jsxs("div", { className: "rounded-lg bg-muted/40 px-2 py-1.5 text-center", children: [
                /* @__PURE__ */ jsx("p", { className: `text-xs font-bold ${stat.isChange ? stat.positive ? "text-primary" : "text-destructive" : "text-foreground"}`, children: stat.value }),
                /* @__PURE__ */ jsx("p", { className: "text-[9px] text-muted-foreground", children: stat.label })
              ] }, stat.label)) });
            })(),
            /* @__PURE__ */ jsx(Suspense, { fallback: /* @__PURE__ */ jsx("div", { className: "h-52 flex items-center justify-center", children: /* @__PURE__ */ jsx(Loader2, { className: "w-5 h-5 text-muted-foreground animate-spin" }) }), children: /* @__PURE__ */ jsx(WeightChart, { filteredLogs, activeChart, profile }) }),
            /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-center gap-3 mt-2 pb-1", children: [
              /* @__PURE__ */ jsxs("span", { className: "flex items-center gap-1 text-[10px] text-muted-foreground", children: [
                /* @__PURE__ */ jsx("span", { className: `w-2.5 h-2.5 rounded-full ${activeChart === "weight" ? "bg-primary" : activeChart === "bmi" ? "bg-blue-500" : "bg-rose-500"}` }),
                activeChart === "weight" ? "Weight (kg)" : activeChart === "bmi" ? "BMI" : "Body Fat %"
              ] }),
              activeChart === "weight" && profile?.target_weight_kg && /* @__PURE__ */ jsxs("span", { className: "flex items-center gap-1 text-[10px] text-muted-foreground", children: [
                /* @__PURE__ */ jsx("span", { className: "w-4 border-t-2 border-dashed border-primary" }),
                " Target"
              ] }),
              activeChart === "bmi" && /* @__PURE__ */ jsxs("span", { className: "flex items-center gap-1 text-[10px] text-muted-foreground", children: [
                /* @__PURE__ */ jsx("span", { className: "w-4 border-t-2 border-dashed border-destructive" }),
                " Thresholds"
              ] }),
              activeChart === "bmi" && profile?.target_bmi && /* @__PURE__ */ jsxs("span", { className: "flex items-center gap-1 text-[10px] text-muted-foreground", children: [
                /* @__PURE__ */ jsx("span", { className: "w-4 border-t-2 border-dashed border-blue-500" }),
                " Target"
              ] }),
              activeChart === "bodyfat" && profile?.target_body_fat_percent && /* @__PURE__ */ jsxs("span", { className: "flex items-center gap-1 text-[10px] text-muted-foreground", children: [
                /* @__PURE__ */ jsx("span", { className: "w-4 border-t-2 border-dashed border-rose-500" }),
                " Target"
              ] }),
              /* @__PURE__ */ jsxs("span", { className: "flex items-center gap-1 text-[10px] text-muted-foreground", children: [
                /* @__PURE__ */ jsx("span", { className: `w-3.5 h-3.5 rounded-full border-2 ${activeChart === "weight" ? "border-primary" : activeChart === "bmi" ? "border-blue-500" : "border-rose-500"}` }),
                " Latest"
              ] })
            ] })
          ] })
        ] }),
        weightLogs.length === 1 && /* @__PURE__ */ jsx("p", { className: "text-center text-sm text-muted-foreground py-6 px-5", children: "Log one more entry to see your trends 📈" }),
        weightLogs.length === 0 && /* @__PURE__ */ jsxs("div", { className: "text-center py-8 px-5", children: [
          /* @__PURE__ */ jsx("p", { className: "text-4xl mb-2", children: "📷" }),
          /* @__PURE__ */ jsx("p", { className: "text-sm font-medium text-foreground mb-1", children: "No entries yet" }),
          /* @__PURE__ */ jsx("p", { className: "text-xs text-muted-foreground", children: "Log manually or scan a gym receipt to start tracking" })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "px-5 py-3 border-t border-border/30", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex gap-2", children: [
            /* @__PURE__ */ jsx("input", { type: "number", value: newWeight, onChange: (e) => setNewWeight(e.target.value), placeholder: "Weight (kg)", step: "0.1", min: "20", max: "300", className: "flex-1 px-3 py-2.5 rounded-xl bg-muted text-foreground border-none outline-none focus:ring-2 focus:ring-primary/30 text-sm placeholder:text-muted-foreground/40" }),
            /* @__PURE__ */ jsx("button", { onClick: () => setShowManualFields(!showManualFields), className: `px-3 py-2.5 rounded-xl text-xs font-medium transition-colors ${showManualFields ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"}`, children: showManualFields ? "Less" : "+ More" }),
            /* @__PURE__ */ jsx("button", { onClick: addWeightLog, disabled: addingWeight || !newWeight, className: "px-4 py-2.5 rounded-xl bg-primary text-primary-foreground font-medium text-sm disabled:opacity-40", children: "Log" })
          ] }),
          /* @__PURE__ */ jsx(AnimatePresence, { children: showManualFields && /* @__PURE__ */ jsx(motion.div, { initial: {
            height: 0,
            opacity: 0
          }, animate: {
            height: "auto",
            opacity: 1
          }, exit: {
            height: 0,
            opacity: 0
          }, className: "overflow-hidden", children: /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-2 gap-2 pt-2", children: [
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("label", { className: "text-[10px] text-muted-foreground mb-0.5 block", children: "BMI" }),
              /* @__PURE__ */ jsx("input", { type: "number", value: newBmi, onChange: (e) => setNewBmi(e.target.value), placeholder: "e.g. 27.5", step: "0.1", className: "w-full px-3 py-2 rounded-xl bg-muted text-foreground border-none outline-none focus:ring-2 focus:ring-primary/30 text-sm placeholder:text-muted-foreground/40" })
            ] }),
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("label", { className: "text-[10px] text-muted-foreground mb-0.5 block", children: "Body Fat %" }),
              /* @__PURE__ */ jsx("input", { type: "number", value: newBodyFat, onChange: (e) => setNewBodyFat(e.target.value), placeholder: "e.g. 32.5", step: "0.1", className: "w-full px-3 py-2 rounded-xl bg-muted text-foreground border-none outline-none focus:ring-2 focus:ring-primary/30 text-sm placeholder:text-muted-foreground/40" })
            ] }),
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("label", { className: "text-[10px] text-muted-foreground mb-0.5 block", children: "Fat Mass (kg)" }),
              /* @__PURE__ */ jsx("input", { type: "number", value: newBodyFatMass, onChange: (e) => setNewBodyFatMass(e.target.value), placeholder: "e.g. 32.2", step: "0.1", className: "w-full px-3 py-2 rounded-xl bg-muted text-foreground border-none outline-none focus:ring-2 focus:ring-primary/30 text-sm placeholder:text-muted-foreground/40" })
            ] }),
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("label", { className: "text-[10px] text-muted-foreground mb-0.5 block", children: "Height (m)" }),
              /* @__PURE__ */ jsx("input", { type: "number", value: newHeightM, onChange: (e) => setNewHeightM(e.target.value), placeholder: "e.g. 1.90", step: "0.01", className: "w-full px-3 py-2 rounded-xl bg-muted text-foreground border-none outline-none focus:ring-2 focus:ring-primary/30 text-sm placeholder:text-muted-foreground/40" })
            ] })
          ] }) }) })
        ] }),
        weightLogs.length > 0 && /* @__PURE__ */ jsxs("div", { className: "border-t border-border/30", children: [
          /* @__PURE__ */ jsx("div", { className: "px-5 pt-3 pb-1", children: /* @__PURE__ */ jsx("p", { className: "text-xs text-muted-foreground font-semibold", children: "Recent Entries" }) }),
          /* @__PURE__ */ jsx("div", { className: "px-5 pb-4 space-y-1.5", children: [...weightLogs].reverse().slice(0, 5).map((log, i) => {
            const prev = [...weightLogs].reverse()[i + 1];
            const diff = prev ? log.weight_kg - prev.weight_kg : null;
            return /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3 py-2 px-3 rounded-xl hover:bg-muted/30 transition-colors group", children: [
              /* @__PURE__ */ jsx("div", { className: "w-8 h-8 rounded-lg bg-muted flex items-center justify-center text-xs font-bold text-muted-foreground shrink-0", children: format(parseISO(log.logged_at), "d") }),
              /* @__PURE__ */ jsxs("div", { className: "flex-1 min-w-0", children: [
                /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
                  /* @__PURE__ */ jsxs("span", { className: "text-sm font-semibold text-foreground", children: [
                    log.weight_kg,
                    " kg"
                  ] }),
                  diff != null && /* @__PURE__ */ jsxs("span", { className: `text-[10px] font-medium px-1.5 py-0.5 rounded-full ${diff < 0 ? "bg-primary/10 text-primary" : diff > 0 ? "bg-destructive/10 text-destructive" : "bg-muted text-muted-foreground"}`, children: [
                    diff > 0 ? "+" : "",
                    diff.toFixed(1)
                  ] })
                ] }),
                /* @__PURE__ */ jsxs("div", { className: "flex gap-3 text-[10px] text-muted-foreground", children: [
                  /* @__PURE__ */ jsx("span", { children: format(parseISO(log.logged_at), "MMM yyyy") }),
                  log.bmi != null && /* @__PURE__ */ jsxs("span", { children: [
                    "BMI ",
                    log.bmi
                  ] }),
                  log.body_fat_percent != null && /* @__PURE__ */ jsxs("span", { children: [
                    log.body_fat_percent,
                    "% fat"
                  ] })
                ] })
              ] }),
              /* @__PURE__ */ jsx("button", { onClick: () => deleteWeightLog(log.id), className: "p-1.5 text-muted-foreground/30 hover:text-destructive transition-colors opacity-0 group-hover:opacity-100", children: /* @__PURE__ */ jsx(Trash2, { className: "w-3.5 h-3.5" }) })
            ] }, log.id);
          }) })
        ] })
      ] }),
      user && /* @__PURE__ */ jsx(RemindersToggle, {}),
      user && /* @__PURE__ */ jsx(MealReminderTimes, {}),
      !authLoading && /* @__PURE__ */ jsx(motion.div, { initial: {
        opacity: 0
      }, animate: {
        opacity: 1
      }, transition: {
        delay: 0.15
      }, children: user ? /* @__PURE__ */ jsxs("button", { onClick: handleSignOut, className: "w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-destructive/10 text-destructive font-medium hover:bg-destructive/20 transition-colors", children: [
        /* @__PURE__ */ jsx(LogOut, { className: "w-4 h-4" }),
        "Sign Out"
      ] }) : /* @__PURE__ */ jsxs("button", { onClick: () => navigate({
        to: "/login"
      }), className: "w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-primary text-primary-foreground font-semibold shadow-lg shadow-primary/25", children: [
        /* @__PURE__ */ jsx(LogIn, { className: "w-4 h-4" }),
        "Sign In"
      ] }) })
    ] }),
    /* @__PURE__ */ jsx(BottomNav, { onAddClick: () => navigate({
      to: "/app"
    }) })
  ] });
}
function ProfileRow({
  icon,
  label,
  value
}) {
  return /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3 py-2", children: [
    /* @__PURE__ */ jsx("div", { className: "w-8 h-8 rounded-lg bg-muted flex items-center justify-center text-muted-foreground", children: icon }),
    /* @__PURE__ */ jsx("span", { className: "text-sm text-muted-foreground flex-1", children: label }),
    /* @__PURE__ */ jsx("span", { className: "text-sm font-medium text-foreground", children: value })
  ] });
}
function MacroCard({
  label,
  value,
  color
}) {
  return /* @__PURE__ */ jsxs("div", { className: "rounded-xl bg-muted/50 p-3 text-center", children: [
    /* @__PURE__ */ jsx("p", { className: "text-lg font-bold text-foreground", children: value }),
    /* @__PURE__ */ jsx("p", { className: "text-xs text-muted-foreground", children: label }),
    /* @__PURE__ */ jsx("div", { className: `w-full h-1 rounded-full mt-2 ${color} opacity-60` })
  ] });
}
function MacroGoalsCard({
  macros,
  setMacros,
  goal,
  setGoal,
  userId
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
      fat: parseInt(editFat) || 0
    };
    await supabase.from("user_settings").upsert({
      user_id: userId,
      daily_calorie_goal: newMacros.calories,
      protein_goal: newMacros.protein,
      carbs_goal: newMacros.carbs,
      fat_goal: newMacros.fat
    }, {
      onConflict: "user_id"
    });
    await saveCalorieGoal(newMacros.calories);
    setMacros(newMacros);
    setGoal(newMacros.calories);
    setEditing(false);
    setSaving(false);
  };
  return /* @__PURE__ */ jsxs(motion.div, { initial: {
    opacity: 0,
    y: 10
  }, animate: {
    opacity: 1,
    y: 0
  }, transition: {
    delay: 0.1
  }, className: "rounded-2xl bg-card p-5 shadow-sm border border-border/50", children: [
    /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between mb-4", children: [
      /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3", children: [
        /* @__PURE__ */ jsx("div", { className: "w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center", children: /* @__PURE__ */ jsx(Target, { className: "w-5 h-5 text-primary" }) }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("h3", { className: "font-semibold text-card-foreground", children: "Daily Goals" }),
          /* @__PURE__ */ jsx("p", { className: "text-xs text-muted-foreground", children: "Your personalized targets" })
        ] })
      ] }),
      !editing ? /* @__PURE__ */ jsxs("button", { onClick: startEdit, className: "flex items-center gap-1 text-sm text-primary font-medium", children: [
        /* @__PURE__ */ jsx(Pencil, { className: "w-3.5 h-3.5" }),
        " Edit"
      ] }) : /* @__PURE__ */ jsxs("button", { onClick: () => setEditing(false), className: "flex items-center gap-1 text-sm text-muted-foreground font-medium", children: [
        /* @__PURE__ */ jsx(X, { className: "w-3.5 h-3.5" }),
        " Cancel"
      ] })
    ] }),
    /* @__PURE__ */ jsx(AnimatePresence, { mode: "wait", children: !editing ? /* @__PURE__ */ jsxs(motion.div, { initial: {
      opacity: 0
    }, animate: {
      opacity: 1
    }, exit: {
      opacity: 0
    }, children: [
      /* @__PURE__ */ jsxs("div", { className: "rounded-xl bg-primary/10 border border-primary/20 p-4 text-center mb-3", children: [
        /* @__PURE__ */ jsx("p", { className: "text-3xl font-bold text-primary", children: macros.calories }),
        /* @__PURE__ */ jsx("p", { className: "text-xs text-muted-foreground", children: "kcal / day" })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-3 gap-2", children: [
        /* @__PURE__ */ jsx(MacroCard, { label: "Protein", value: `${macros.protein}g`, color: "bg-blue-500" }),
        /* @__PURE__ */ jsx(MacroCard, { label: "Carbs", value: `${macros.carbs}g`, color: "bg-amber-500" }),
        /* @__PURE__ */ jsx(MacroCard, { label: "Fat", value: `${macros.fat}g`, color: "bg-rose-500" })
      ] })
    ] }, "view") : /* @__PURE__ */ jsxs(motion.div, { initial: {
      opacity: 0
    }, animate: {
      opacity: 1
    }, exit: {
      opacity: 0
    }, className: "space-y-3", children: [
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("label", { className: "text-xs text-muted-foreground mb-1 block", children: "Calories (kcal)" }),
        /* @__PURE__ */ jsx("input", { type: "number", value: editCal, onChange: (e) => setEditCal(e.target.value), className: "w-full px-4 py-3 rounded-xl bg-muted text-foreground border-none outline-none focus:ring-2 focus:ring-primary/30 text-center text-xl font-bold", min: "500", max: "10000" })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-3 gap-2", children: [
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("label", { className: "text-xs text-muted-foreground mb-1 block text-center", children: "Protein (g)" }),
          /* @__PURE__ */ jsx("input", { type: "number", value: editProtein, onChange: (e) => setEditProtein(e.target.value), className: "w-full px-2 py-2.5 rounded-xl bg-muted text-foreground border-none outline-none focus:ring-2 focus:ring-primary/30 text-center font-semibold", min: "0" })
        ] }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("label", { className: "text-xs text-muted-foreground mb-1 block text-center", children: "Carbs (g)" }),
          /* @__PURE__ */ jsx("input", { type: "number", value: editCarbs, onChange: (e) => setEditCarbs(e.target.value), className: "w-full px-2 py-2.5 rounded-xl bg-muted text-foreground border-none outline-none focus:ring-2 focus:ring-primary/30 text-center font-semibold", min: "0" })
        ] }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("label", { className: "text-xs text-muted-foreground mb-1 block text-center", children: "Fat (g)" }),
          /* @__PURE__ */ jsx("input", { type: "number", value: editFat, onChange: (e) => setEditFat(e.target.value), className: "w-full px-2 py-2.5 rounded-xl bg-muted text-foreground border-none outline-none focus:ring-2 focus:ring-primary/30 text-center font-semibold", min: "0" })
        ] })
      ] }),
      /* @__PURE__ */ jsx("button", { onClick: handleSave, disabled: saving, className: "w-full flex items-center justify-center gap-2 py-3 rounded-2xl bg-primary text-primary-foreground font-semibold shadow-lg shadow-primary/25 disabled:opacity-40", children: saving ? "Saving…" : "Save Goals" })
    ] }, "edit") })
  ] });
}
export {
  ProfilePage as component,
  isValidPhone
};
