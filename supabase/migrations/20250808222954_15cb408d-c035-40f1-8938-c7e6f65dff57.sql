-- Add fuel cost tracking preference to user_settings table
ALTER TABLE public.user_settings 
ADD COLUMN enable_fuel_cost_tracking BOOLEAN NOT NULL DEFAULT false;