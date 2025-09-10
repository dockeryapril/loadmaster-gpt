-- Create table for email collection from MVP landing page
CREATE TABLE public.email_signups (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL,
  source TEXT NOT NULL DEFAULT 'mvp_landing',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  metadata JSONB DEFAULT '{}'::jsonb,
  
  CONSTRAINT unique_email_source UNIQUE(email, source)
);

-- Create index for faster queries
CREATE INDEX idx_email_signups_created_at ON public.email_signups(created_at DESC);
CREATE INDEX idx_email_signups_source ON public.email_signups(source);

-- Enable RLS (Row Level Security)
ALTER TABLE public.email_signups ENABLE ROW LEVEL SECURITY;

-- Create policy to allow public inserts (for landing page signups)
CREATE POLICY "Anyone can sign up for email list" 
ON public.email_signups 
FOR INSERT 
WITH CHECK (true);

-- Create policy for viewing (admin only - you'll need to modify this based on your admin setup)
CREATE POLICY "Only authenticated users can view email signups" 
ON public.email_signups 
FOR SELECT 
USING (auth.role() = 'authenticated');

-- Create function to update timestamps
CREATE TRIGGER update_email_signups_updated_at
BEFORE UPDATE ON public.email_signups
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();