-- Fix critical rate limiting security vulnerability
-- Remove overly permissive RLS policy and replace with secure access

-- Drop the existing overly permissive policy
DROP POLICY IF EXISTS "Rate limits are accessible by device" ON public.rate_limits;

-- Create a more secure policy that only allows the increment_rate_limit function to access
-- This prevents direct client access while allowing the edge function to work
CREATE POLICY "Rate limits managed by system only" 
ON public.rate_limits 
FOR ALL 
USING (false) 
WITH CHECK (false);

-- Since we need the increment_rate_limit function to work, we'll modify it to use SECURITY DEFINER
-- This allows the function to bypass RLS while keeping client access blocked
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