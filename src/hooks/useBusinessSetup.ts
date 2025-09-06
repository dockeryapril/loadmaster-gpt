import { useState, useEffect } from 'react';
import { supabase } from '@loadmaster/api';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/ui/use-toast';
import { BusinessSetup, calculateCompletionPercentage } from '@/types/businessSetup';
import { BusinessSetupProfile, industryBenchmarks } from '@/types/businessSetupProfiles';
import { logError } from '@/utils/errorLogger';

export const useBusinessSetup = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [setup, setSetup] = useState<BusinessSetup | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const fetchSetup = async () => {
    if (!user?.id) return;
    if (!navigator.onLine) {
      toast({
        title: "Connection lost",
        description: "Failed to load business setup",
        variant: "destructive",
      });
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('business_setup')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) {
        logError('Error fetching business setup:', error);
        toast({
          title: "Error",
          description: "Failed to load business setup",
          variant: "destructive",
        });
        return;
      }

      setSetup(data as BusinessSetup | null);
    } catch (error: any) {
      logError('Unexpected error:', error);
      if (error instanceof Error && error.message.toLowerCase().includes('failed to fetch')) {
        toast({
          title: "Connection lost",
          description: "Failed to load business setup",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Error",
          description: "An unexpected error occurred",
          variant: "destructive",
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const saveSetup = async (setupData: Partial<BusinessSetup>) => {
    if (!user?.id) return;

    if (!navigator.onLine) {
      toast({
        title: "Connection lost",
        description: "Save will retry when online",
        variant: "destructive",
      });
      return false;
    }

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
        logError('Error saving business setup:', error);
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
    } catch (error: any) {
      logError('Unexpected error:', error);
      if (error instanceof Error && error.message.toLowerCase().includes('failed to fetch')) {
        toast({
          title: "Connection lost",
          description: "Save will retry when online",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Error",
          description: "An unexpected error occurred",
          variant: "destructive",
        });
      }
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

  // Apply industry profile to setup
  const applyProfile = async (profile: BusinessSetupProfile): Promise<boolean> => {
    if (!user?.id) return false;

    const profileSetup: Partial<BusinessSetup> = {
      ...profile.setup,
      user_id: user.id,
      notes: `Applied industry profile: ${profile.name}. ${profile.setup.notes || ''}`,
      special_arrangements: profile.description
    };

    const success = await saveSetup(profileSetup);
    
    if (success) {
      toast({
        title: "Profile Applied",
        description: `Successfully applied ${profile.name} setup. You can customize any values as needed.`,
      });
    }
    
    return success;
  };

  // Validate setup against industry benchmarks
  const validateSetup = (setup: Partial<BusinessSetup>): { isValid: boolean; warnings: string[] } => {
    const warnings: string[] = [];

    // Revenue split validation
    if (setup.revenue_split_percentage) {
      const split = setup.revenue_split_percentage;
      if (split < 20 || split > 98) {
        warnings.push(`Revenue split of ${split}% is outside typical industry range (20-98%)`);
      }
    }

    // Detention pay validation
    if (setup.detention_pay_rate) {
      const { min, max } = industryBenchmarks.detentionPay;
      if (setup.detention_pay_rate < min || setup.detention_pay_rate > max) {
        warnings.push(`Detention pay of $${setup.detention_pay_rate}/hr is outside typical range ($${min}-$${max}/hr)`);
      }
    }

    // Admin fees validation
    if (setup.admin_fee_percentage) {
      const { max } = industryBenchmarks.adminFees.percentage;
      if (setup.admin_fee_percentage > max) {
        warnings.push(`Admin fee of ${setup.admin_fee_percentage}% is higher than typical industry maximum (${max}%)`);
      }
    }

    return {
      isValid: warnings.length === 0,
      warnings
    };
  };

  // AI-powered setup suggestions based on existing load data
  const generateSetupSuggestions = async () => {
    if (!user?.id) return null;

    if (!navigator.onLine) {
      toast({
        title: "Connection lost",
        description: "Unable to generate suggestions while offline",
        variant: "destructive",
      });
      return null;
    }

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
    } catch (error: any) {
      logError('Error generating suggestions:', error);
      if (error instanceof Error && error.message.toLowerCase().includes('failed to fetch')) {
        toast({
          title: "Connection lost",
          description: "Unable to generate suggestions while offline",
          variant: "destructive",
        });
      }
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
    applyProfile,
    validateSetup,
  };
};