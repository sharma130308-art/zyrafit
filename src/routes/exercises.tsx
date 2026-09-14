import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Dumbbell, Loader2, PlayCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useRequireAuth } from "@/hooks/use-require-auth";
import { BottomNav } from "@/components/BottomNav";
import { DashboardSkeleton } from "@/components/DashboardSkeleton";
import { hapticLight } from "@/lib/haptics";

export const Route = createFileRoute("/exercises")({
  component: ExercisesPage,
  head: () => ({
    meta: [
      { title: "ZyraFit — Exercises" },
      { name: "description", content: "Browse exercise demos by muscle group: shoulders, arms, back, and core." },
    ],
  }),
});

const MUSCLE_GROUPS = [
  { id: "shoulders", label: "Shoulders" },
  { id: "arms", label: "Arms" },
  { id: "back", label: "Back" },
  { id: "core", label: "Core" },
] as const;

type MuscleGroup = (typeof MUSCLE_GROUPS)[number]["id"];

interface Exercise {
  id: string;
  muscle_group: string;
  name: string;
  video_path: string;
  sort_order: number;
}

function ExercisesPage() {
  const { ready } = useRequireAuth();
  const navigate = useNavigate();
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeGroup, setActiveGroup] = useState<MuscleGroup | null>(null);
  const [activeExercise, setActiveExercise] = useState<Exercise | null>(null);

  useEffect(() => {
    if (!ready) return;
    let cancelled = false;
    (async () => {
      const { data, error } = await supabase
        .from("exercises")
        .select("id, muscle_group, name, video_path, sort_order")
        .order("sort_order", { ascending: true });
      if (cancelled) return;
      if (!error && data) setExercises(data as Exercise[]);
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [ready]);

  const countByGroup = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const ex of exercises) counts[ex.muscle_group] = (counts[ex.muscle_group] ?? 0) + 1;
    return counts;
  }, [exercises]);

  const groupExercises = useMemo(
    () => exercises.filter((ex) => ex.muscle_group === activeGroup),
    [exercises, activeGroup],
  );

  function videoUrl(path: string): string {
    return supabase.storage.from("exercises").getPublicUrl(path).data.publicUrl;
  }

  if (!ready) {
    return <DashboardSkeleton />;
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="mx-auto max-w-lg px-4 pt-8 pb-safe">
        <AnimatePresence mode="wait">
          {!activeGroup ? (
            <motion.div key="groups" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <div className="mb-6">
                <h1 className="text-2xl font-bold tracking-tight">Exercises</h1>
                <p className="text-sm text-muted-foreground mt-1">Pick a muscle group to see form demos.</p>
              </div>

              {loading ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  {MUSCLE_GROUPS.map((group) => (
                    <motion.button
                      key={group.id}
                      whileTap={{ scale: 0.96 }}
                      onClick={() => { hapticLight(); setActiveGroup(group.id); }}
                      className="flex flex-col items-start gap-3 rounded-2xl bg-card border border-border/50 p-4 text-left"
                    >
                      <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                        <Dumbbell className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium">{group.label}</p>
                        <p className="text-xs text-muted-foreground">
                          {countByGroup[group.id] ?? 0} exercise{(countByGroup[group.id] ?? 0) === 1 ? "" : "s"}
                        </p>
                      </div>
                    </motion.button>
                  ))}
                </div>
              )}
            </motion.div>
          ) : (
            <motion.div key="list" initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 12 }}>
              <button
                onClick={() => { hapticLight(); setActiveGroup(null); }}
                className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6"
              >
                <ArrowLeft className="w-4 h-4" />
                Muscle groups
              </button>

              <h2 className="text-xl font-bold tracking-tight mb-4">
                {MUSCLE_GROUPS.find((g) => g.id === activeGroup)?.label}
              </h2>

              {groupExercises.length === 0 ? (
                <p className="text-sm text-muted-foreground py-8 text-center">
                  No exercises added for this group yet.
                </p>
              ) : (
                <div className="space-y-2">
                  {groupExercises.map((ex) => (
                    <motion.button
                      key={ex.id}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => { hapticLight(); setActiveExercise(ex); }}
                      className="w-full flex items-center gap-3 rounded-xl bg-card border border-border/50 p-3.5 text-left"
                    >
                      <PlayCircle className="w-5 h-5 text-primary shrink-0" />
                      <span className="font-medium text-sm">{ex.name}</span>
                    </motion.button>
                  ))}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <AnimatePresence>
        {activeExercise && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/90 flex flex-col items-center justify-center p-4"
            onClick={() => setActiveExercise(null)}
          >
            <video
              key={activeExercise.id}
              src={videoUrl(activeExercise.video_path)}
              controls
              autoPlay
              playsInline
              className="w-full max-w-md rounded-xl"
              onClick={(e) => e.stopPropagation()}
            />
            <p className="text-white font-medium mt-4">{activeExercise.name}</p>
          </motion.div>
        )}
      </AnimatePresence>

      <BottomNav onAddClick={() => navigate({ to: "/app" })} />
    </div>
  );
}
