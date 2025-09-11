-- First, update existing records to use correct values
UPDATE public.business_setup 
SET fsc_handling = 'driver_receives_fsc'
WHERE fsc_handling = 'included_in_rpm';

UPDATE public.business_setup 
SET fsc_handling = 'driver_receives_fsc'
WHERE fsc_handling = 'separate_payment';

UPDATE public.business_setup 
SET fsc_handling = 'carrier_keeps_fsc'
WHERE fsc_handling = 'split_with_carrier';

-- Now drop the old constraint
ALTER TABLE public.business_setup 
DROP CONSTRAINT IF EXISTS business_setup_fsc_handling_check;

-- Add the new constraint with correct values
ALTER TABLE public.business_setup 
ADD CONSTRAINT business_setup_fsc_handling_check 
CHECK (fsc_handling = ANY (ARRAY['driver_receives_fsc'::text, 'carrier_keeps_fsc'::text, 'fsc_in_margin'::text]));