import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/ui/use-toast';
import { BusinessSetup, calculateCompletionPercentage } from '@/types/businessSetup';

export const useBusinessSetup = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [setup, setSetup] = useState<BusinessSetup | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const fetchSetup = async () => {
    if (!user?.id) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('business_setup')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) {
        console.error('Error fetching business setup:', error);
        toast({
          title: "Error",
          description: "Failed to load business setup",
          variant: "destructive",
        });
        return;
      }

      setSetup(data as BusinessSetup | null);
    } catch (error) {
      console.error('Unexpected error:', error);
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const saveSetup = async (setupData: Partial<BusinessSetup>) => {
    if (!user?.id) return;

    try {
      setSaving(true);
      const completionPercentage = calculateCompletionPercentage(setupData);
      const isCompleted = completionPercentage === 100;

      const dataToSave = {
        ...setupData,
        user_id: user.id,
        setup_completed_at: isCompleted ? new Date().toISOString() : null,
      };

      const { data, error } = await supabase
        .from('business_setup')
        .upsert(dataToSave, { onConflict: 'user_id' })
        .select()
        .single();

      if (error) {
        console.error('Error saving business setup:', error);
        toast({
          title: "Error",
          description: "Failed to save business setup",
          variant: "destructive",
        });
        return false;
      }

      // Update user_settings completion tracking
      await supabase
        .from('user_settings')
        .update({
          business_setup_completed: isCompleted,
          business_setup_completed_at: isCompleted ? new Date().toISOString() : null,
          setup_completion_percentage: completionPercentage,
        })
        .eq('user_id', user.id);

      setSetup(data as BusinessSetup);
      
      if (isCompleted) {
        toast({
          title: "Setup Complete!",
          description: "Your business setup is now complete. Load calculations will be more accurate.",
        });
      } else {
        toast({
          title: "Progress Saved",
          description: `Setup is ${completionPercentage}% complete`,
        });
      }

      return true;
    } catch (error) {
      console.error('Unexpected error:', error);
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
      return false;
    } finally {
      setSaving(false);
    }
  };

  const updateSetup = async (updates: Partial<BusinessSetup>) => {
    if (!setup) return false;
    
    const updatedSetup = { ...setup, ...updates };
    return await saveSetup(updatedSetup);
  };

  const isSetupComplete = (): boolean => {
    if (!setup) return false;
    return calculateCompletionPercentage(setup) === 100;
  };

  const getCompletionPercentage = (): number => {
    if (!setup) return 0;
    return calculateCompletionPercentage(setup);
  };

  // AI-powered setup suggestions based on existing load data
  const generateSetupSuggestions = async () => {
    if (!user?.id) return null;

    try {
      // Fetch user's historical load data to analyze patterns
      const { data: loads, error } = await supabase
        .from('loads')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(20);

      if (error || !loads?.length) return null;

      // Analyze patterns to suggest setup values
      const suggestions: Partial<BusinessSetup> = {};

      // Analyze average FSC to rate ratios
      const loadsWithFSC = loads.filter(load => load.fsc && load.fsc > 0);
      if (loadsWithFSC.length > 0) {
        const avgFSCRatio = loadsWithFSC.reduce((sum, load) => 
          sum + (load.fsc / load.rate), 0) / loadsWithFSC.length;
        
        if (avgFSCRatio > 0.15) {
          suggestions.fsc_handling = 'separate_payment';
        }
      }

      // Analyze deadhead patterns
      const loadsWithDeadhead = loads.filter(load => load.deadhead_miles && load.deadhead_miles > 0);
      if (loadsWithDeadhead.length > loads.length * 0.7) {
        suggestions.deadhead_compensation_type = 'per_mile';
      }

      // Analyze RPM patterns to suggest revenue split
      const avgRPM = loads.reduce((sum, load) => sum + load.rpm, 0) / loads.length;
      if (avgRPM < 2.0) {
        suggestions.revenue_split_percentage = 75;
      } else if (avgRPM > 3.0) {
        suggestions.revenue_split_percentage = 85;
      }

      return suggestions;
    } catch (error) {
      console.error('Error generating suggestions:', error);
      return null;
    }
  };

  useEffect(() => {
    fetchSetup();
  }, [user?.id]);

  return {
    setup,
    loading,
    saving,
    saveSetup,
    updateSetup,
    refetch: fetchSetup,
    isSetupComplete,
    getCompletionPercentage,
    generateSetupSuggestions,
  };
};