ALTER TABLE public.user_settings
ADD COLUMN protein_goal integer NOT NULL DEFAULT 0,
ADD COLUMN carbs_goal integer NOT NULL DEFAULT 0,
ADD COLUMN fat_goal integer NOT NULL DEFAULT 0;