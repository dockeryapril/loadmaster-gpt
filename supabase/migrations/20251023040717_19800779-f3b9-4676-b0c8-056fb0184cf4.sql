-- Add admin role to primary account (dockeryapril@gmail.com)
INSERT INTO public.user_roles (user_id, role)
VALUES ('2110b7d7-6361-47c4-acd2-de735a1d635e', 'admin'::public.app_role)
ON CONFLICT (user_id, role) DO NOTHING;

-- Create analytics summary view for daily metrics (admin only via app logic)
CREATE OR REPLACE VIEW public.daily_analytics AS
SELECT 
  DATE(created_at) as date,
  COUNT(DISTINCT session_id) as unique_sessions,
  COUNT(DISTINCT user_id) FILTER (WHERE user_id IS NOT NULL) as authenticated_users,
  COUNT(*) FILTER (WHERE event_name = 'session_start') as sessions,
  COUNT(*) FILTER (WHERE event_name = 'calculation_submitted') as calculations,
  COUNT(*) FILTER (WHERE event_name = 'decision_logged') as decisions_logged,
  COUNT(*) FILTER (WHERE event_name = 'screenshot_uploaded') as ocr_uploads,
  COUNT(*) FILTER (WHERE event_name = 'negotiation_opened') as negotiations,
  COUNT(*) FILTER (WHERE event_name = 'cost_assumptions_edited') as cost_edits
FROM public.events
GROUP BY DATE(created_at)
ORDER BY date DESC;

-- Create conversion funnel view
CREATE OR REPLACE VIEW public.conversion_funnel AS
WITH session_events AS (
  SELECT 
    session_id,
    user_id,
    DATE(MIN(created_at)) as session_date,
    BOOL_OR(event_name = 'session_start') as had_session,
    BOOL_OR(event_name = 'calculation_submitted') as did_calculation,
    BOOL_OR(event_name = 'decision_logged') as logged_decision,
    BOOL_OR(event_name = 'screenshot_uploaded') as used_ocr
  FROM public.events
  GROUP BY session_id, user_id
)
SELECT 
  session_date,
  COUNT(*) as total_sessions,
  COUNT(*) FILTER (WHERE did_calculation) as reached_calculation,
  COUNT(*) FILTER (WHERE logged_decision) as reached_decision,
  COUNT(*) FILTER (WHERE used_ocr) as used_ocr,
  ROUND(100.0 * COUNT(*) FILTER (WHERE did_calculation) / NULLIF(COUNT(*), 0), 2) as calculation_rate,
  ROUND(100.0 * COUNT(*) FILTER (WHERE logged_decision) / NULLIF(COUNT(*), 0), 2) as decision_rate,
  ROUND(100.0 * COUNT(*) FILTER (WHERE used_ocr) / NULLIF(COUNT(*), 0), 2) as ocr_usage_rate
FROM session_events
GROUP BY session_date
ORDER BY session_date DESC;

-- Create user activity summary view
CREATE OR REPLACE VIEW public.user_activity_summary AS
SELECT 
  u.id as user_id,
  u.email,
  ur.role,
  COUNT(DISTINCT l.id) as total_loads,
  COUNT(DISTINCT e.session_id) as total_sessions,
  MIN(l.created_at) as first_load_date,
  MAX(l.created_at) as last_load_date,
  MIN(e.created_at) as first_event_date,
  MAX(e.created_at) as last_event_date,
  AVG(l.rpm) as avg_rpm,
  AVG(l.profit) as avg_profit
FROM auth.users u
LEFT JOIN public.user_roles ur ON u.id = ur.user_id
LEFT JOIN public.loads l ON u.id = l.user_id
LEFT JOIN public.events e ON u.id = e.user_id
GROUP BY u.id, u.email, ur.role
ORDER BY total_loads DESC NULLS LAST;

-- Create security definer function to get daily analytics (admin only)
CREATE OR REPLACE FUNCTION public.get_daily_analytics()
RETURNS TABLE (
  date date,
  unique_sessions bigint,
  authenticated_users bigint,
  sessions bigint,
  calculations bigint,
  decisions_logged bigint,
  ocr_uploads bigint,
  negotiations bigint,
  cost_edits bigint
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Check if user is admin
  IF NOT has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'Access denied. Admin role required.';
  END IF;
  
  RETURN QUERY SELECT * FROM public.daily_analytics;
END;
$$;

-- Create security definer function to get conversion funnel (admin only)
CREATE OR REPLACE FUNCTION public.get_conversion_funnel()
RETURNS TABLE (
  session_date date,
  total_sessions bigint,
  reached_calculation bigint,
  reached_decision bigint,
  used_ocr bigint,
  calculation_rate numeric,
  decision_rate numeric,
  ocr_usage_rate numeric
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Check if user is admin
  IF NOT has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'Access denied. Admin role required.';
  END IF;
  
  RETURN QUERY SELECT * FROM public.conversion_funnel;
END;
$$;

-- Create security definer function to get user activity (admin or own data)
CREATE OR REPLACE FUNCTION public.get_user_activity(target_user_id uuid DEFAULT NULL)
RETURNS TABLE (
  user_id uuid,
  email text,
  role app_role,
  total_loads bigint,
  total_sessions bigint,
  first_load_date timestamptz,
  last_load_date timestamptz,
  first_event_date timestamptz,
  last_event_date timestamptz,
  avg_rpm numeric,
  avg_profit numeric
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- If user is admin, return all users or specific user
  IF has_role(auth.uid(), 'admin'::app_role) THEN
    IF target_user_id IS NOT NULL THEN
      RETURN QUERY 
        SELECT * FROM public.user_activity_summary 
        WHERE user_activity_summary.user_id = target_user_id;
    ELSE
      RETURN QUERY SELECT * FROM public.user_activity_summary;
    END IF;
  -- If not admin, only return own data
  ELSE
    RETURN QUERY 
      SELECT * FROM public.user_activity_summary 
      WHERE user_activity_summary.user_id = auth.uid();
  END IF;
END;
$$;