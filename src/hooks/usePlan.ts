import { useState, useEffect, useRef } from 'react';
import { supabase } from '@loadmaster/api';
import { useToast } from '@/hooks/use-toast';
import { logError } from '@/utils/errorLogger';
import { logEvent } from '@/utils/metrics';

export function usePlan() {
  const [plan, setPlan] = useState<"free" | "pro">("free");
  const [loading, setLoading] = useState(true);
  const [planChangeSource, setPlanChangeSource] = useState<string | null>(null);
  const [planChangedAt, setPlanChangedAt] = useState<string | null>(null);
  const previousPlan = useRef<"free" | "pro">();
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

        const { data, error } = await supabase
          .from("user_settings")
          .select("*")
          .single();
        if (!error && data && mounted) {
          const row = data as any;
          if (row.plan) setPlan(row.plan as "free" | "pro");
          setPlanChangeSource((row.plan_change_source as string) || null);
          setPlanChangedAt((row.plan_changed_at as string) || null);
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

  useEffect(() => {
    const prev = previousPlan.current;
    if (prev && prev !== plan) {
      const timestamp = planChangedAt || new Date().toISOString();
      logEvent('plan_change', {
        from: prev,
        to: plan,
        source: planChangeSource || 'unknown',
        timestamp
      }).catch(() => {});
      if (!planChangedAt) setPlanChangedAt(timestamp);
    }
    previousPlan.current = plan;
  }, [plan, planChangeSource, planChangedAt]);

  return { plan, isPro: plan === "pro", loading };
}