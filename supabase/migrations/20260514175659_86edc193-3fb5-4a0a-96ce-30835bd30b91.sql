ALTER TABLE public.workouts ADD COLUMN exercise_key TEXT;
CREATE INDEX idx_workouts_exercise_key ON public.workouts(user_id, exercise_key);