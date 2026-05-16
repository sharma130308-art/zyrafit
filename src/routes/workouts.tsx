import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useEffect, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Check, X, Trash2, Plus, ChevronLeft, ChevronRight, Calendar as CalendarIcon } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { BottomNav } from "@/components/BottomNav";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { hapticLight, hapticMedium, hapticSuccess } from "@/lib/haptics";
import { toast } from "sonner";
import {
  EXERCISES,
  BODY_PARTS,
  getExercise,
  type BodyPart,
  type Exercise,
} from "@/lib/exercises";

interface Workout {
  id: string;
  name: string;
  notes: string | null;
  date: string;
  exercise_key: string | null;
  created_at: string;
}

export const Route = createFileRoute("/workouts")({
  component: WorkoutsPage,
  head: () => ({
    meta: [
      { title: "Workouts — ZyraFit" },
      { name: "description", content: "Browse exercises and log your workouts." },
    ],
  }),
});

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

function WorkoutsPage() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [filter, setFilter] = useState<BodyPart>("all");
  const [search, setSearch] = useState("");
  const [pickedExercise, setPickedExercise] = useState<Exercise | null>(null);
  const [customOpen, setCustomOpen] = useState(false);
  const [notes, setNotes] = useState("");
  const [customName, setCustomName] = useState("");
  const [customNotes, setCustomNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string>(todayISO());
  const [dateOpen, setDateOpen] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) navigate({ to: "/" });
  }, [user, authLoading, navigate]);

  const refresh = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from("workouts")
      .select("*")
      .order("date", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(100);
    setWorkouts((data ?? []) as Workout[]);
  }, [user]);

  useEffect(() => {
    if (user) refresh();
  }, [user, refresh]);

  const today = todayISO();
  const activeDate = selectedDate;
  const isToday = activeDate === today;
  const activeLogged = useMemo(
    () => new Set(workouts.filter((w) => w.date === activeDate && w.exercise_key).map((w) => w.exercise_key!)),
    [workouts, activeDate],
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return EXERCISES.filter((e) => {
      if (filter !== "all" && e.bodyPart !== filter) return false;
      if (q && !e.name.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [filter, search]);

  const activeWorkouts = workouts.filter((w) => w.date === activeDate);

  function shiftDay(delta: number) {
    const d = new Date(activeDate + "T00:00:00");
    d.setDate(d.getDate() + delta);
    const iso = d.toISOString().slice(0, 10);
    if (iso > today) return;
    hapticLight();
    setSelectedDate(iso);
  }

  function formatDateLabel(iso: string) {
    if (iso === today) return "Today";
    const d = new Date(iso + "T00:00:00");
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    if (iso === yesterday.toISOString().slice(0, 10)) return "Yesterday";
    return d.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" });
  }

  async function logExercise(ex: Exercise, extraNotes: string) {
    if (!user) return;
    setSaving(true);
    const optimistic: Workout = {
      id: `tmp-${Date.now()}`,
      name: ex.name,
      notes: extraNotes.trim() || null,
      date: activeDate,
      exercise_key: ex.key,
      created_at: new Date().toISOString(),
    };
    setWorkouts((p) => [optimistic, ...p]);
    setPickedExercise(null);
    setNotes("");
    hapticSuccess();
    toast.success(`${ex.name} logged`);

    const { data, error } = await supabase
      .from("workouts")
      .insert({
        user_id: user.id,
        name: ex.name,
        notes: optimistic.notes,
        date: activeDate,
        exercise_key: ex.key,
      })
      .select()
      .single();
    setSaving(false);
    if (error) {
      setWorkouts((p) => p.filter((w) => w.id !== optimistic.id));
      toast.error("Couldn't save workout");
      return;
    }
    if (data) setWorkouts((p) => p.map((w) => (w.id === optimistic.id ? (data as Workout) : w)));
  }

  async function logCustom() {
    if (!user || !customName.trim()) return;
    setSaving(true);
    const optimistic: Workout = {
      id: `tmp-${Date.now()}`,
      name: customName.trim(),
      notes: customNotes.trim() || null,
      date: activeDate,
      exercise_key: null,
      created_at: new Date().toISOString(),
    };
    setWorkouts((p) => [optimistic, ...p]);
    setCustomOpen(false);
    setCustomName("");
    setCustomNotes("");
    hapticSuccess();

    const { data, error } = await supabase
      .from("workouts")
      .insert({
        user_id: user.id,
        name: optimistic.name,
        notes: optimistic.notes,
        date: activeDate,
      })
      .select()
      .single();
    setSaving(false);
    if (error) {
      setWorkouts((p) => p.filter((w) => w.id !== optimistic.id));
      toast.error("Couldn't save workout");
      return;
    }
    if (data) setWorkouts((p) => p.map((w) => (w.id === optimistic.id ? (data as Workout) : w)));
  }

  async function handleDelete(id: string) {
    hapticLight();
    setWorkouts((p) => p.filter((w) => w.id !== id));
    await supabase.from("workouts").delete().eq("id", id);
  }

  return (
    <div className="min-h-screen bg-background pb-28">
      {/* Header */}
      <div className="px-6 pt-14 pb-4">
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
          <p className="text-sm text-muted-foreground">Training</p>
          <h1 className="text-3xl font-bold tracking-tight mt-1">Workouts</h1>
        </motion.div>
      </div>

      {/* Date picker bar */}
      <div className="px-6 mb-4">
        <div className="flex items-center gap-2 bg-muted/40 rounded-2xl p-1.5">
          <button
            onClick={() => shiftDay(-1)}
            className="w-10 h-10 rounded-xl flex items-center justify-center hover:bg-muted active:scale-95 transition"
            aria-label="Previous day"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <Popover open={dateOpen} onOpenChange={setDateOpen}>
            <PopoverTrigger asChild>
              <button
                onClick={() => hapticLight()}
                className="flex-1 h-10 rounded-xl flex items-center justify-center gap-2 font-semibold text-sm hover:bg-muted/60 transition"
              >
                <CalendarIcon className="w-4 h-4 text-muted-foreground" />
                {formatDateLabel(activeDate)}
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="center">
              <Calendar
                mode="single"
                selected={new Date(activeDate + "T00:00:00")}
                onSelect={(d) => {
                  if (!d) return;
                  const iso = d.toISOString().slice(0, 10);
                  if (iso > today) return;
                  hapticLight();
                  setSelectedDate(iso);
                  setDateOpen(false);
                }}
                disabled={(d) => d > new Date()}
                initialFocus
                className="p-3 pointer-events-auto"
              />
            </PopoverContent>
          </Popover>
          <button
            onClick={() => shiftDay(1)}
            disabled={isToday}
            className="w-10 h-10 rounded-xl flex items-center justify-center hover:bg-muted active:scale-95 transition disabled:opacity-30 disabled:active:scale-100"
            aria-label="Next day"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="px-6 mb-4">
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search exercises"
            className="h-12 pl-10 rounded-2xl bg-muted/40 border-0"
          />
        </div>
      </div>

      {/* Body part chips */}
      <div className="overflow-x-auto no-scrollbar -mx-6 px-6 mb-5">
        <div className="flex gap-2 pb-1 w-max">
          {BODY_PARTS.map((bp) => {
            const active = filter === bp.id;
            return (
              <button
                key={bp.id}
                onClick={() => { hapticLight(); setFilter(bp.id); }}
                className={`px-4 h-9 rounded-full text-sm font-semibold whitespace-nowrap transition-colors ${
                  active
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted/40 text-foreground/80"
                }`}
              >
                {bp.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Today logged */}
      {activeWorkouts.length > 0 && (
        <div className="px-6 mb-6">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
            Today · {activeWorkouts.length}
          </h2>
          <div className="space-y-2">
            <AnimatePresence initial={false}>
              {activeWorkouts.map((w) => {
                const ex = getExercise(w.exercise_key);
                return (
                  <motion.div
                    key={w.id}
                    layout
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="bg-card border border-border/40 rounded-2xl p-3 flex items-center gap-3"
                  >
                    <div className="w-12 h-12 rounded-xl bg-muted/40 overflow-hidden flex items-center justify-center shrink-0">
                      {ex ? (
                        <img src={ex.image} alt="" className="w-full h-full object-contain" loading="lazy" />
                      ) : (
                        <div className="w-2 h-2 rounded-full bg-primary" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold truncate text-sm">{w.name}</p>
                      {w.notes && (
                        <p className="text-xs text-muted-foreground truncate">{w.notes}</p>
                      )}
                    </div>
                    <button
                      onClick={() => handleDelete(w.id)}
                      className="text-muted-foreground/60 hover:text-destructive p-1.5"
                      aria-label="Remove"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        </div>
      )}

      {/* Exercise grid */}
      <div className="px-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Library · {filtered.length}
          </h2>
          <button
            onClick={() => { hapticMedium(); setCustomOpen(true); }}
            className="text-xs font-semibold text-primary flex items-center gap-1"
          >
            <Plus className="w-3.5 h-3.5" /> Custom
          </button>
        </div>
        {filtered.length === 0 ? (
          <p className="text-center text-sm text-muted-foreground py-12">No exercises match.</p>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {filtered.map((ex) => {
              const logged = activeLogged.has(ex.key);
              return (
                <motion.button
                  key={ex.key}
                  whileTap={{ scale: 0.96 }}
                  onClick={() => { hapticLight(); setPickedExercise(ex); setNotes(""); }}
                  className={`relative bg-card border rounded-2xl p-3 text-left transition-colors ${
                    logged ? "border-primary/60" : "border-border/40"
                  }`}
                >
                  <div className="aspect-square rounded-xl bg-muted/30 overflow-hidden mb-2 flex items-center justify-center">
                    <img
                      src={ex.image}
                      alt={ex.name}
                      className="w-full h-full object-contain"
                      loading="lazy"
                      width={512}
                      height={512}
                    />
                  </div>
                  <p className="font-semibold text-sm leading-tight">{ex.name}</p>
                  <p className="text-xs text-muted-foreground capitalize mt-0.5">{ex.bodyPart}</p>
                  {logged && (
                    <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-sm">
                      <Check className="w-3.5 h-3.5" strokeWidth={3} />
                    </div>
                  )}
                </motion.button>
              );
            })}
          </div>
        )}
      </div>

      {/* Picked exercise sheet */}
      <AnimatePresence>
        {pickedExercise && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
              onClick={() => setPickedExercise(null)}
            />
            <motion.div
              initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 30, stiffness: 300 }}
              className="fixed inset-x-0 bottom-0 z-50 bg-card rounded-t-3xl p-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] border-t border-border/30 max-w-[430px] mx-auto"
            >
              <div className="flex items-start gap-4 mb-5">
                <div className="w-20 h-20 rounded-2xl bg-muted/40 overflow-hidden shrink-0">
                  <img src={pickedExercise.image} alt="" className="w-full h-full object-contain" />
                </div>
                <div className="flex-1 min-w-0 pt-1">
                  <h2 className="text-xl font-bold leading-tight">{pickedExercise.name}</h2>
                  <p className="text-sm text-muted-foreground capitalize mt-0.5">
                    {pickedExercise.bodyPart}
                  </p>
                </div>
                <button
                  onClick={() => setPickedExercise(null)}
                  className="w-8 h-8 rounded-full bg-muted/50 flex items-center justify-center shrink-0"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 block">
                Notes (optional)
              </label>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Sets × reps, weight, how it felt…"
                rows={3}
                className="rounded-xl resize-none mb-4"
              />
              <Button
                onClick={() => logExercise(pickedExercise, notes)}
                disabled={saving}
                className="w-full h-12 rounded-xl font-semibold"
              >
                Log workout
              </Button>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Custom workout sheet */}
      <AnimatePresence>
        {customOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
              onClick={() => setCustomOpen(false)}
            />
            <motion.div
              initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 30, stiffness: 300 }}
              className="fixed inset-x-0 bottom-0 z-50 bg-card rounded-t-3xl p-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] border-t border-border/30 max-w-[430px] mx-auto"
            >
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-lg font-bold">Custom workout</h2>
                <button
                  onClick={() => setCustomOpen(false)}
                  className="w-8 h-8 rounded-full bg-muted/50 flex items-center justify-center"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="space-y-3">
                <div>
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 block">
                    Workout
                  </label>
                  <Input
                    value={customName}
                    onChange={(e) => setCustomName(e.target.value)}
                    placeholder="e.g. Yoga, HIIT, Climbing"
                    autoFocus
                    className="h-12 rounded-xl"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 block">
                    Notes (optional)
                  </label>
                  <Textarea
                    value={customNotes}
                    onChange={(e) => setCustomNotes(e.target.value)}
                    placeholder="Duration, intensity…"
                    rows={3}
                    className="rounded-xl resize-none"
                  />
                </div>
                <Button
                  onClick={logCustom}
                  disabled={!customName.trim() || saving}
                  className="w-full h-12 rounded-xl font-semibold mt-2"
                >
                  Log workout
                </Button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <BottomNav onAddClick={() => { hapticMedium(); setCustomOpen(true); }} />
    </div>
  );
}
