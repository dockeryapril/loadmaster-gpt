-- Create comprehensive business setup table
CREATE TABLE public.business_setup (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  
  -- Revenue and Pay Structure
  revenue_split_percentage NUMERIC(5,2), -- percentage kept by driver (e.g., 75.00 for 75%)
  pay_structure_type TEXT CHECK (pay_structure_type IN ('gross_revenue', 'linehaul_only', 'percentage_split', 'flat_rate')),
  carrier_company_name TEXT,
  
  -- Fuel Management
  fuel_responsibility TEXT CHECK (fuel_responsibility IN ('driver_pays', 'carrier_pays', 'split_cost', 'reimbursed')),
  fuel_reimbursement_rate NUMERIC(8,3), -- rate per gallon or percentage
  fuel_card_provided BOOLEAN DEFAULT false,
  
  -- Maintenance and Repairs
  maintenance_coverage TEXT CHECK (maintenance_coverage IN ('driver_full', 'carrier_full', 'split_cost', 'up_to_amount')),
  maintenance_deductible NUMERIC(8,2),
  maintenance_max_coverage NUMERIC(8,2),
  
  -- Insurance and Fixed Costs
  insurance_responsibility TEXT CHECK (insurance_responsibility IN ('driver_pays', 'carrier_pays', 'deducted_from_pay')),
  weekly_truck_payment NUMERIC(8,2),
  weekly_insurance_payment NUMERIC(8,2),
  weekly_escrow_payment NUMERIC(8,2),
  
  -- Trip-Related Compensation
  toll_responsibility TEXT CHECK (toll_responsibility IN ('driver_pays', 'carrier_pays', 'reimbursed')),
  deadhead_compensation_type TEXT CHECK (deadhead_compensation_type IN ('per_mile', 'percentage', 'flat_rate', 'none')),
  deadhead_compensation_rate NUMERIC(8,3),
  deadhead_minimum_miles INTEGER DEFAULT 0,
  
  -- FSC and Additional Pay
  fsc_handling TEXT CHECK (fsc_handling IN ('included_in_rpm', 'separate_payment', 'split_with_carrier')),
  fsc_split_percentage NUMERIC(5,2),
  
  -- Detention and Waiting
  detention_pay_rate NUMERIC(8,2), -- per hour
  detention_minimum_hours NUMERIC(4,2) DEFAULT 2.0,
  layover_pay_rate NUMERIC(8,2), -- per day
  
  -- Extra Services
  extra_stop_rate NUMERIC(8,2),
  loading_unloading_pay NUMERIC(8,2),
  tarping_pay NUMERIC(8,2),
  
  -- Deductions and Fees
  admin_fee_percentage NUMERIC(5,2),
  admin_fee_flat NUMERIC(8,2),
  factoring_fee_percentage NUMERIC(5,2),
  other_weekly_deductions NUMERIC(8,2),
  
  -- Bonus Structure
  safety_bonus_amount NUMERIC(8,2),
  performance_bonus_criteria TEXT,
  performance_bonus_amount NUMERIC(8,2),
  
  -- Special Arrangements
  special_arrangements TEXT,
  notes TEXT,
  
  -- Metadata
  setup_completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.business_setup ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own business setup" 
ON public.business_setup 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own business setup" 
ON public.business_setup 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own business setup" 
ON public.business_setup 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own business setup" 
ON public.business_setup 
FOR DELETE 
USING (auth.uid() = user_id);

-- Add business setup tracking to user_settings
ALTER TABLE public.user_settings 
ADD COLUMN business_setup_completed BOOLEAN DEFAULT false,
ADD COLUMN business_setup_completed_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN show_setup_reminders BOOLEAN DEFAULT true,
ADD COLUMN setup_completion_percentage INTEGER DEFAULT 0;

-- Create trigger for updated_at
CREATE TRIGGER update_business_setup_updated_at
BEFORE UPDATE ON public.business_setup
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for better performance
CREATE INDEX idx_business_setup_user_id ON public.business_setup(user_id);
CREATE INDEX idx_business_setup_completed ON public.business_setup(user_id, setup_completed_at) WHERE setup_completed_at IS NOT NULL;