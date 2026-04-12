
CREATE TABLE public.user_profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  age INTEGER,
  weight_kg NUMERIC,
  gender TEXT,
  workout_days_per_week INTEGER,
  goal TEXT,
  obstacles TEXT,
  apple_health_connected BOOLEAN NOT NULL DEFAULT false,
  onboarding_completed BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own profile"
ON public.user_profiles FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile"
ON public.user_profiles FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile"
ON public.user_profiles FOR UPDATE
USING (auth.uid() = user_id);

CREATE TRIGGER update_user_profiles_updated_at
BEFORE UPDATE ON public.user_profiles
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
