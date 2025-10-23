-- Create events table for analytics tracking
CREATE TABLE IF NOT EXISTS public.events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_name TEXT NOT NULL,
  payload JSONB DEFAULT '{}'::jsonb,
  session_id TEXT NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_events_event_name ON public.events(event_name);
CREATE INDEX IF NOT EXISTS idx_events_created_at ON public.events(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_events_session_id ON public.events(session_id);
CREATE INDEX IF NOT EXISTS idx_events_user_id ON public.events(user_id) WHERE user_id IS NOT NULL;

-- Enable RLS
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;

-- Allow anyone to insert events (for anonymous tracking)
CREATE POLICY "Anyone can insert events"
  ON public.events
  FOR INSERT
  WITH CHECK (true);

-- Users can only read their own events
CREATE POLICY "Users can read their own events"
  ON public.events
  FOR SELECT
  USING (auth.uid() = user_id OR user_id IS NULL);