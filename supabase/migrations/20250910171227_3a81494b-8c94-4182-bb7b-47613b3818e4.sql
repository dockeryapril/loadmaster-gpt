-- Add weekly upload tracking columns to user_settings table
ALTER TABLE public.user_settings 
ADD COLUMN weekly_upload_count INTEGER DEFAULT 0 NOT NULL,
ADD COLUMN week_start_date DATE DEFAULT (DATE_TRUNC('week', CURRENT_DATE) + INTERVAL '1 day')::date NOT NULL;

-- Create index for efficient weekly queries
CREATE INDEX idx_user_settings_week_start ON public.user_settings(week_start_date);

-- Update plan column default to 'free' for new users
ALTER TABLE public.user_settings ALTER COLUMN plan SET DEFAULT 'free';