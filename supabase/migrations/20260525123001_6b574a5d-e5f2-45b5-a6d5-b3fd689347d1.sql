-- Remove client-facing INSERT policy; ai_usage is written only by edge functions via service role.
DROP POLICY IF EXISTS "Users can insert their own ai usage" ON public.ai_usage;

-- Widen feature CHECK to include all feature names emitted by edge functions.
ALTER TABLE public.ai_usage DROP CONSTRAINT IF EXISTS ai_usage_feature_check;
ALTER TABLE public.ai_usage
  ADD CONSTRAINT ai_usage_feature_check
  CHECK (feature IN ('photo_scan', 'photo_scan_fast', 'text_parse', 'body_scan'));
