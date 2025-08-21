-- LoadMaster GPT Rate Limiting Setup
-- Run this SQL in your Supabase SQL editor if rate limiting is not working

-- Create rate_limits table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.rate_limits (
  device_id text NOT NULL,
  day date NOT NULL DEFAULT CURRENT_DATE,
  count integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  PRIMARY KEY (device_id, day)
);

-- Enable Row Level Security
ALTER TABLE public.rate_limits ENABLE ROW LEVEL SECURITY;

-- Create RLS policy (system-managed only)
DROP POLICY IF EXISTS "Rate limits managed by system only" ON public.rate_limits;
CREATE POLICY "Rate limits managed by system only" 
ON public.rate_limits 
FOR ALL 
USING (false) 
WITH CHECK (false);

-- Create or replace the increment_rate_limit function
CREATE OR REPLACE FUNCTION public.increment_rate_limit(p_device_id text, p_day date DEFAULT CURRENT_DATE)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  new_count integer;
BEGIN
  -- Insert or update the rate limit record
  INSERT INTO public.rate_limits (device_id, day, count, updated_at)
  VALUES (p_device_id, p_day, 1, now())
  ON CONFLICT (device_id, day)
  DO UPDATE SET 
    count = rate_limits.count + 1,
    updated_at = now()
  RETURNING count INTO new_count;
  
  RETURN new_count;
END;
$function$;

-- Create update trigger function if it doesn't exist
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$;

-- Add update trigger to rate_limits table
DROP TRIGGER IF EXISTS update_rate_limits_updated_at ON public.rate_limits;
CREATE TRIGGER update_rate_limits_updated_at
  BEFORE UPDATE ON public.rate_limits
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Verify setup
SELECT 'Rate limiting setup complete' as status;