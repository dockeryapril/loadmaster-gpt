-- Fix database constraints to match frontend options

-- Update deadhead_compensation_type constraint to include all frontend options
ALTER TABLE business_setup DROP CONSTRAINT IF EXISTS business_setup_deadhead_compensation_type_check;
ALTER TABLE business_setup ADD CONSTRAINT business_setup_deadhead_compensation_type_check 
CHECK (deadhead_compensation_type IN (
  'per_mile', 
  'percentage', 
  'flat_rate', 
  'varies_by_load', 
  'negotiated_per_load', 
  'tiered_by_distance', 
  'customer_dependent', 
  'minimum_plus_variable', 
  'none'
));

-- Update fsc_handling constraint to match frontend options
ALTER TABLE business_setup DROP CONSTRAINT IF EXISTS business_setup_fsc_handling_check;
ALTER TABLE business_setup ADD CONSTRAINT business_setup_fsc_handling_check 
CHECK (fsc_handling IN (
  'driver_receives_fsc',
  'carrier_keeps_fsc', 
  'fsc_in_margin'
));