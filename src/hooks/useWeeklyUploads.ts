import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { usePlan } from '@/hooks/usePlan';

export interface WeeklyUploadInfo {
  weeklyCount: number;
  weeklyLimit: number;
  remaining: number;
  canUpload: boolean;
  resetDate: Date;
  isPro: boolean;
}

/**
 * Hook to manage weekly upload limits for Free (4/week) and Pro (100/week) plans
 * Week starts Sunday at midnight as requested
 */
export function useWeeklyUploads(): WeeklyUploadInfo & {
  incrementUsage: () => Promise<void>;
  refreshUsage: () => Promise<void>;
} {
  const { user } = useAuth();
  const { isPro } = usePlan();
  const [weeklyCount, setWeeklyCount] = useState(0);
  const [loading, setLoading] = useState(true);

  // Calculate limits based on plan
  const weeklyLimit = isPro ? 100 : 4;

  // Calculate current week's Sunday at midnight
  const getCurrentWeekStart = (): Date => {
    const now = new Date();
    const dayOfWeek = now.getDay(); // 0 = Sunday, 1 = Monday, etc.
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - dayOfWeek);
    weekStart.setHours(0, 0, 0, 0);
    return weekStart;
  };

  // Calculate next week's Sunday (reset date)
  const getNextWeekStart = (): Date => {
    const currentWeekStart = getCurrentWeekStart();
    const nextWeek = new Date(currentWeekStart);
    nextWeek.setDate(currentWeekStart.getDate() + 7);
    return nextWeek;
  };

  // Fetch current usage from Supabase
  const fetchUsage = async (): Promise<void> => {
    if (!user) {
      setWeeklyCount(0);
      setLoading(false);
      return;
    }

    try {
      const currentWeekStart = getCurrentWeekStart();
      const weekStartString = currentWeekStart.toISOString().split('T')[0]; // YYYY-MM-DD format

      // Get user settings
      const { data, error } = await supabase
        .from('user_settings')
        .select('weekly_upload_count, week_start_date')
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows found
        console.error('Error fetching weekly usage:', error);
        setWeeklyCount(0);
        setLoading(false);
        return;
      }

      // If no settings exist or it's a new week, reset counter
      if (!data || data.week_start_date !== weekStartString) {
        await supabase
          .from('user_settings')
          .upsert({
            user_id: user.id,
            weekly_upload_count: 0,
            week_start_date: weekStartString
          });
        setWeeklyCount(0);
      } else {
        setWeeklyCount(data.weekly_upload_count || 0);
      }
    } catch (error) {
      console.error('Error in fetchUsage:', error);
      setWeeklyCount(0);
    } finally {
      setLoading(false);
    }
  };

  // Increment usage counter
  const incrementUsage = async (): Promise<void> => {
    if (!user) return;

    try {
      const currentWeekStart = getCurrentWeekStart();
      const weekStartString = currentWeekStart.toISOString().split('T')[0];

      const { data, error } = await supabase
        .from('user_settings')
        .select('weekly_upload_count, week_start_date')
        .eq('user_id', user.id)
        .single();

      let newCount = 1;
      
      if (data && data.week_start_date === weekStartString) {
        newCount = (data.weekly_upload_count || 0) + 1;
      }

      await supabase
        .from('user_settings')
        .upsert({
          user_id: user.id,
          weekly_upload_count: newCount,
          week_start_date: weekStartString
        });

      setWeeklyCount(newCount);
    } catch (error) {
      console.error('Error incrementing usage:', error);
    }
  };

  // Refresh usage (re-fetch from database)
  const refreshUsage = fetchUsage;

  // Load usage on mount and when user changes
  useEffect(() => {
    fetchUsage();
  }, [user?.id]);

  const remaining = Math.max(0, weeklyLimit - weeklyCount);
  const canUpload = remaining > 0;

  return {
    weeklyCount,
    weeklyLimit,
    remaining,
    canUpload,
    resetDate: getNextWeekStart(),
    isPro,
    incrementUsage,
    refreshUsage
  };
}