import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { UserSettings, defaultUserSettings, EquipmentRPMOverrides, EquipmentMPGOverrides } from '@/types/load';
import { useToast } from '@/hooks/use-toast';
import { logError } from '@/utils/errorLogger';

export function useSupabaseSettings() {
  const [settings, setSettings] = useState<UserSettings>(defaultUserSettings);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  // Fetch settings from Supabase
  const fetchSettings = async (retryCount = 0) => {
    if (!user) return;

    if (!navigator.onLine) {
      toast({
        title: "Connection lost",
        description: "Failed to load your settings.",
        variant: "destructive",
      });
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('user_settings')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) {
        // Check for JWT expiration
        if (error.message?.includes('JWT expired') || error.message?.includes('PGRST303')) {
          console.log('🔄 JWT expired, attempting to refresh session...');
          
          if (retryCount < 2) {
            // Try to refresh the session
            const { error: refreshError } = await supabase.auth.refreshSession();
            
            if (!refreshError) {
              // Retry the request with refreshed token
              console.log('✅ Session refreshed, retrying settings fetch...');
              return fetchSettings(retryCount + 1);
            } else {
              console.error('❌ Failed to refresh session:', refreshError);
              logError('Failed to refresh session:', refreshError);
            }
          } else {
            console.error('❌ Max retries exceeded for settings fetch');
            toast({
              title: "Authentication expired",
              description: "Please sign in again to continue.",
              variant: "destructive",
            });
            return;
          }
        }
        
        throw error;
      }

      if (data) {
        // Transform database data to UserSettings interface
        const userSettings: UserSettings = {
          fuelPrice: Number(data.fuel_price),
          mpg: Number(data.mpg),
          rpmThresholds: {
            excellent: Number(data.rpm_threshold_excellent),
            good: Number(data.rpm_threshold_good),
            fair: Number(data.rpm_threshold_fair),
          },
          weightLimit: Number(data.weight_limit),
          preferredLanes: data.preferred_lanes || [],
          enableFuelCostTracking: Boolean(data.enable_fuel_cost_tracking),
          businessSetupCompleted: Boolean(data.business_setup_completed),
          businessSetupCompletedAt: data.business_setup_completed_at,
          showSetupReminders: Boolean(data.show_setup_reminders),
          setupCompletionPercentage: Number(data.setup_completion_percentage) || 0,
          useEquipmentDefaults: data.use_equipment_defaults !== false, // default to true
          equipmentRpmOverrides: (data.equipment_rpm_overrides as EquipmentRPMOverrides) || {},
          equipmentMpgOverrides: (data.equipment_mpg_overrides as EquipmentMPGOverrides) || {},
          revenueSplitPercentage: Number(data.revenue_split_percentage) || 100,
          weeklyFixedCosts: Number(data.weekly_fixed_costs) || 0,
        };
        setSettings(userSettings);
        console.log('✅ Settings loaded successfully');
      } else {
        // No settings found, use defaults (they will be created by trigger)
        setSettings(defaultUserSettings);
        console.log('ℹ️ No settings found, using defaults');
      }
    } catch (error: any) {
      logError('Error fetching settings:', error);
      
      if (error instanceof Error && (
        error.message.toLowerCase().includes('failed to fetch') ||
        error.message.toLowerCase().includes('network')
      )) {
        toast({
          title: "Connection lost",
          description: "Failed to load your settings.",
          variant: "destructive",
        });
      } else if (error.message?.includes('JWT expired') || error.message?.includes('PGRST303')) {
        toast({
          title: "Authentication expired",
          description: "Please refresh the page or sign in again.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Error loading settings",
          description: "Failed to load your settings. Using defaults.",
          variant: "destructive",
        });
      }
      setSettings(defaultUserSettings);
    } finally {
      setLoading(false);
    }
  };

  // Update settings in Supabase (partial updates supported)
  const updateSettings = async (partialSettings: Partial<UserSettings>, retryCount = 0) => {
    if (!user) return;

    if (!navigator.onLine) {
      toast({
        title: "Connection lost",
        description: "Save will retry when online",
        variant: "destructive",
      });
      return;
    }

    try {
      const mergedSettings = { ...settings, ...partialSettings };

      const updateData: any = {
        user_id: user.id,
      };

      // Only update fields that are provided
      if (partialSettings.fuelPrice !== undefined) updateData.fuel_price = partialSettings.fuelPrice;
      if (partialSettings.mpg !== undefined) updateData.mpg = partialSettings.mpg;
      if (partialSettings.rpmThresholds !== undefined) {
        updateData.rpm_threshold_excellent = partialSettings.rpmThresholds.excellent;
        updateData.rpm_threshold_good = partialSettings.rpmThresholds.good;
        updateData.rpm_threshold_fair = partialSettings.rpmThresholds.fair;
      }
      if (partialSettings.weightLimit !== undefined) updateData.weight_limit = partialSettings.weightLimit;
      if (partialSettings.preferredLanes !== undefined) updateData.preferred_lanes = partialSettings.preferredLanes;
      if (partialSettings.enableFuelCostTracking !== undefined) updateData.enable_fuel_cost_tracking = partialSettings.enableFuelCostTracking;
      if (partialSettings.businessSetupCompleted !== undefined) updateData.business_setup_completed = partialSettings.businessSetupCompleted;
      if (partialSettings.businessSetupCompletedAt !== undefined) updateData.business_setup_completed_at = partialSettings.businessSetupCompletedAt;
      if (partialSettings.showSetupReminders !== undefined) updateData.show_setup_reminders = partialSettings.showSetupReminders;
        if (partialSettings.setupCompletionPercentage !== undefined) updateData.setup_completion_percentage = partialSettings.setupCompletionPercentage;
        if (partialSettings.useEquipmentDefaults !== undefined) updateData.use_equipment_defaults = partialSettings.useEquipmentDefaults;
        if (partialSettings.equipmentRpmOverrides !== undefined) updateData.equipment_rpm_overrides = partialSettings.equipmentRpmOverrides;
        if (partialSettings.equipmentMpgOverrides !== undefined) updateData.equipment_mpg_overrides = partialSettings.equipmentMpgOverrides;
        if (partialSettings.revenueSplitPercentage !== undefined) updateData.revenue_split_percentage = partialSettings.revenueSplitPercentage;
        if (partialSettings.weeklyFixedCosts !== undefined) updateData.weekly_fixed_costs = partialSettings.weeklyFixedCosts;

      const { error } = await supabase
        .from('user_settings')
        .upsert(updateData, {
          onConflict: 'user_id'
        });

      if (error) {
        // Check for JWT expiration
        if (error.message?.includes('JWT expired') || error.message?.includes('PGRST303')) {
          console.log('🔄 JWT expired during update, attempting to refresh session...');
          
          if (retryCount < 2) {
            // Try to refresh the session
            const { error: refreshError } = await supabase.auth.refreshSession();
            
            if (!refreshError) {
              // Retry the request with refreshed token
              console.log('✅ Session refreshed, retrying settings update...');
              return updateSettings(partialSettings, retryCount + 1);
            } else {
              console.error('❌ Failed to refresh session during update:', refreshError);
              logError('Failed to refresh session during update:', refreshError);
            }
          } else {
            console.error('❌ Max retries exceeded for settings update');
            toast({
              title: "Authentication expired",
              description: "Please sign in again to save your settings.",
              variant: "destructive",
            });
            return;
          }
        }
        
        throw error;
      }

      setSettings(mergedSettings);

      toast({
        title: "Settings saved",
        description: "Your settings have been updated successfully.",
      });
    } catch (error: any) {
      logError('Error updating settings:', error);
      
      if (error instanceof Error && (
        error.message.toLowerCase().includes('failed to fetch') ||
        error.message.toLowerCase().includes('network')
      )) {
        toast({
          title: "Connection lost",
          description: "Save will retry when online",
          variant: "destructive",
        });
      } else if (error.message?.includes('JWT expired') || error.message?.includes('PGRST303')) {
        toast({
          title: "Authentication expired",
          description: "Please refresh the page or sign in again.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Error saving settings",
          description: error.message || "Failed to save your settings.",
          variant: "destructive",
        });
      }
    }
  };

  useEffect(() => {
    if (user) {
      fetchSettings();
    }
  }, [user]);

  return {
    settings,
    loading,
    updateSettings,
    refetch: fetchSettings,
  };
}