
-- Add billing notification preferences to profiles
ALTER TABLE public.profiles 
  ADD COLUMN IF NOT EXISTS billing_notify_days_before integer NOT NULL DEFAULT 5,
  ADD COLUMN IF NOT EXISTS billing_notifications_enabled boolean NOT NULL DEFAULT true;

-- Add fine_amount and subscription dates to billing_history
ALTER TABLE public.billing_history
  ADD COLUMN IF NOT EXISTS fine_amount numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS subscription_start date,
  ADD COLUMN IF NOT EXISTS subscription_end date;

-- Add unique constraint for upsert if not exists
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'billing_history_user_month_year_key') THEN
    ALTER TABLE public.billing_history ADD CONSTRAINT billing_history_user_month_year_key UNIQUE (user_id, month, year);
  END IF;
END $$;
