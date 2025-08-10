-- Add plan field to user_settings table
ALTER TABLE public.user_settings 
ADD COLUMN plan text NOT NULL DEFAULT 'free' CHECK (plan IN ('free', 'pro'));

-- Update existing users to 'free' plan
UPDATE public.user_settings SET plan = 'free' WHERE plan IS NULL;