import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Dumbbell, Plus, Trash2, X } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { BottomNav } from "@/components/BottomNav";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { hapticLight, hapticMedium } from "@/lib/haptics";
import { toast } from "sonner";

interface Workout {
  id: string;
  name: string;
  notes: string | null;
  date: string;
  created_at: string;
}

export const Route = createFileRoute("/workouts")({
  component: WorkoutsPage,
  head: () => ({
    meta: [
      { title: "Workouts — ZyraFit" },
      { name: "description", content: "Log and track your workouts." },
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
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) navigate({ to: "/" });
  }, [user, authLoading, navigate]);

  const refresh = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from("workouts")
      .select("*")
      .order("date", { ascending: false })
      .order("created_at", { ascending: false });
    setWorkouts((data ?? []) as Workout[]);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    if (user) refresh();
  }, [user, refresh]);

  const handleAdd = async () => {
    if (!user || !name.trim()) return;
    setSaving(true);
    const optimistic: Workout = {
      id: `tmp-${Date.now()}`,
      name: name.trim(),
      notes: notes.trim() || null,
      date: todayISO(),
      created_at: new Date().toISOString(),
    };
    setWorkouts((p) => [optimistic, ...p]);
    setOpen(false);
    setName("");
    setNotes("");
    hapticMedium();

    const { data, error } = await supabase
      .from("workouts")
      .insert({
        user_id: user.id,
        name: optimistic.name,
        notes: optimistic.notes,
        date: optimistic.date,
      })
      .select()
      .single();

    setSaving(false);
    if (error) {
      setWorkouts((p) => p.filter((w) => w.id !== optimistic.id));
      toast.error("Couldn't save workout");
      return;
    }
    if (data) {
      setWorkouts((p) => p.map((w) => (w.id === optimistic.id ? (data as Workout) : w)));
    }
  };

  const handleDelete = async (id: string) => {
    hapticLight();
    setWorkouts((p) => p.filter((w) => w.id !== id));
    await supabase.from("workouts").delete().eq("id", id);
  };

  // Group by date
  const grouped = workouts.reduce<Record<string, Workout[]>>((acc, w) => {
    (acc[w.date] ||= []).push(w);
    return acc;
  }, {});
  const dateKeys = Object.keys(grouped);

  const formatDate = (iso: string) => {
    const d = new Date(iso + "T00:00:00");
    const today = todayISO();
    const yest = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
    if (iso === today) return "Today";
    if (iso === yest) return "Yesterday";
    return d.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" });
  };

  return (
    <div className="min-h-screen bg-background pb-28">
      <div className="px-6 pt-14 pb-6">
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
          <p className="text-sm text-muted-foreground">Training</p>
          <h1 className="text-3xl font-bold tracking-tight mt-1">Workouts</h1>
        </motion.div>
      </div>

      <div className="px-6">
        <Button
          onClick={() => { hapticMedium(); setOpen(true); }}
          className="w-full h-12 rounded-2xl gap-2 font-semibold shadow-lg shadow-primary/20"
        >
          <Plus className="w-5 h-5" />
          Log a workout
        </Button>
      </div>

      <div className="px-6 mt-8 space-y-6">
        {loading ? (
          <div className="text-center text-muted-foreground py-12 text-sm">Loading…</div>
        ) : workouts.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center text-center py-16 px-4"
          >
            <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
              <Dumbbell className="w-8 h-8 text-primary" />
            </div>
            <h3 className="font-semibold mb-1">No workouts yet</h3>
            <p className="text-sm text-muted-foreground max-w-xs">
              Tap "Log a workout" to record your first session.
            </p>
          </motion.div>
        ) : (
          dateKeys.map((date) => (
            <div key={date}>
              <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2 px-1">
                {formatDate(date)}
              </h2>
              <div className="space-y-2">
                <AnimatePresence initial={false}>
                  {grouped[date].map((w) => (
                    <motion.div
                      key={w.id}
                      layout
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      className="bg-card border border-border/40 rounded-2xl p-4 flex items-start gap-3"
                    >
                      <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                        <Dumbbell className="w-5 h-5 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold truncate">{w.name}</p>
                        {w.notes && (
                          <p className="text-sm text-muted-foreground mt-0.5 whitespace-pre-wrap break-words">
                            {w.notes}
                          </p>
                        )}
                      </div>
                      <button
                        onClick={() => handleDelete(w.id)}
                        className="text-muted-foreground/60 hover:text-destructive p-1.5 -m-1.5"
                        aria-label="Delete workout"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </div>
          ))
        )}
      </div>

      <AnimatePresence>
        {open && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
              onClick={() => setOpen(false)}
            />
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 30, stiffness: 300 }}
              className="fixed inset-x-0 bottom-0 z-50 bg-card rounded-t-3xl p-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] border-t border-border/30 max-w-[430px] mx-auto"
            >
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-lg font-bold">Log workout</h2>
                <button
                  onClick={() => setOpen(false)}
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
                    placeholder="e.g. Push day, 5km run, Yoga…"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    autoFocus
                    className="h-12 rounded-xl"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 block">
                    Notes (optional)
                  </label>
                  <Textarea
                    placeholder="Sets, reps, distance, how it felt…"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={4}
                    className="rounded-xl resize-none"
                  />
                </div>
                <Button
                  onClick={handleAdd}
                  disabled={!name.trim() || saving}
                  className="w-full h-12 rounded-xl font-semibold mt-2"
                >
                  Save workout
                </Button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <BottomNav onAddClick={() => { hapticMedium(); setOpen(true); }} />
    </div>
  );
}
