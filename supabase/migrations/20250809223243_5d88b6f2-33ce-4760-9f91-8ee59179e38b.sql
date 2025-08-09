-- Create negotiation_settings table for user-specific premium configurations
CREATE TABLE public.negotiation_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  
  -- Premium settings with flexible method (fixed $/mile or percentage)
  rush_enabled BOOLEAN NOT NULL DEFAULT true,
  rush_method TEXT NOT NULL DEFAULT 'fixed' CHECK (rush_method IN ('fixed', 'percentage')),
  rush_value NUMERIC NOT NULL DEFAULT 0.15,
  
  weekend_enabled BOOLEAN NOT NULL DEFAULT true,
  weekend_method TEXT NOT NULL DEFAULT 'fixed' CHECK (weekend_method IN ('fixed', 'percentage')),
  weekend_value NUMERIC NOT NULL DEFAULT 0.10,
  
  heavy_enabled BOOLEAN NOT NULL DEFAULT true,
  heavy_method TEXT NOT NULL DEFAULT 'fixed' CHECK (heavy_method IN ('fixed', 'percentage')),
  heavy_value NUMERIC NOT NULL DEFAULT -0.05,
  
  multi_stop_enabled BOOLEAN NOT NULL DEFAULT true,
  multi_stop_method TEXT NOT NULL DEFAULT 'fixed' CHECK (multi_stop_method IN ('fixed', 'percentage')),
  multi_stop_value NUMERIC NOT NULL DEFAULT 25.00,
  
  premium_freight_enabled BOOLEAN NOT NULL DEFAULT true,
  premium_freight_method TEXT NOT NULL DEFAULT 'percentage' CHECK (premium_freight_method IN ('fixed', 'percentage')),
  premium_freight_value NUMERIC NOT NULL DEFAULT 10.0,
  
  -- Negotiation strategy settings
  anchor_offset NUMERIC NOT NULL DEFAULT 0.30, -- How much above target for opening bid
  floor_offset NUMERIC NOT NULL DEFAULT 0.15, -- How much below target for absolute minimum
  rush_threshold_hours INTEGER NOT NULL DEFAULT 24, -- Hours to consider "rush"
  heavy_weight_threshold INTEGER NOT NULL DEFAULT 45000, -- Weight to apply heavy penalty
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on negotiation_settings
ALTER TABLE public.negotiation_settings ENABLE ROW LEVEL SECURITY;

-- Create policies for negotiation_settings
CREATE POLICY "Users can view their own negotiation settings" 
ON public.negotiation_settings 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own negotiation settings" 
ON public.negotiation_settings 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own negotiation settings" 
ON public.negotiation_settings 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Create negotiations table to track negotiation attempts and outcomes
CREATE TABLE public.negotiations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  load_id UUID REFERENCES public.loads(id) ON DELETE CASCADE,
  
  -- Negotiation details
  original_offer NUMERIC NOT NULL,
  target_rate NUMERIC NOT NULL,
  anchor_rate NUMERIC NOT NULL,
  floor_rate NUMERIC NOT NULL,
  final_rate NUMERIC, -- Null if not closed
  
  -- Strategy and outcome tracking
  strategy_used TEXT NOT NULL CHECK (strategy_used IN ('standard', 'rush', 'weekend', 'heavy', 'premium', 'multi_stop', 'custom')),
  outcome TEXT CHECK (outcome IN ('accepted', 'counter_offered', 'rejected', 'pending')),
  iterations INTEGER NOT NULL DEFAULT 1,
  response_time_minutes INTEGER, -- Time from initial offer to final outcome
  
  -- Message template and notes
  message_sent TEXT,
  notes TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on negotiations
ALTER TABLE public.negotiations ENABLE ROW LEVEL SECURITY;

-- Create policies for negotiations
CREATE POLICY "Users can view their own negotiations" 
ON public.negotiations 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own negotiations" 
ON public.negotiations 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own negotiations" 
ON public.negotiations 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own negotiations" 
ON public.negotiations 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create lane_history table for tracking historical RPM by route
CREATE TABLE public.lane_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  
  -- Route information
  origin TEXT NOT NULL,
  destination TEXT NOT NULL,
  
  -- Historical data
  avg_rpm NUMERIC NOT NULL,
  load_count INTEGER NOT NULL DEFAULT 1,
  total_miles NUMERIC NOT NULL,
  total_revenue NUMERIC NOT NULL,
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  last_updated TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  -- Ensure unique lanes per user
  UNIQUE(user_id, origin, destination)
);

-- Enable RLS on lane_history
ALTER TABLE public.lane_history ENABLE ROW LEVEL SECURITY;

-- Create policies for lane_history
CREATE POLICY "Users can view their own lane history" 
ON public.lane_history 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own lane history" 
ON public.lane_history 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own lane history" 
ON public.lane_history 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Create trigger for automatic timestamp updates on negotiation_settings
CREATE TRIGGER update_negotiation_settings_updated_at
BEFORE UPDATE ON public.negotiation_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create trigger for automatic timestamp updates on negotiations
CREATE TRIGGER update_negotiations_updated_at
BEFORE UPDATE ON public.negotiations
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create trigger for automatic timestamp updates on lane_history
CREATE TRIGGER update_lane_history_updated_at
BEFORE UPDATE ON public.lane_history
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();