-- Enhance negotiations table for granular outcome tracking
ALTER TABLE public.negotiations 
ADD COLUMN IF NOT EXISTS channel text,
ADD COLUMN IF NOT EXISTS tone text,
ADD COLUMN IF NOT EXISTS negotiation_scripts jsonb DEFAULT '{}',
ADD COLUMN IF NOT EXISTS rate_tier_accepted text, -- 'ask', 'settle', 'bottom', or 'other'
ADD COLUMN IF NOT EXISTS final_rpm numeric;

-- Add helpful comments
COMMENT ON COLUMN public.negotiations.channel IS 'Communication channel used: text, email, phone';
COMMENT ON COLUMN public.negotiations.tone IS 'Negotiation tone used: professional, driver, firm';
COMMENT ON COLUMN public.negotiations.negotiation_scripts IS 'JSON containing ask, settle, bottom scripts';
COMMENT ON COLUMN public.negotiations.rate_tier_accepted IS 'Which rate tier was accepted: ask, settle, bottom, other';
COMMENT ON COLUMN public.negotiations.final_rpm IS 'Final RPM achieved in negotiation';