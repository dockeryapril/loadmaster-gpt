-- Track rolling monthly usage start timestamps
ALTER TABLE public.user_settings
RENAME COLUMN current_month_start TO current_period_start;

ALTER TABLE public.user_settings
ALTER COLUMN current_period_start TYPE timestamptz USING current_period_start::timestamptz;

ALTER TABLE public.user_settings
ALTER COLUMN current_period_start DROP DEFAULT;

COMMENT ON COLUMN public.user_settings.current_period_start IS 'Tracks the start timestamp of the current rolling monthly usage period.';

CREATE OR REPLACE FUNCTION public.reset_usage_if_needed(p_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  current_start timestamptz;
  updated_start timestamptz;
BEGIN
  SELECT current_period_start
  INTO current_start
  FROM user_settings
  WHERE user_id = p_user_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN;
  END IF;

  IF current_start IS NULL THEN
    UPDATE user_settings
    SET current_period_start = now(),
        updated_at = now()
    WHERE user_id = p_user_id;
    RETURN;
  END IF;

  updated_start := current_start;

  WHILE updated_start + interval '1 month' <= now() LOOP
    updated_start := updated_start + interval '1 month';
  END LOOP;

  IF updated_start <> current_start THEN
    UPDATE user_settings
    SET monthly_usage_count = 0,
        current_period_start = updated_start,
        updated_at = now()
    WHERE user_id = p_user_id;
  END IF;
END;
$$;
