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

  const fetchSettings = async (retryCount = 0) => {
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

      if (error) {
        // Check for JWT expiration
        if (error.message?.includes('JWT expired') || error.message?.includes('PGRST303')) {
          console.log('🔄 JWT expired, attempting to refresh session...');
          
          if (retryCount < 2) {
            // Try to refresh the session
            const { error: refreshError } = await supabase.auth.refreshSession();
            
            if (!refreshError) {
              // Retry the request with refreshed token
              console.log('✅ Session refreshed, retrying negotiation settings fetch...');
              return fetchSettings(retryCount + 1);
            } else {
              console.error('❌ Failed to refresh session:', refreshError);
              logError('Failed to refresh session:', refreshError);
            }
          } else {
            console.error('❌ Max retries exceeded for negotiation settings fetch');
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
        setSettings(data as NegotiationSettings);
        console.log('✅ Negotiation settings loaded successfully');
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
        console.log('✅ Created default negotiation settings');
      }
    } catch (error: any) {
      logError('Error fetching negotiation settings:', error);
      
      if (error instanceof Error && (
        error.message.toLowerCase().includes('failed to fetch') ||
        error.message.toLowerCase().includes('network')
      )) {
        toast({
          title: "Connection lost",
          description: "Failed to load your negotiation settings.",
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
          title: "Error loading negotiation settings",
          description: "Failed to load your negotiation settings. Using defaults.",
          variant: "destructive",
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const updateSettings = async (updates: Partial<NegotiationSettings>, retryCount = 0) => {
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

      if (error) {
        // Check for JWT expiration
        if (error.message?.includes('JWT expired') || error.message?.includes('PGRST303')) {
          console.log('🔄 JWT expired during negotiation settings update, attempting to refresh session...');
          
          if (retryCount < 2) {
            // Try to refresh the session
            const { error: refreshError } = await supabase.auth.refreshSession();
            
            if (!refreshError) {
              // Retry the request with refreshed token
              console.log('✅ Session refreshed, retrying negotiation settings update...');
              return updateSettings(updates, retryCount + 1);
            } else {
              console.error('❌ Failed to refresh session during negotiation settings update:', refreshError);
              logError('Failed to refresh session during negotiation settings update:', refreshError);
            }
          } else {
            console.error('❌ Max retries exceeded for negotiation settings update');
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

      setSettings({ ...settings, ...updates });

      toast({
        title: "Settings saved",
        description: "Your negotiation settings have been updated.",
      });
    } catch (error: any) {
      logError('Error updating negotiation settings:', error);
      
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