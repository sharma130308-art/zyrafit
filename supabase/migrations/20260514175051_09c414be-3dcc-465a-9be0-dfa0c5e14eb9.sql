CREATE TABLE public.workouts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  notes TEXT,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.workouts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own workouts" ON public.workouts
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own workouts" ON public.workouts
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own workouts" ON public.workouts
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own workouts" ON public.workouts
  FOR DELETE USING (auth.uid() = user_id);

CREATE TRIGGER update_workouts_updated_at
  BEFORE UPDATE ON public.workouts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_workouts_user_date ON public.workouts(user_id, date DESC);