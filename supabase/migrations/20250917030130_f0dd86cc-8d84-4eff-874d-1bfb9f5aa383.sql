-- Fix security vulnerability: Restrict subscription updates to own records only
DROP POLICY IF EXISTS "update_own_subscription" ON public.subscribers;

-- Create proper RLS policy that only allows users to update their own subscription
CREATE POLICY "update_own_subscription" 
ON public.subscribers 
FOR UPDATE 
USING ((user_id = auth.uid()) OR (email = auth.email()));