-- Fix security issues with views exposing auth.users data
-- Issue 1: SUPA_auth_users_exposed - Views expose auth.users email addresses
-- Issue 2: SUPA_security_definer_view - Views use SECURITY DEFINER instead of SECURITY INVOKER

-- Solution: Set views to security_invoker and revoke direct access
-- This ensures views can ONLY be accessed through the secure RPC functions

-- Set views to use security_invoker (run with caller's permissions)
ALTER VIEW public.user_activity_summary SET (security_invoker = true);
ALTER VIEW public.daily_analytics SET (security_invoker = true);
ALTER VIEW public.conversion_funnel SET (security_invoker = true);

-- Revoke direct SELECT access to views from anon and authenticated roles
-- This prevents bypassing the RPC functions which have proper role checks
REVOKE SELECT ON public.user_activity_summary FROM anon, authenticated;
REVOKE SELECT ON public.daily_analytics FROM anon, authenticated;
REVOKE SELECT ON public.conversion_funnel FROM anon, authenticated;

-- Grant SELECT on views to service_role only (used by RPC functions)
GRANT SELECT ON public.user_activity_summary TO service_role;
GRANT SELECT ON public.daily_analytics TO service_role;
GRANT SELECT ON public.conversion_funnel TO service_role;

-- The existing RPC functions (get_user_activity, get_daily_analytics, get_conversion_funnel)
-- are SECURITY DEFINER and will continue to work because they run with elevated privileges
-- They have proper admin role checks built in