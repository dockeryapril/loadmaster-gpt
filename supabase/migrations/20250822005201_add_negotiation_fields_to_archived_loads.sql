-- Add negotiation fields to archived_loads
ALTER TABLE public.archived_loads
ADD COLUMN negotiation_channel text,
ADD COLUMN negotiation_tone text,
ADD COLUMN negotiation_scripts jsonb;
