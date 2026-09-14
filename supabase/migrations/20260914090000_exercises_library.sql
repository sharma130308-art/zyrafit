-- Exercise library: browsable demo videos grouped by muscle group.
-- This is shared reference content (not user data), so it's readable by
-- anyone signed in but only writable via the Supabase dashboard / service
-- role - there's no app-facing insert/update/delete.

CREATE TABLE public.exercises (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  muscle_group TEXT NOT NULL CHECK (muscle_group IN ('shoulders', 'arms', 'back', 'core')),
  name TEXT NOT NULL,
  video_path TEXT NOT NULL, -- path inside the "exercises" storage bucket, e.g. "shoulders/overhead-press.mp4"
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.exercises ENABLE ROW LEVEL SECURITY;

-- Read-only for any signed-in user - this is shared content, not per-user data.
CREATE POLICY "Anyone signed in can view exercises" ON public.exercises
  FOR SELECT
  TO authenticated
  USING (true);

CREATE INDEX idx_exercises_muscle_group ON public.exercises(muscle_group, sort_order);
