-- Add negotiation script columns to loads table
ALTER TABLE public.loads 
ADD COLUMN negotiation_channel text,
ADD COLUMN negotiation_tone text,
ADD COLUMN negotiation_scripts jsonb;