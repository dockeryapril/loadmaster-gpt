-- Update user_settings table to support unified usage tracking
-- Add monthly usage tracking for Pro users and subscription date tracking

-- Add columns for monthly Pro usage tracking
ALTER TABLE public.user_settings 
ADD COLUMN IF NOT EXISTS monthly_usage_count integer NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS subscription_start_date date;

-- Rename weekly_upload_count to usage_count for clarity (this tracks weekly usage for Free users)
ALTER TABLE public.user_settings 
RENAME COLUMN weekly_upload_count TO usage_count;

-- Update the week_start_date default to be more explicit about Sunday start
ALTER TABLE public.user_settings 
ALTER COLUMN week_start_date SET DEFAULT ((date_trunc('week'::text, (CURRENT_DATE)::timestamp with time zone))::date);

-- Add a comment to clarify the usage tracking
COMMENT ON COLUMN public.user_settings.usage_count IS 'Legacy weekly usage count retained for backward compatibility.';
COMMENT ON COLUMN public.user_settings.monthly_usage_count IS 'Monthly usage count for both Free and Pro plans.';
COMMENT ON COLUMN public.user_settings.subscription_start_date IS 'Pro subscription start date for calculating monthly resets';

-- Create function to reset usage counts based on plan type
CREATE OR REPLACE FUNCTION public.reset_usage_if_needed(p_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  user_plan text;
  current_month_start date;
  pro_reset_start date;
  settings_record RECORD;
BEGIN
  -- Get user settings
  SELECT plan, week_start_date, monthly_usage_count, subscription_start_date
  INTO settings_record
  FROM user_settings
  WHERE user_id = p_user_id;
  
  IF NOT FOUND THEN
    RETURN;
  END IF;
  
  user_plan := settings_record.plan;
  
  IF user_plan = 'free' THEN
    -- Free users reset on the first day of each month
    current_month_start := (date_trunc('month', CURRENT_DATE))::date;

    IF settings_record.week_start_date IS NULL OR settings_record.week_start_date < current_month_start THEN
      UPDATE user_settings
      SET monthly_usage_count = 0,
          week_start_date = current_month_start,
          updated_at = now()
      WHERE user_id = p_user_id;
    END IF;

  ELSIF user_plan = 'pro' AND settings_record.subscription_start_date IS NOT NULL THEN
    -- Reset monthly usage for pro users based on subscription date
    pro_reset_start := (settings_record.subscription_start_date +
      (EXTRACT(YEAR FROM age(CURRENT_DATE, settings_record.subscription_start_date)) * 12 +
       EXTRACT(MONTH FROM age(CURRENT_DATE, settings_record.subscription_start_date)))::int * INTERVAL '1 month')::date;

    -- If we've passed the monthly reset date, reset the counter
    IF CURRENT_DATE >= pro_reset_start + INTERVAL '1 month' THEN
      UPDATE user_settings
      SET monthly_usage_count = 0,
          updated_at = now()
      WHERE user_id = p_user_id;
    END IF;
  END IF;
END;
$$;
