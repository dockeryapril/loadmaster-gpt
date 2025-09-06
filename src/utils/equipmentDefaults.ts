import type { Equipment } from '@/types/equipment';
import type { UserSettings } from '@/types/load';
import { getEquipmentMPG, getEquipmentRPMTargets } from '../../packages/engine/src/equipmentProfiles';

/**
 * Get the effective MPG for a given equipment type
 * Uses cascading priority: User Override > Equipment Default > Legacy Fallback
 */
export function getEffectiveMPG(equipment: Equipment, settings: UserSettings): number {
  // 1. Check for user-specific override
  if (settings.equipmentMpgOverrides?.[equipment]) {
    return settings.equipmentMpgOverrides[equipment]!;
  }
  
  // 2. Use equipment-specific default if enabled
  if (settings.useEquipmentDefaults) {
    return getEquipmentMPG(equipment);
  }
  
  // 3. Fallback to legacy setting
  return settings.mpg || 6.5;
}

/**
 * Get the effective RPM targets for a given equipment type
 * Uses cascading priority: User Override > Equipment Default > Legacy Fallback
 */
export function getEffectiveRPMTargets(equipment: Equipment, settings: UserSettings): { green: number; yellow: number; red: number } {
  // 1. Check for user-specific override
  if (settings.equipmentRpmOverrides?.[equipment]) {
    return settings.equipmentRpmOverrides[equipment]!;
  }
  
  // 2. Use equipment-specific default if enabled
  if (settings.useEquipmentDefaults) {
    return getEquipmentRPMTargets(equipment);
  }
  
  // 3. Fallback to legacy RPM thresholds mapped to equipment default structure
  return {
    green: settings.rpmThresholds.excellent,
    yellow: settings.rpmThresholds.good,
    red: settings.rpmThresholds.fair
  };
}

/**
 * Calculate fuel cost for a load using equipment-aware defaults
 */
export function calculateFuelCost(miles: number, equipment: Equipment, settings: UserSettings): number {
  if (!settings.enableFuelCostTracking) return 0;
  
  const mpg = getEffectiveMPG(equipment, settings);
  const gallonsNeeded = miles / mpg;
  return gallonsNeeded * settings.fuelPrice;
}

/**
 * Get industry benchmark context for UI display
 */
export function getIndustryContext(equipment: Equipment) {
  const defaults = getEquipmentRPMTargets(equipment);
  const mpg = getEquipmentMPG(equipment);
  
  return {
    marketAverageRPM: defaults.yellow,
    recommendedMPG: mpg,
    equipmentType: equipment.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())
  };
}