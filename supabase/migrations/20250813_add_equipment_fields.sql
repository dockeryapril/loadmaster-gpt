-- 20250813_add_equipment_fields.sql
-- Non-destructive migration to add equipment-aware fields and flatbed/hotshot surcharge prefs.

-- USER SETTINGS: store equipment + subtype and optional custom RPM thresholds
ALTER TABLE IF EXISTS public.user_settings
  ADD COLUMN IF NOT EXISTS equipment TEXT NOT NULL DEFAULT 'flatbed' CHECK (equipment IN ('flatbed','cargo_van','straight_truck','tractor')),
  ADD COLUMN IF NOT EXISTS equipment_subtype TEXT, -- e.g., 'class8_flatbed' or 'hotshot'
  ADD COLUMN IF NOT EXISTS rpm_thresholds_json JSONB;

-- NEGOTIATION SETTINGS: add standard flatbed surcharge fields
ALTER TABLE IF EXISTS public.negotiation_settings
  ADD COLUMN IF NOT EXISTS tarp_fee NUMERIC(8,2) DEFAULT 75,
  ADD COLUMN IF NOT EXISTS heavy_per_mile NUMERIC(6,3) DEFAULT 0.08,
  ADD COLUMN IF NOT EXISTS heavy_threshold_lbs INTEGER DEFAULT 48000,
  ADD COLUMN IF NOT EXISTS oversize_width_fee NUMERIC(8,2) DEFAULT 225,
  ADD COLUMN IF NOT EXISTS oversize_height_fee NUMERIC(8,2) DEFAULT 225,
  ADD COLUMN IF NOT EXISTS multistop_fee NUMERIC(8,2) DEFAULT 60,
  ADD COLUMN IF NOT EXISTS rush_fee NUMERIC(8,2) DEFAULT 150,
  ADD COLUMN IF NOT EXISTS access_fee NUMERIC(8,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS securement_fee NUMERIC(8,2) DEFAULT 75;

-- LOADS: persist equipment, accessorials, and calc JSON for auditability/history
ALTER TABLE IF EXISTS public.loads
  ADD COLUMN IF NOT EXISTS equipment TEXT,
  ADD COLUMN IF NOT EXISTS equipment_subtype TEXT,
  ADD COLUMN IF NOT EXISTS accessorials JSONB,  -- { tarp: true, jobsite: false, itemType: 'steel coil', stops: 3, widthFt: 9.5, heightFt: 12 }
  ADD COLUMN IF NOT EXISTS calc JSONB;          -- computed rpm/color/surcharges/negotiation
