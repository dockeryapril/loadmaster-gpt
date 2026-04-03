
-- Revoke direct access to analytics views from non-service roles
-- All access should go through admin-gated RPC functions
REVOKE SELECT ON public.daily_analytics FROM anon, authenticated;
REVOKE SELECT ON public.conversion_funnel FROM anon, authenticated;
REVOKE SELECT ON public.user_activity_summary FROM anon, authenticated;
