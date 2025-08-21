-- 20250813_add_equipment_fields_down.sql
-- Safe rollback: remove equipment-aware fields and surcharge prefs.

ALTER TABLE IF EXISTS public.user_settings
  DROP COLUMN IF EXISTS equipment,
  DROP COLUMN IF EXISTS rpm_thresholds_json;

ALTER TABLE IF EXISTS public.negotiation_settings
  DROP COLUMN IF EXISTS tarp_fee,
  DROP COLUMN IF EXISTS heavy_per_mile,
  DROP COLUMN IF EXISTS heavy_threshold_lbs,
  DROP COLUMN IF EXISTS oversize_width_fee,
  DROP COLUMN IF EXISTS oversize_height_fee,
  DROP COLUMN IF EXISTS multistop_fee,
  DROP COLUMN IF EXISTS rush_fee,
  DROP COLUMN IF EXISTS access_fee,
  DROP COLUMN IF EXISTS securement_fee;

ALTER TABLE IF EXISTS public.loads
  DROP COLUMN IF EXISTS equipment,
  DROP COLUMN IF EXISTS accessorials,
  DROP COLUMN IF EXISTS calc;
