ALTER TABLE public.weight_logs
  ADD COLUMN bmi NUMERIC NULL,
  ADD COLUMN body_fat_percent NUMERIC NULL,
  ADD COLUMN body_fat_mass_kg NUMERIC NULL,
  ADD COLUMN height_m NUMERIC NULL;