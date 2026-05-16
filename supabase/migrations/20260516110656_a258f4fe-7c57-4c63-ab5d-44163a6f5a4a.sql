ALTER TABLE public.workouts
  ADD COLUMN IF NOT EXISTS duration_min integer,
  ADD COLUMN IF NOT EXISTS calories_burned integer;