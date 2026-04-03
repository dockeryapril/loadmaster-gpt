
-- 1. Fix subscribers: Remove permissive UPDATE policy (subscription changes should only go through Stripe webhooks)
DROP POLICY IF EXISTS "update_own_subscription" ON public.subscribers;

-- 2. Fix daily_analytics: Enable RLS and restrict to admins
ALTER VIEW public.daily_analytics SET (security_invoker = true);

-- 3. Fix conversion_funnel: Same treatment
ALTER VIEW public.conversion_funnel SET (security_invoker = true);

-- 4. Fix user_activity_summary: Set security_invoker to respect caller's permissions
ALTER VIEW public.user_activity_summary SET (security_invoker = true);
