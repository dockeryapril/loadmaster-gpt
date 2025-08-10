import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export function usePlan() {
  const [plan, setPlan] = useState<"free" | "pro">("free");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        const jwtPlan = session?.user?.app_metadata?.plan as "free"|"pro"|undefined;
        
        if (jwtPlan) { 
          if (mounted) { 
            setPlan(jwtPlan); 
            setLoading(false); 
            return; 
          } 
        }
        
        const { data, error } = await supabase.from("user_settings").select("plan").single();
        if (!error && data?.plan && mounted) {
          setPlan(data.plan as "free" | "pro");
        }
      } catch (error) {
        console.error('Error fetching plan:', error);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

  return { plan, isPro: plan === "pro", loading };
}