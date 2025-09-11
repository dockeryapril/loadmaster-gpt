-- Drop the existing constraint entirely first
ALTER TABLE public.business_setup 
DROP CONSTRAINT business_setup_fsc_handling_check;

-- Update any records with old values
UPDATE public.business_setup 
SET fsc_handling = 'driver_receives_fsc'
WHERE fsc_handling IN ('included_in_rpm', 'separate_payment');

UPDATE public.business_setup 
SET fsc_handling = 'carrier_keeps_fsc'  
WHERE fsc_handling = 'split_with_carrier';

-- Now add the new constraint
ALTER TABLE public.business_setup 
ADD CONSTRAINT business_setup_fsc_handling_check 
CHECK (fsc_handling IS NULL OR fsc_handling = ANY (ARRAY['driver_receives_fsc'::text, 'carrier_keeps_fsc'::text, 'fsc_in_margin'::text]));