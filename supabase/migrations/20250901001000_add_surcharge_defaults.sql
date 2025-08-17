-- 20250901001000_add_surcharge_defaults.sql
-- Non-destructive migration to add default surcharge settings.
ALTER TABLE IF EXISTS public.business_setup
  ADD COLUMN IF NOT EXISTS detention_per_hour NUMERIC(8,2),
  ADD COLUMN IF NOT EXISTS cargo_van_extras JSONB,
  ADD COLUMN IF NOT EXISTS straight_truck_extras JSONB;
