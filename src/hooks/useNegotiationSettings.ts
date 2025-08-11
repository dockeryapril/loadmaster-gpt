import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { NegotiationSettings, DEFAULT_NEGOTIATION_SETTINGS } from '@/types/negotiation';
import { useToast } from '@/hooks/use-toast';
import { logError } from '@/utils/errorLogger';

export function useNegotiationSettings() {
  const [settings, setSettings] = useState<NegotiationSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  const fetchSettings = async () => {
    if (!user) return;

    if (!navigator.onLine) {
      toast({
        title: "Connection lost",
        description: "Failed to load your negotiation settings.",
        variant: "destructive",
      });
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('negotiation_settings')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setSettings(data as NegotiationSettings);
      } else {
        // Create default settings if none exist
        const { data: newSettings, error: createError } = await supabase
          .from('negotiation_settings')
          .insert({
            user_id: user.id,
            ...DEFAULT_NEGOTIATION_SETTINGS
          })
          .select()
          .single();

        if (createError) throw createError;
        setSettings(newSettings as NegotiationSettings);
      }
    } catch (error: any) {
      logError('Error fetching negotiation settings:', error);
      if (error instanceof Error && error.message.toLowerCase().includes('failed to fetch')) {
        toast({
          title: "Connection lost",
          description: "Failed to load your negotiation settings.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Error loading negotiation settings",
          description: "Failed to load your negotiation settings. Using defaults.",
          variant: "destructive",
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const updateSettings = async (updates: Partial<NegotiationSettings>) => {
    if (!user || !settings) return;

    if (!navigator.onLine) {
      toast({
        title: "Connection lost",
        description: "Save will retry when online",
        variant: "destructive",
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('negotiation_settings')
        .update(updates)
        .eq('user_id', user.id);

      if (error) throw error;

      setSettings({ ...settings, ...updates });

      toast({
        title: "Settings saved",
        description: "Your negotiation settings have been updated.",
      });
    } catch (error: any) {
      logError('Error updating negotiation settings:', error);
      if (error instanceof Error && error.message.toLowerCase().includes('failed to fetch')) {
        toast({
          title: "Connection lost",
          description: "Save will retry when online",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Error saving settings",
          description: error.message || "Failed to save your negotiation settings.",
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