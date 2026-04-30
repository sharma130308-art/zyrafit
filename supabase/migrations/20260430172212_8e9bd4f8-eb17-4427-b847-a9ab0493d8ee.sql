CREATE TABLE public.onboarding_reminders_sent (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  reminder_kind text NOT NULL,
  sent_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, reminder_kind)
);

CREATE INDEX idx_onboarding_reminders_user ON public.onboarding_reminders_sent(user_id);

ALTER TABLE public.onboarding_reminders_sent ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own onboarding reminders"
  ON public.onboarding_reminders_sent
  FOR SELECT
  USING (auth.uid() = user_id);
