-- Drop archived_loads table (redundant with loads table)
DROP TABLE IF EXISTS public.archived_loads CASCADE;

-- Add index to loads table for better query performance
CREATE INDEX IF NOT EXISTS idx_loads_user_created ON public.loads(user_id, created_at DESC);

-- Add data retention: Delete loads older than 90 days (optional - commented out)
-- DELETE FROM public.loads WHERE created_at < NOW() - INTERVAL '90 days';