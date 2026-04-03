
-- Step 1: Create internal schema
CREATE SCHEMA internal;

-- Step 2: Drop public views (CASCADE needed for inter-view deps)
DROP VIEW IF EXISTS public.user_activity_summary CASCADE;
DROP VIEW IF EXISTS public.conversion_funnel CASCADE;
DROP VIEW IF EXISTS public.daily_analytics CASCADE;

-- Step 3: Recreate in internal schema

CREATE VIEW internal.daily_analytics AS
 SELECT date(created_at) AS date,
    count(DISTINCT session_id) AS unique_sessions,
    count(DISTINCT user_id) FILTER (WHERE (user_id IS NOT NULL)) AS authenticated_users,
    count(*) FILTER (WHERE (event_name = 'session_start'::text)) AS sessions,
    count(*) FILTER (WHERE (event_name = 'calculation_submitted'::text)) AS calculations,
    count(*) FILTER (WHERE (event_name = 'decision_logged'::text)) AS decisions_logged,
    count(*) FILTER (WHERE (event_name = 'screenshot_uploaded'::text)) AS ocr_uploads,
    count(*) FILTER (WHERE (event_name = 'negotiation_opened'::text)) AS negotiations,
    count(*) FILTER (WHERE (event_name = 'cost_assumptions_edited'::text)) AS cost_edits
   FROM public.events
  GROUP BY (date(created_at))
  ORDER BY (date(created_at)) DESC;

CREATE VIEW internal.conversion_funnel AS
 WITH session_events AS (
         SELECT events.session_id,
            events.user_id,
            date(min(events.created_at)) AS session_date,
            bool_or((events.event_name = 'session_start'::text)) AS had_session,
            bool_or((events.event_name = 'calculation_submitted'::text)) AS did_calculation,
            bool_or((events.event_name = 'decision_logged'::text)) AS logged_decision,
            bool_or((events.event_name = 'screenshot_uploaded'::text)) AS used_ocr
           FROM public.events
          GROUP BY events.session_id, events.user_id
        )
 SELECT session_date,
    count(*) AS total_sessions,
    count(*) FILTER (WHERE did_calculation) AS reached_calculation,
    count(*) FILTER (WHERE logged_decision) AS reached_decision,
    count(*) FILTER (WHERE used_ocr) AS used_ocr,
    round(((100.0 * (count(*) FILTER (WHERE did_calculation))::numeric) / (NULLIF(count(*), 0))::numeric), 2) AS calculation_rate,
    round(((100.0 * (count(*) FILTER (WHERE logged_decision))::numeric) / (NULLIF(count(*), 0))::numeric), 2) AS decision_rate,
    round(((100.0 * (count(*) FILTER (WHERE used_ocr))::numeric) / (NULLIF(count(*), 0))::numeric), 2) AS ocr_usage_rate
   FROM session_events
  GROUP BY session_date
  ORDER BY session_date DESC;

CREATE VIEW internal.user_activity_summary AS
 SELECT u.id AS user_id,
    u.email,
    ur.role,
    count(DISTINCT l.id) AS total_loads,
    count(DISTINCT e.session_id) AS total_sessions,
    min(l.created_at) AS first_load_date,
    max(l.created_at) AS last_load_date,
    min(e.created_at) AS first_event_date,
    max(e.created_at) AS last_event_date,
    avg(l.rpm) AS avg_rpm,
    avg(l.profit) AS avg_profit
   FROM (((auth.users u
     LEFT JOIN public.user_roles ur ON ((u.id = ur.user_id)))
     LEFT JOIN public.loads l ON ((u.id = l.user_id)))
     LEFT JOIN public.events e ON ((u.id = e.user_id)))
  GROUP BY u.id, u.email, ur.role
  ORDER BY (count(DISTINCT l.id)) DESC NULLS LAST;

-- Step 4: Update RPC functions to query internal schema

CREATE OR REPLACE FUNCTION public.get_daily_analytics()
 RETURNS TABLE(date date, unique_sessions bigint, authenticated_users bigint, sessions bigint, calculations bigint, decisions_logged bigint, ocr_uploads bigint, negotiations bigint, cost_edits bigint)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $$
BEGIN
  IF NOT has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'Access denied. Admin role required.';
  END IF;
  RETURN QUERY SELECT * FROM internal.daily_analytics;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_conversion_funnel()
 RETURNS TABLE(session_date date, total_sessions bigint, reached_calculation bigint, reached_decision bigint, used_ocr bigint, calculation_rate numeric, decision_rate numeric, ocr_usage_rate numeric)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $$
BEGIN
  IF NOT has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'Access denied. Admin role required.';
  END IF;
  RETURN QUERY SELECT * FROM internal.conversion_funnel;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_user_activity(target_user_id uuid DEFAULT NULL::uuid)
 RETURNS TABLE(user_id uuid, email character varying, role public.app_role, total_loads bigint, total_sessions bigint, first_load_date timestamp with time zone, last_load_date timestamp with time zone, first_event_date timestamp with time zone, last_event_date timestamp with time zone, avg_rpm numeric, avg_profit numeric)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $$
BEGIN
  IF has_role(auth.uid(), 'admin'::app_role) THEN
    IF target_user_id IS NOT NULL THEN
      RETURN QUERY
        SELECT * FROM internal.user_activity_summary
        WHERE internal.user_activity_summary.user_id = target_user_id;
    ELSE
      RETURN QUERY SELECT * FROM internal.user_activity_summary;
    END IF;
  ELSE
    RETURN QUERY
      SELECT * FROM internal.user_activity_summary
      WHERE internal.user_activity_summary.user_id = auth.uid();
  END IF;
END;
$$;
