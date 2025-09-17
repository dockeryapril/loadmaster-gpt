import { useState, useCallback } from 'react';
import { useNegotiationEngine } from './useNegotiationEngine';
import { Load } from '@/types/load';
import { EnhancedNegotiation, UnifiedNegotiationScripts } from '@/types/unifiedNegotiation';
import { Channel, Tone, Equipment } from '@/features/negotiation/templates';
import generateScripts from '@/features/negotiation/templates';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface UseUnifiedNegotiationProps {
  load: Partial<Load>;
  laneBaselineRpm?: number;
}

export function useUnifiedNegotiation({ load, laneBaselineRpm }: UseUnifiedNegotiationProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const { calculation, notes, resultColor, isReady } = useNegotiationEngine({ load, laneBaselineRpm });
  
  const [channel, setChannel] = useState<Channel>('text');
  const [tone, setTone] = useState<Tone>('professional');
  const [scripts, setScripts] = useState<UnifiedNegotiationScripts>({ ask: '', settle: '', bottom: '' });
  const [selectedStrategy, setSelectedStrategy] = useState<string>('standard');
  const [outcome, setOutcome] = useState<EnhancedNegotiation['outcome']>('pending');
  const [isLoading, setIsLoading] = useState(false);

  // Generate dynamic scripts based on rates and user preferences
  const generateDynamicScripts = useCallback(() => {
    if (!calculation || !load.miles) return { ask: '', settle: '', bottom: '' };

    const equipment = (load.equipment as Equipment) || 'cargo_van';
    const flags = {
      isRush: load.pickupAt ? new Date(load.pickupAt).getTime() - Date.now() < 6 * 60 * 60 * 1000 : false,
      tarpRequired: load.accessorials?.tarp || false,
      extraStops: load.stops || 0,
      palletJack: load.accessorials?.palletJack || false,
      liftGate: load.accessorials?.liftgate || false,
    };

    const newScripts = generateScripts({
      ask: calculation.anchor_rate,
      settle: calculation.target_rate,
      bottom: calculation.floor_rate,
      channel,
      tone,
      equipment,
      miles: load.miles,
      ...flags,
    });

    setScripts(newScripts);
    return newScripts;
  }, [calculation, load, channel, tone]);

  // Save negotiation with enhanced tracking
  const saveNegotiation = useCallback(async (
    finalRate?: number,
    rateTierAccepted?: 'ask' | 'settle' | 'bottom' | 'other',
    customMessage?: string
  ): Promise<void> => {
    if (!user || !calculation || !load.id) {
      toast({ title: 'Error', description: 'Missing required data to save negotiation', variant: 'destructive' });
      return;
    }

    setIsLoading(true);
    
    try {
      const currentScripts = scripts.ask ? scripts : generateDynamicScripts();
      const finalRpm = finalRate && load.miles ? finalRate / load.miles : undefined;
      
      const negotiationData: Omit<EnhancedNegotiation, 'id' | 'created_at' | 'updated_at'> = {
        user_id: user.id,
        load_id: load.id,
        original_offer: load.rate || 0,
        target_rate: calculation.target_rate,
        anchor_rate: calculation.anchor_rate,
        floor_rate: calculation.floor_rate,
        final_rate: finalRate,
        final_rpm: finalRpm,
        strategy_used: selectedStrategy,
        outcome,
        iterations: 1,
        message_sent: customMessage || currentScripts[rateTierAccepted || 'ask'],
        channel,
        tone,
        negotiation_scripts: currentScripts,
        rate_tier_accepted: rateTierAccepted,
      };

      const { error } = await supabase
        .from('negotiations')
        .insert([negotiationData]);

      if (error) throw error;

      toast({
        title: 'Negotiation saved',
        description: `Outcome recorded as ${outcome}${rateTierAccepted ? ` (${rateTierAccepted} rate)` : ''}`,
      });
    } catch (error) {
      console.error('Error saving negotiation:', error);
      toast({
        title: 'Error',
        description: 'Failed to save negotiation',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [user, calculation, load, scripts, selectedStrategy, outcome, channel, tone, generateDynamicScripts, toast]);

  // Track outcome with rate tier
  const trackOutcome = useCallback((
    newOutcome: EnhancedNegotiation['outcome'],
    rateTierAccepted?: 'ask' | 'settle' | 'bottom' | 'other',
    finalRate?: number
  ) => {
    setOutcome(newOutcome);
    if (newOutcome !== 'pending') {
      saveNegotiation(finalRate, rateTierAccepted);
    }
  }, [saveNegotiation]);

  return {
    // Core negotiation data
    calculation,
    notes,
    resultColor,
    isReady,
    
    // Dynamic scripts
    scripts,
    generateDynamicScripts,
    
    // User preferences
    channel,
    setChannel,
    tone,
    setTone,
    
    // Strategy and outcome
    selectedStrategy,
    setSelectedStrategy,
    outcome,
    trackOutcome,
    
    // Persistence
    saveNegotiation,
    isLoading,
  };
}