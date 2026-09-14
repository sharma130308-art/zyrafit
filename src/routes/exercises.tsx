import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bookmark, Dumbbell, HelpCircle, Loader2, PlayCircle, Search } from "lucide-react";
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

const KNOWN_GROUP_ORDER = [
  "chest", "back", "shoulders", "biceps", "triceps", "forearms",
  "trapezius", "abs", "hips", "calves", "cardio",
];

function titleCase(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

type Filter = "all" | string;

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
  const [filter, setFilter] = useState<Filter>("all");
  const [query, setQuery] = useState("");
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
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

  // Category chips come from whatever's actually in the data, ordered to
  // match the known set first (so it doesn't jump around as rows load),
  // with any unexpected new group appended at the end.
  const groups = useMemo(() => {
    const present = new Set(exercises.map((ex) => ex.muscle_group));
    const known = KNOWN_GROUP_ORDER.filter((g) => present.has(g));
    const extra = [...present].filter((g) => !KNOWN_GROUP_ORDER.includes(g)).sort();
    return [...known, ...extra];
  }, [exercises]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return exercises.filter((ex) => {
      const matchesGroup = filter === "all" || ex.muscle_group === filter;
      const matchesQuery = !q || ex.name.toLowerCase().includes(q);
      return matchesGroup && matchesQuery;
    });
  }, [exercises, filter, query]);

  function videoUrl(path: string): string {
    return supabase.storage.from("exercises").getPublicUrl(path).data.publicUrl;
  }

  function toggleFavorite(id: string) {
    hapticLight();
    setFavorites((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  if (!ready) {
    return <DashboardSkeleton />;
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="mx-auto max-w-2xl px-4 pt-8 pb-safe">
        <h1 className="text-2xl font-bold tracking-tight mb-4">Exercises</h1>

        <div className="relative mb-4">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search for exercises"
            className="w-full h-11 rounded-full bg-card border border-border/50 pl-10 pr-4 text-sm placeholder:text-muted-foreground outline-none focus:border-primary/50"
          />
        </div>

        <div className="flex gap-2 overflow-x-auto pb-2 mb-4 -mx-4 px-4 scrollbar-none">
          <FilterChip
            active={filter === "all"}
            label="All"
            onClick={() => { hapticLight(); setFilter("all"); }}
          />
          {groups.map((group) => (
            <FilterChip
              key={group}
              active={filter === group}
              label={titleCase(group)}
              onClick={() => { hapticLight(); setFilter(group); }}
            />
          ))}
        </div>

        {loading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : filtered.length === 0 ? (
          <p className="text-sm text-muted-foreground py-16 text-center">
            {exercises.length === 0 ? "No exercises added yet." : "No exercises match your search."}
          </p>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {filtered.map((ex) => (
              <motion.div
                key={ex.id}
                layout
                whileTap={{ scale: 0.97 }}
                className="rounded-2xl bg-card border border-border/50 overflow-hidden cursor-pointer"
                onClick={() => { hapticLight(); setActiveExercise(ex); }}
              >
                <div className="relative aspect-square bg-muted/60 flex items-center justify-center">
                  <button
                    onClick={(e) => { e.stopPropagation(); toggleFavorite(ex.id); }}
                    className="absolute top-2 left-2 w-7 h-7 rounded-full bg-background/80 backdrop-blur flex items-center justify-center"
                  >
                    <Bookmark
                      className="w-3.5 h-3.5"
                      fill={favorites.has(ex.id) ? "currentColor" : "none"}
                      style={{ color: favorites.has(ex.id) ? "var(--color-primary)" : "var(--color-muted-foreground)" }}
                    />
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); hapticLight(); setActiveExercise(ex); }}
                    className="absolute top-2 right-2 w-7 h-7 rounded-full bg-background/80 backdrop-blur flex items-center justify-center text-muted-foreground"
                  >
                    <HelpCircle className="w-3.5 h-3.5" />
                  </button>
                  <Dumbbell className="w-8 h-8 text-muted-foreground/40" />
                  <PlayCircle className="absolute w-9 h-9 text-primary drop-shadow" />
                </div>
                <div className="p-3">
                  <p className="font-semibold text-sm leading-tight">{ex.name}</p>
                  <p className="text-xs text-muted-foreground capitalize mt-0.5">{ex.muscle_group}</p>
                </div>
              </motion.div>
            ))}
          </div>
        )}
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

function FilterChip({ active, label, onClick }: { active: boolean; label: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`shrink-0 px-4 py-2 rounded-full text-sm font-medium border transition-colors whitespace-nowrap ${
        active
          ? "bg-primary text-primary-foreground border-primary"
          : "bg-card text-foreground border-border/50"
      }`}
    >
      {label}
    </button>
  );
}
