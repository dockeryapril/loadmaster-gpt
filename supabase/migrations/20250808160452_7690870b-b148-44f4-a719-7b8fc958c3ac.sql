-- Create loads table with all required fields
CREATE TABLE public.loads (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  origin TEXT NOT NULL,
  destination TEXT NOT NULL,
  miles DECIMAL(10,2) NOT NULL,
  rate DECIMAL(10,2) NOT NULL,
  fsc DECIMAL(10,2) DEFAULT 0, -- Fuel Surcharge
  tolls DECIMAL(10,2) DEFAULT 0,
  weight DECIMAL(10,2),
  deadhead_miles DECIMAL(10,2) DEFAULT 0,
  fuel_cost DECIMAL(10,2) DEFAULT 0,
  rpm DECIMAL(10,4) NOT NULL,
  profit DECIMAL(10,2) NOT NULL,
  quality TEXT NOT NULL CHECK (quality IN ('excellent', 'good', 'fair', 'poor')),
  tags TEXT[] DEFAULT '{}',
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create user_settings table
CREATE TABLE public.user_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  fuel_price DECIMAL(5,3) NOT NULL DEFAULT 3.50,
  mpg DECIMAL(4,2) NOT NULL DEFAULT 6.5,
  rpm_threshold_excellent DECIMAL(4,2) NOT NULL DEFAULT 2.5,
  rpm_threshold_good DECIMAL(4,2) NOT NULL DEFAULT 2.0,
  rpm_threshold_fair DECIMAL(4,2) NOT NULL DEFAULT 1.5,
  weight_limit INTEGER NOT NULL DEFAULT 80000,
  preferred_lanes TEXT[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.loads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for loads table
CREATE POLICY "Users can view their own loads" 
ON public.loads 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own loads" 
ON public.loads 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own loads" 
ON public.loads 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own loads" 
ON public.loads 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create RLS policies for user_settings table
CREATE POLICY "Users can view their own settings" 
ON public.user_settings 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own settings" 
ON public.user_settings 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own settings" 
ON public.user_settings 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_loads_updated_at
  BEFORE UPDATE ON public.loads
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_user_settings_updated_at
  BEFORE UPDATE ON public.user_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Function to create default user settings when user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_settings (user_id)
  VALUES (NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to automatically create user settings on signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();