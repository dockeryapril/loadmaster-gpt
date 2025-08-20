-- Create rate_limits table for tracking daily API usage
CREATE TABLE public.rate_limits (
  device_id text NOT NULL,
  day date NOT NULL DEFAULT CURRENT_DATE,
  count integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  PRIMARY KEY (device_id, day)
);

-- Enable Row Level Security
ALTER TABLE public.rate_limits ENABLE ROW LEVEL SECURITY;

-- Create policy for rate limits access (allow all for device-based tracking)
CREATE POLICY "Rate limits are accessible by device" 
ON public.rate_limits 
FOR ALL 
USING (true)
WITH CHECK (true);

-- Create function to increment rate limit and return new count
CREATE OR REPLACE FUNCTION public.increment_rate_limit(p_device_id text, p_day date DEFAULT CURRENT_DATE)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
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
$$;