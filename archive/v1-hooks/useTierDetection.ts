import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { getTier, isPro as isProTier, isFree } from '@/utils/tier';
import { logError } from '@/utils/errorLogger';

export interface TierInfo {
  tier: 'lite' | 'pro';
  isPro: boolean;
  isFree: boolean;
  loading: boolean;
  source: 'localStorage' | 'url' | 'supabase' | 'default';
}

/**
 * Unified tier detection hook that combines multiple sources:
 * 1. URL parameters (?tier=pro) - highest priority
 * 2. Supabase user metadata (JWT) - auth-based
 * 3. Supabase user_settings table - fallback
 * 4. localStorage - cached/offline
 * 5. Default 'lite' - final fallback
 */
export function useTierDetection(): TierInfo {
  const [tierInfo, setTierInfo] = useState<TierInfo>({
    tier: 'lite',
    isPro: false,
    isFree: true,
    loading: true,
    source: 'default'
  });
  
  const { toast } = useToast();

  useEffect(() => {
    let mounted = true;
    
    async function detectTier() {
      try {
        // Start with centralized tier detection (URL + localStorage)
        const centralizedTier = getTier();
        const centralizedIsPro = isProTier();
        const centralizedIsFree = isFree();
        
        // Check URL parameter first
        const urlTier = typeof window !== 'undefined' 
          ? new URLSearchParams(window.location.search).get('tier')?.toLowerCase()
          : null;
        
        if (urlTier && mounted) {
          const isUrlPro = urlTier === 'pro';
          console.log('🔍 TIER DEBUG - URL tier detected:', {
            urlTier,
            isUrlPro,
            source: 'url'
          });
          
          setTierInfo({
            tier: isUrlPro ? 'pro' : 'lite',
            isPro: isUrlPro,
            isFree: !isUrlPro,
            loading: false,
            source: 'url'
          });
          return;
        }

        // Check Supabase auth metadata (JWT)
        const { data: { session } } = await supabase.auth.getSession();
        const jwtPlan = session?.user?.app_metadata?.plan as "free"|"pro"|undefined;
        
        if (jwtPlan && mounted) {
          const isJwtPro = jwtPlan === 'pro';
          console.log('🔍 TIER DEBUG - JWT tier detected:', {
            jwtPlan,
            isJwtPro,
            source: 'supabase-jwt'
          });
          
          setTierInfo({
            tier: isJwtPro ? 'pro' : 'lite',
            isPro: isJwtPro,
            isFree: !isJwtPro,
            loading: false,
            source: 'supabase'
          });
          return;
        }
        
        // Check network connectivity before database query
        if (!navigator.onLine) {
          console.log('🔍 TIER DEBUG - Offline, using centralized tier:', {
            centralizedTier,
            centralizedIsPro,
            source: 'localStorage-offline'
          });
          
          if (mounted) {
            setTierInfo({
              tier: centralizedTier,
              isPro: centralizedIsPro,
              isFree: centralizedIsFree,
              loading: false,
              source: 'localStorage'
            });
          }
          return;
        }

        // Fallback to user_settings table
        const { data, error } = await supabase
          .from("user_settings")
          .select("plan")
          .single();
          
        if (!error && data?.plan && mounted) {
          const isDbPro = data.plan === 'pro';
          console.log('🔍 TIER DEBUG - Database tier detected:', {
            dbPlan: data.plan,
            isDbPro,
            source: 'supabase-db'
          });
          
          setTierInfo({
            tier: isDbPro ? 'pro' : 'lite',
            isPro: isDbPro,
            isFree: !isDbPro,
            loading: false,
            source: 'supabase'
          });
          return;
        }
        
        // Final fallback to centralized tier system
        console.log('🔍 TIER DEBUG - Using centralized fallback:', {
          centralizedTier,
          centralizedIsPro,
          source: 'localStorage-fallback'
        });
        
        if (mounted) {
          setTierInfo({
            tier: centralizedTier,
            isPro: centralizedIsPro,
            isFree: centralizedIsFree,
            loading: false,
            source: 'localStorage'
          });
        }
        
      } catch (error: any) {
        logError('Error detecting tier:', error);
        
        if (error instanceof Error && error.message.toLowerCase().includes('failed to fetch')) {
          toast({
            title: "Connection lost",
            description: "Using cached tier information.",
            variant: "destructive",
          });
        }
        
        // Emergency fallback to centralized system
        const emergencyTier = getTier();
        const emergencyIsPro = isProTier();
        const emergencyIsFree = isFree();
        
        console.log('🔍 TIER DEBUG - Emergency fallback:', {
          emergencyTier,
          emergencyIsPro,
          error: error.message,
          source: 'emergency-fallback'
        });
        
        if (mounted) {
          setTierInfo({
            tier: emergencyTier,
            isPro: emergencyIsPro,
            isFree: emergencyIsFree,
            loading: false,
            source: 'localStorage'
          });
        }
      }
    }
    
    detectTier();
    return () => { mounted = false; };
  }, [toast]);

  // Debug logging whenever tier info changes
  useEffect(() => {
    console.log('🔍 TIER DEBUG - useTierDetection state update:', tierInfo);
  }, [tierInfo]);

  return tierInfo;
}