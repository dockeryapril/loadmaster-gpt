import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { logError } from '@/utils/errorLogger';

export function usePlan() {
  const [plan, setPlan] = useState<"free" | "pro">("free");
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

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
        
        if (!navigator.onLine) {
          toast({
            title: "Connection lost",
            description: "Failed to load plan information.",
            variant: "destructive",
          });
          if (mounted) setLoading(false);
          return;
        }

        const { data, error } = await supabase.from("user_settings").select("plan").single();
        if (!error && data?.plan && mounted) {
          setPlan(data.plan as "free" | "pro");
        }
      } catch (error: any) {
        logError('Error fetching plan:', error);
        if (error instanceof Error && error.message.toLowerCase().includes('failed to fetch')) {
          toast({
            title: "Connection lost",
            description: "Failed to load plan information.",
            variant: "destructive",
          });
        }
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

  return { plan, isPro: plan === "pro", loading };
}