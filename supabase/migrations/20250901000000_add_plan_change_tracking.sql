-- Track plan change timestamp and source
ALTER TABLE public.user_settings
ADD COLUMN plan_changed_at timestamptz,
ADD COLUMN plan_change_source text;
