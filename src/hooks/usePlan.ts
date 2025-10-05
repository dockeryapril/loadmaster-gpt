import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { logError } from '@/utils/errorLogger';
import { logEvent } from '@/utils/metrics';

export function usePlan() {
  const [plan, setPlan] = useState<"free" | "pro">("free");
  const [loading, setLoading] = useState(true);
  const [planChangeSource, setPlanChangeSource] = useState<string | null>(null);
  const [planChangedAt, setPlanChangedAt] = useState<string | null>(null);
  const [subscriptionTier, setSubscriptionTier] = useState<string | null>(null);
  const [subscriptionEnd, setSubscriptionEnd] = useState<string | null>(null);
  const previousPlan = useRef<"free" | "pro">();
  const { toast } = useToast();

  const checkSubscription = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('check-subscription');
      if (error) {
        console.error('Error checking subscription:', error);
        return false;
      }
      
      if (data?.plan) {
        setPlan(data.plan as "free" | "pro");
        setSubscriptionTier(data.subscription_tier || null);
        setSubscriptionEnd(data.subscription_end || null);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Failed to check subscription:', error);
      return false;
    }
  };

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session?.user) {
          if (mounted) setLoading(false);
          return;
        }

        // First try to check with Stripe
        const subscriptionChecked = await checkSubscription();
        
        if (!subscriptionChecked) {
          // Fallback to user_settings if Stripe check fails
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
        source: planChangeSource || 'stripe',
        timestamp
      }).catch(() => {});
      if (!planChangedAt) setPlanChangedAt(timestamp);
    }
    previousPlan.current = plan;
  }, [plan, planChangeSource, planChangedAt]);

  return { 
    plan, 
    isPro: plan === "pro", 
    loading, 
    subscriptionTier, 
    subscriptionEnd, 
    checkSubscription 
  };
}