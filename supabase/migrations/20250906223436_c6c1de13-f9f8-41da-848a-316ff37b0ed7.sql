-- Add simplified business setup fields to user_settings table
ALTER TABLE public.user_settings 
ADD COLUMN revenue_split_percentage numeric DEFAULT 100.00,
ADD COLUMN weekly_fixed_costs numeric DEFAULT 0.00;

-- Add comment for clarity
COMMENT ON COLUMN public.user_settings.revenue_split_percentage IS 'Percentage of gross revenue the driver keeps (e.g., 75 for 75/25 lease)';
COMMENT ON COLUMN public.user_settings.weekly_fixed_costs IS 'Total weekly fixed costs (truck payment + insurance + escrow, etc)';