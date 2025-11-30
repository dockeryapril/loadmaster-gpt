-- Add counter offer outcome tracking to loads table
-- This allows users to record if a counter was accepted, declined, or still pending

-- Add outcome column to track decision type (book, counter, pass)
ALTER TABLE public.loads
ADD COLUMN IF NOT EXISTS outcome text;

-- Add counter_result column to track counter offer results
ALTER TABLE public.loads
ADD COLUMN IF NOT EXISTS counter_result text;

-- Add final_rate column to store negotiated rate when different from original
ALTER TABLE public.loads
ADD COLUMN IF NOT EXISTS final_rate numeric;

-- Add check constraint for valid outcome values
ALTER TABLE public.loads
ADD CONSTRAINT loads_outcome_check 
CHECK (outcome IS NULL OR outcome IN ('book', 'counter', 'pass'));

-- Add check constraint for valid counter_result values
ALTER TABLE public.loads
ADD CONSTRAINT loads_counter_result_check 
CHECK (counter_result IS NULL OR counter_result IN ('accepted', 'declined', 'pending'));

-- Create index for faster filtering by outcome
CREATE INDEX IF NOT EXISTS idx_loads_outcome ON public.loads(outcome);

-- Create index for faster filtering by counter_result
CREATE INDEX IF NOT EXISTS idx_loads_counter_result ON public.loads(counter_result);

COMMENT ON COLUMN public.loads.outcome IS 'Decision type: book, counter, or pass';
COMMENT ON COLUMN public.loads.counter_result IS 'Result of counter offer: accepted, declined, or pending';
COMMENT ON COLUMN public.loads.final_rate IS 'Final negotiated rate if different from original rate';