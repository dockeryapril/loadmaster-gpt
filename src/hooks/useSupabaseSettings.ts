import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { UserSettings, defaultUserSettings } from '@/types/load';
import { useToast } from '@/hooks/use-toast';

export function useSupabaseSettings() {
  const [settings, setSettings] = useState<UserSettings>(defaultUserSettings);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  // Fetch settings from Supabase
  const fetchSettings = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('user_settings')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) throw error;

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
        };
        setSettings(userSettings);
      } else {
        // No settings found, use defaults (they will be created by trigger)
        setSettings(defaultUserSettings);
      }
    } catch (error: any) {
      console.error('Error fetching settings:', error);
      toast({
        title: "Error loading settings",
        description: "Failed to load your settings. Using defaults.",
        variant: "destructive",
      });
      setSettings(defaultUserSettings);
    } finally {
      setLoading(false);
    }
  };

  // Update settings in Supabase
  const updateSettings = async (newSettings: UserSettings) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('user_settings')
        .upsert({
          user_id: user.id,
          fuel_price: newSettings.fuelPrice,
          mpg: newSettings.mpg,
          rpm_threshold_excellent: newSettings.rpmThresholds.excellent,
          rpm_threshold_good: newSettings.rpmThresholds.good,
          rpm_threshold_fair: newSettings.rpmThresholds.fair,
          weight_limit: newSettings.weightLimit,
          preferred_lanes: newSettings.preferredLanes,
        }, {
          onConflict: 'user_id'
        });

      if (error) throw error;

      setSettings(newSettings);

      toast({
        title: "Settings saved",
        description: "Your settings have been updated successfully.",
      });
    } catch (error: any) {
      console.error('Error updating settings:', error);
      toast({
        title: "Error saving settings",
        description: error.message || "Failed to save your settings.",
        variant: "destructive",
      });
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