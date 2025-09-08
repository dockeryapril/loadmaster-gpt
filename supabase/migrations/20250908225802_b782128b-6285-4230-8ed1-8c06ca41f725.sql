-- Add missing equipment_type column to business_setup table
ALTER TABLE public.business_setup 
ADD COLUMN equipment_type text;