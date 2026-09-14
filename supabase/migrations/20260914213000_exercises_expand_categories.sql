-- Expand exercises.muscle_group to the full set of categories in the real
-- content library (11 groups, not the original 4-group guess), and make
-- video_path unique so the upload script can safely re-run (upsert) without
-- creating duplicate rows.

ALTER TABLE public.exercises DROP CONSTRAINT exercises_muscle_group_check;

ALTER TABLE public.exercises ADD CONSTRAINT exercises_muscle_group_check
  CHECK (muscle_group IN (
    'chest', 'back', 'shoulders', 'biceps', 'triceps', 'forearms',
    'trapezius', 'abs', 'hips', 'calves', 'cardio'
  ));

CREATE UNIQUE INDEX idx_exercises_video_path ON public.exercises(video_path);
