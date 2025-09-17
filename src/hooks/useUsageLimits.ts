import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { usePlan } from '@/hooks/usePlan';

export interface UsageLimitInfo {
  currentCount: number;
  limit: number;
  remaining: number;
  canUse: boolean;
  resetDate: Date;
  isPro: boolean;
  resetPeriod: 'weekly' | 'monthly';
}

/**
 * Unified hook to manage usage limits for both Free (5/month) and Pro (100/month) plans
 * Free: 5 operations per month, resets on 1st of each month
 * Pro: 100 operations per month, resets based on subscription date
 */
export function useUsageLimits(): UsageLimitInfo & {
  incrementUsage: () => Promise<void>;
  refreshUsage: () => Promise<void>;
} {
  const { user } = useAuth();
  const { isPro } = usePlan();
  const [currentCount, setCurrentCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [subscriptionStartDate, setSubscriptionStartDate] = useState<Date | null>(null);

  // Calculate limits based on plan
  const limit = isPro ? 100 : 5;
  const resetPeriod = 'monthly'; // Both tiers use monthly limits now

  // Calculate first day of current month
  const getCurrentMonthStart = (): Date => {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    monthStart.setHours(0, 0, 0, 0);
    return monthStart;
  };

  // Calculate first day of next month (reset date for free users)
  const getNextMonthStart = (): Date => {
    const now = new Date();
    const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    nextMonth.setHours(0, 0, 0, 0);
    return nextMonth;
  };

  // Calculate next month reset date for Pro users
  const getNextMonthReset = (subscriptionStartDate: Date): Date => {
    const now = new Date();
    const candidate = new Date(subscriptionStartDate);
    candidate.setFullYear(
      now.getFullYear(),
      now.getMonth(),
      subscriptionStartDate.getDate()
    );

    if (candidate <= now) {
      candidate.setMonth(candidate.getMonth() + 1);
    }

    return candidate;
  };

  // Fetch current usage from Supabase and reset if needed
  const fetchUsage = async (): Promise<void> => {
    if (!user) {
      setCurrentCount(0);
      setSubscriptionStartDate(null);
      setLoading(false);
      return;
    }

    try {
      // First, call the reset function to handle period resets
      await supabase.rpc('reset_usage_if_needed', { p_user_id: user.id });

      // Get user settings
      const { data, error } = await supabase
        .from('user_settings')
        .select('usage_count, monthly_usage_count, subscription_start_date, plan')
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows found
        console.error('Error fetching usage:', error);
        setCurrentCount(0);
        setSubscriptionStartDate(null);
        setLoading(false);
        return;
      }

      if (data) {
        if (data.plan === 'pro' && data.subscription_start_date) {
          setSubscriptionStartDate(new Date(data.subscription_start_date));
        } else {
          setSubscriptionStartDate(null);
        }

        // Use the appropriate count based on plan
        // Both free and pro use monthly usage count now
        setCurrentCount(data.monthly_usage_count || 0);
      } else {
        setSubscriptionStartDate(null);
        setCurrentCount(0);
      }
    } catch (error) {
      console.error('Error in fetchUsage:', error);
      setCurrentCount(0);
      setSubscriptionStartDate(null);
    } finally {
      setLoading(false);
    }
  };

  // Increment usage counter
  const incrementUsage = async (): Promise<void> => {
    if (!user) return;

    try {
      // First reset if needed
      await supabase.rpc('reset_usage_if_needed', { p_user_id: user.id });

      // Get current settings to determine which counter to update
      const { data, error } = await supabase
        .from('user_settings')
        .select('plan, usage_count, monthly_usage_count')
        .eq('user_id', user.id)
        .single();

      if (error) {
        console.error('Error fetching settings for increment:', error);
        return;
      }

      // Both free and pro use monthly usage count now
      const newCount = (data?.monthly_usage_count || 0) + 1;
      const updateData = { monthly_usage_count: newCount };
      setCurrentCount(newCount);

      await supabase
        .from('user_settings')
        .update(updateData)
        .eq('user_id', user.id);

    } catch (error) {
      console.error('Error incrementing usage:', error);
    }
  };

  // Refresh usage (re-fetch from database)
  const refreshUsage = fetchUsage;

  // Load usage on mount and when user changes
  useEffect(() => {
    fetchUsage();
  }, [user?.id, isPro]);

  // Calculate reset date based on plan
  const getResetDate = (): Date => {
    if (isPro && subscriptionStartDate) {
      // Pro users reset based on subscription start date
      return getNextMonthReset(subscriptionStartDate);
    } else {
      // Free users (and Pro without subscription date) reset on 1st of month
      return getNextMonthStart();
    }
  };

  const remaining = Math.max(0, limit - currentCount);
  const canUse = remaining > 0;

  return {
    currentCount,
    limit,
    remaining,
    canUse,
    resetDate: getResetDate(),
    isPro,
    resetPeriod,
    incrementUsage,
    refreshUsage
  };
}