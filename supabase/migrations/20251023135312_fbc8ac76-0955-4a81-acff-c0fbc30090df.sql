-- Fix type mismatch in get_user_activity function
-- The user_activity_summary view returns email as varchar, not text

DROP FUNCTION IF EXISTS public.get_user_activity(uuid);

CREATE OR REPLACE FUNCTION public.get_user_activity(target_user_id uuid DEFAULT NULL::uuid)
 RETURNS TABLE(
   user_id uuid, 
   email varchar,  -- Changed from text to varchar to match view
   role app_role, 
   total_loads bigint, 
   total_sessions bigint, 
   first_load_date timestamp with time zone, 
   last_load_date timestamp with time zone, 
   first_event_date timestamp with time zone, 
   last_event_date timestamp with time zone, 
   avg_rpm numeric, 
   avg_profit numeric
 )
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
$function$;