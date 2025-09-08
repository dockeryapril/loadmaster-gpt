import { useMemo } from 'react';
import { useEquipment } from '@/hooks/useEquipment';
import { useSupabaseSettings } from '@/hooks/useSupabaseSettings';
import { calculateFuelCost, getEffectiveMPG, getEffectiveRPMTargets } from '@/utils/equipmentDefaults';
import { calculateLoadQuality, generateSmartTags } from '@/types/load';
import type { Equipment } from '@/types/equipment';
import type { Load, LoadCalculationResult } from '@/types/load';

interface UseEquipmentAwareCalculationsProps {
  load?: Partial<Load>;
  equipment?: Equipment;
}

export function useEquipmentAwareCalculations({ load, equipment: providedEquipment }: UseEquipmentAwareCalculationsProps = {}) {
  const { equipment: defaultEquipment } = useEquipment();
  const { settings } = useSupabaseSettings();

  const calculations = useMemo(() => {
    if (!load?.miles || !load?.rate) return null;

    const activeEquipment = providedEquipment || load.equipment || defaultEquipment || 'cargo_van';
    const effectiveMPG = getEffectiveMPG(activeEquipment, settings);
    const effectiveRPMTargets = getEffectiveRPMTargets(activeEquipment, settings);

    // Calculate fuel cost using equipment-specific MPG
    const fuelCost = calculateFuelCost(load.miles, activeEquipment, settings);
    
    // Calculate business costs impact
    const revenueSplit = settings.revenueSplitPercentage || 100;
    const weeklyCosts = settings.weeklyFixedCosts || 0;
    const estimatedWeeklyMiles = 2500; // Industry standard
    const weeklyFixedCostPerMile = weeklyCosts / estimatedWeeklyMiles;
    
    // Calculate net rate (revenue after business costs)
    const grossRevenue = load.rate + (load.fsc || 0);
    const afterSplitRevenue = grossRevenue * (revenueSplit / 100);
    const netRevenue = afterSplitRevenue - (weeklyFixedCostPerMile * load.miles);
    const netRate = netRevenue - (load.tolls || 0) - fuelCost;
    const rpm = netRate / load.miles;
    
    // Calculate quality using equipment-specific thresholds
    const qualityFromEquipment = (() => {
      if (rpm >= effectiveRPMTargets.green) return 'excellent';
      if (rpm >= effectiveRPMTargets.yellow) return 'good'; 
      if (rpm >= effectiveRPMTargets.red) return 'fair';
      return 'poor';
    })();
    
    // Fallback to legacy quality calculation for comparison
    const legacyQuality = calculateLoadQuality(rpm, settings);
    
    // Use equipment-specific quality if smart defaults are enabled
    const quality = settings.useEquipmentDefaults ? qualityFromEquipment : legacyQuality;
    
    const result: LoadCalculationResult = {
      rpm,
      profit: netRate, // Now includes business setup costs
      totalMiles: load.miles + (load.deadheadMiles || 0),
      netRate,
      quality,
      weightImpact: (() => {
        if (!load.weight) return 'light';
        const weightLimit = settings.weightLimit || 80000;
        if (load.weight <= 25000) return 'light';
        if (load.weight <= 45000) return 'medium';
        if (load.weight <= weightLimit) return 'heavy';
        return 'overweight';
      })(),
      tags: generateSmartTags({ ...load, rpm, quality }, settings)
    };

    return {
      ...result,
      activeEquipment,
      effectiveMPG,
      effectiveRPMTargets,
      fuelCost,
      usingEquipmentDefaults: settings.useEquipmentDefaults
    };
  }, [load, providedEquipment, defaultEquipment, settings]);

  return calculations;
}

/**
 * Hook for calculating equipment-aware fuel costs
 */
export function useEquipmentFuelCost(miles?: number, equipment?: Equipment) {
  const { equipment: defaultEquipment } = useEquipment();
  const { settings } = useSupabaseSettings();

  return useMemo(() => {
    if (!miles) return 0;
    const activeEquipment = equipment || defaultEquipment || 'cargo_van';
    return calculateFuelCost(miles, activeEquipment, settings);
  }, [miles, equipment, defaultEquipment, settings]);
}

/**
 * Hook for getting effective equipment settings
 */
export function useEquipmentSettings(equipment?: Equipment) {
  const { equipment: defaultEquipment } = useEquipment();
  const { settings } = useSupabaseSettings();

  return useMemo(() => {
    const activeEquipment = equipment || defaultEquipment || 'cargo_van';
    
    return {
      equipment: activeEquipment,
      mpg: getEffectiveMPG(activeEquipment, settings),
      rpmTargets: getEffectiveRPMTargets(activeEquipment, settings),
      usingDefaults: settings.useEquipmentDefaults,
      settings
    };
  }, [equipment, defaultEquipment, settings]);
}