export type Equipment = 'flatbed' | 'cargo_van' | 'straight_truck' | 'tractor';
export type FlatbedSubtype = 'class8_flatbed' | 'hotshot';

export interface RpmTargets { green: number; yellow: number; red: number; }
export interface SurchargePrefs {
  tarp: number; heavyPerMile: number; heavyThresholdLbs: number;
  oversizeWidth: number; oversizeHeight: number; multiStop: number;
  rush: number; access: number; securement: number;
}
export interface EquipmentProfile {
  equipment: Equipment; subtype?: FlatbedSubtype;
  rpmTargets: RpmTargets; surcharges: SurchargePrefs;
}

export const class8FlatbedProfile: EquipmentProfile = {
  equipment: 'flatbed',
  subtype: 'class8_flatbed',
  rpmTargets: { green: 2.50, yellow: 2.25, red: 2.00 },
  surcharges: {
    tarp: 75, heavyPerMile: 0.08, heavyThresholdLbs: 48000,
    oversizeWidth: 225, oversizeHeight: 225, multiStop: 60,
    rush: 150, access: 0, securement: 75
  }
};

export const hotshotProfile: EquipmentProfile = {
  equipment: 'flatbed',
  subtype: 'hotshot',
  rpmTargets: { green: 2.75, yellow: 2.40, red: 2.10 },
  surcharges: {
    tarp: 60, heavyPerMile: 0.06, heavyThresholdLbs: 18000,
    oversizeWidth: 200, oversizeHeight: 150, multiStop: 60,
    rush: 175, access: 0, securement: 60
  }
};

export const cargoVanProfile: EquipmentProfile = {
  equipment: 'cargo_van',
  rpmTargets: { green: 1.75, yellow: 1.50, red: 1.25 },
  surcharges: {
    tarp: 0, heavyPerMile: 0.05, heavyThresholdLbs: 2500,
    oversizeWidth: 0, oversizeHeight: 0, multiStop: 30,
    rush: 50, access: 0, securement: 0
  }
};

export const straightTruckProfile: EquipmentProfile = {
  equipment: 'straight_truck',
  rpmTargets: { green: 2.25, yellow: 2.00, red: 1.75 },
  surcharges: {
    tarp: 0, heavyPerMile: 0.07, heavyThresholdLbs: 20000,
    oversizeWidth: 0, oversizeHeight: 0, multiStop: 50,
    rush: 125, access: 0, securement: 0
  }
};

export function selectProfile(equipment: Equipment, subtype?: FlatbedSubtype): EquipmentProfile {
  if (equipment === 'flatbed') {
    return subtype === 'hotshot' ? hotshotProfile : class8FlatbedProfile;
  }
  if (equipment === 'cargo_van') return cargoVanProfile;
  if (equipment === 'straight_truck') return straightTruckProfile;
  return hotshotProfile; // default
}
