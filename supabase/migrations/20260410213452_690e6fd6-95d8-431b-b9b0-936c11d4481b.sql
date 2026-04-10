-- Add source enum
CREATE TYPE public.food_source AS ENUM ('manual', 'barcode', 'ai');

-- Add new columns to food_entries
ALTER TABLE public.food_entries
  ADD COLUMN barcode TEXT,
  ADD COLUMN source food_source NOT NULL DEFAULT 'manual';

-- Index for barcode lookups
CREATE INDEX idx_food_entries_barcode ON public.food_entries (barcode) WHERE barcode IS NOT NULL;