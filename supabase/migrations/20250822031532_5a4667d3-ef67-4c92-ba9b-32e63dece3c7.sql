-- Add missing negotiation columns to archived_loads table
ALTER TABLE public.archived_loads 
ADD COLUMN negotiation_channel text,
ADD COLUMN negotiation_tone text,
ADD COLUMN negotiation_scripts jsonb;