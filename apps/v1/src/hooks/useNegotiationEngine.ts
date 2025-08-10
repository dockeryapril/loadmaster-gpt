import { useMemo } from 'react';
import { useSupabaseSettings } from '@/hooks/useSupabaseSettings';
import { useBusinessSetup } from '@/hooks/useBusinessSetup';
import { useNegotiationSettings } from '@/hooks/useNegotiationSettings';
import { NegotiationCalculation } from '@/types/negotiation';
import { Load } from '@/types/load';
// Temporarily inline the computation until workspace is set up
// import { computeNegotiation } from '@loadmaster/engine';

interface UseNegotiationEngineProps {
  load: Partial<Load>;
  laneBaselineRpm?: number;
}

export function useNegotiationEngine({ load, laneBaselineRpm }: UseNegotiationEngineProps) {
  const { settings: userSettings } = useSupabaseSettings();
  const { setup: businessSetup } = useBusinessSetup();
  const { settings: negotiationSettings } = useNegotiationSettings();

  const calculation = useMemo((): NegotiationCalculation | null => {
    if (!userSettings || !negotiationSettings || !load.miles || !load.rate) {
      return null;
    }

    const loadData = {
      miles: load.miles,
      rate: load.rate,
      weight: load.weight,
      notes: load.notes
    };

    // Temporarily use existing logic until workspace is configured
    let baseRpm = userSettings.rpmThresholds.excellent;
    if (laneBaselineRpm && laneBaselineRpm > baseRpm) {
      baseRpm = laneBaselineRpm;
    }
    let targetRate = baseRpm * load.miles;
    const premiumsApplied: string[] = [];

    // Apply premiums (simplified for now)
    if (negotiationSettings.rush_enabled) {
      if (negotiationSettings.rush_method === 'percentage') {
        targetRate *= 1 + (negotiationSettings.rush_value / 100);
      } else {
        targetRate += negotiationSettings.rush_value * load.miles;
      }
      premiumsApplied.push(`Rush (+${negotiationSettings.rush_value}${negotiationSettings.rush_method === 'percentage' ? '%' : '/mile'})`);
    }

    const anchorRate = targetRate * (1 + negotiationSettings.anchor_offset);
    const floorRate = targetRate * (1 - negotiationSettings.floor_offset);

    return {
      anchor_rate: Math.round(anchorRate),
      target_rate: Math.round(targetRate),
      floor_rate: Math.round(floorRate),
      base_rpm: baseRpm,
      premiums_applied: premiumsApplied,
      lane_baseline_rpm: laneBaselineRpm,
      suggested_strategy: 'standard',
    };
  }, [userSettings, negotiationSettings, businessSetup, load, laneBaselineRpm]);

  return {
    calculation,
    isReady: !!calculation,
  };
}