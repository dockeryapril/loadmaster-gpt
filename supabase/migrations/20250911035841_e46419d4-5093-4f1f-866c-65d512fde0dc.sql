-- Fix fsc_handling constraint to match application values
ALTER TABLE public.business_setup 
DROP CONSTRAINT IF EXISTS business_setup_fsc_handling_check;

-- Add correct constraint with application values
ALTER TABLE public.business_setup 
ADD CONSTRAINT business_setup_fsc_handling_check 
CHECK (fsc_handling = ANY (ARRAY['driver_receives_fsc'::text, 'carrier_keeps_fsc'::text, 'fsc_in_margin'::text]));

-- Update any existing records with old values to new values
UPDATE public.business_setup 
SET fsc_handling = CASE 
  WHEN fsc_handling = 'included_in_rpm' THEN 'fsc_in_margin'
  WHEN fsc_handling = 'separate_payment' THEN 'driver_receives_fsc'
  WHEN fsc_handling = 'split_with_carrier' THEN 'carrier_keeps_fsc'
  ELSE fsc_handling
END
WHERE fsc_handling IN ('included_in_rpm', 'separate_payment', 'split_with_carrier');