import type { Equipment } from '@/types/mvp';

export interface VehiclePreset {
  mpg: number;
  variableCPM: number;
  fixedPerDay: number;
}

export interface VehicleDefaults {
  gas: VehiclePreset;
  diesel: VehiclePreset;
}

/**
 * SmartHop industry presets for 2024-2025
 * Based on real-world market data for different equipment and fuel types
 */
export const smartHopDefaults: Record<Equipment, VehicleDefaults> = {
  cargo_van: {
    gas: { mpg: 15, variableCPM: 0.40, fixedPerDay: 150 },
    diesel: { mpg: 18, variableCPM: 0.40, fixedPerDay: 150 }
  },
  hotshot: {
    gas: { mpg: 8, variableCPM: 0.45, fixedPerDay: 180 },
    diesel: { mpg: 12, variableCPM: 0.45, fixedPerDay: 180 }
  },
  straight_truck: {
    gas: { mpg: 7, variableCPM: 0.50, fixedPerDay: 200 },
    diesel: { mpg: 9, variableCPM: 0.50, fixedPerDay: 200 }
  }
};

/**
 * Get preset values for a specific equipment and fuel type
 */
export function getPresetValues(equipment: Equipment, fuelType: 'gas' | 'diesel'): VehiclePreset {
  return smartHopDefaults[equipment][fuelType];
}
