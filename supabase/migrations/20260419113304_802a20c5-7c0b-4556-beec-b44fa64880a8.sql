
-- Add per-meal reminder times to user_settings
ALTER TABLE public.user_settings
  ADD COLUMN IF NOT EXISTS breakfast_time time NOT NULL DEFAULT '08:00',
  ADD COLUMN IF NOT EXISTS lunch_time     time NOT NULL DEFAULT '13:00',
  ADD COLUMN IF NOT EXISTS dinner_time    time NOT NULL DEFAULT '19:00',
  ADD COLUMN IF NOT EXISTS snack_time     time NOT NULL DEFAULT '16:00',
  ADD COLUMN IF NOT EXISTS snack_reminder_enabled boolean NOT NULL DEFAULT false;

-- Make sure pg_cron + pg_net are available
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Remove any previous job with same name
DO $$
BEGIN
  PERFORM cron.unschedule('zyrafit-meal-reminders-hourly');
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

-- Schedule the reminder dispatcher to run every hour at minute 0
SELECT cron.schedule(
  'zyrafit-meal-reminders-hourly',
  '0 * * * *',
  $$
  SELECT net.http_post(
    url := 'https://kmoxjqrkcdrwvqnlyalf.supabase.co/functions/v1/send-meal-reminders',
    headers := '{"Content-Type":"application/json","Authorization":"Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imttb3hqcXJrY2Ryd3Zxbmx5YWxmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU4NDIxODcsImV4cCI6MjA5MTQxODE4N30.i0WpkG3XEZ_A8VqHcejlB19WJx7ZJ7XfFluKg_ttr38"}'::jsonb,
    body := '{}'::jsonb
  );
  $$
);
