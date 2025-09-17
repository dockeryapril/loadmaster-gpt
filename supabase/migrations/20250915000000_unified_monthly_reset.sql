-- Unify monthly usage tracking across plans
ALTER TABLE public.user_settings
ADD COLUMN IF NOT EXISTS current_month_start date DEFAULT ((date_trunc('month', CURRENT_DATE))::date);

-- Backfill current_month_start from existing data
UPDATE public.user_settings
SET current_month_start = (date_trunc('month', COALESCE(week_start_date, CURRENT_DATE))::date)
WHERE current_month_start IS NULL
   OR current_month_start <> (date_trunc('month', COALESCE(week_start_date, CURRENT_DATE))::date);

-- Remove legacy subscription-based reset tracking
ALTER TABLE public.user_settings
DROP COLUMN IF EXISTS subscription_start_date;

COMMENT ON COLUMN public.user_settings.current_month_start IS 'Tracks the first day of the month used for monthly usage resets.';

-- Simplify monthly reset function to rely on current_month_start for all plans
CREATE OR REPLACE FUNCTION public.reset_usage_if_needed(p_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  settings_record RECORD;
  new_month_start date;
BEGIN
  SELECT current_month_start
  INTO settings_record
  FROM user_settings
  WHERE user_id = p_user_id;

  IF NOT FOUND THEN
    RETURN;
  END IF;

  new_month_start := (date_trunc('month', CURRENT_DATE))::date;

  IF settings_record.current_month_start IS NULL OR settings_record.current_month_start < new_month_start THEN
    UPDATE user_settings
    SET monthly_usage_count = 0,
        current_month_start = new_month_start,
        updated_at = now()
    WHERE user_id = p_user_id;
  END IF;
END;
$$;
