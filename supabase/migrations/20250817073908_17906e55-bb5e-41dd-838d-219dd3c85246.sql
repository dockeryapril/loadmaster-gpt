-- Create archived_loads table to store archived loads instead of permanently deleting them
CREATE TABLE public.archived_loads (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  original_load_id uuid NOT NULL,
  user_id uuid NOT NULL,
  origin text NOT NULL,
  destination text NOT NULL,
  miles numeric NOT NULL,
  rate numeric NOT NULL,
  fsc numeric DEFAULT 0,
  tolls numeric DEFAULT 0,
  weight numeric,
  deadhead_miles numeric DEFAULT 0,
  fuel_cost numeric DEFAULT 0,
  rpm numeric NOT NULL,
  profit numeric NOT NULL,
  quality text NOT NULL,
  tags text[] DEFAULT '{}'::text[],
  notes text,
  original_created_at timestamp with time zone NOT NULL,
  archived_at timestamp with time zone NOT NULL DEFAULT now(),
  archived_reason text DEFAULT 'bulk_clear',
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.archived_loads ENABLE ROW LEVEL SECURITY;

-- Create policies for user access to archived loads
CREATE POLICY "Users can view their own archived loads" 
ON public.archived_loads 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own archived loads" 
ON public.archived_loads 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Users typically shouldn't update or delete archived loads for audit purposes
-- But we can allow updates if needed for corrections
CREATE POLICY "Users can update their own archived loads" 
ON public.archived_loads 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Add indexes for better performance
CREATE INDEX idx_archived_loads_user_id ON public.archived_loads(user_id);
CREATE INDEX idx_archived_loads_archived_at ON public.archived_loads(archived_at);
CREATE INDEX idx_archived_loads_original_load_id ON public.archived_loads(original_load_id);