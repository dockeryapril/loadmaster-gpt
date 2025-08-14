export type Equipment = 'flatbed' | 'cargo_van' | 'straight_truck' | 'tractor';
export type FlatbedSubtype = 'class8_flatbed' | 'hotshot';

export interface RpmTargets {
  green: number;
  yellow: number;
  red: number;
}

export interface SurchargePrefs {
  tarp: number;
  heavyPerMile: number;
  heavyThresholdLbs: number;
  oversizeWidth: number;
  oversizeHeight: number;
  multiStop: number; // per extra stop
  rush: number;
  access: number;
  securement: number;
}

export interface EquipmentProfile {
  equipment: Equipment;
  subtype?: FlatbedSubtype;
  rpmTargets: RpmTargets;
  surcharges: SurchargePrefs;
}

export const class8FlatbedProfile: EquipmentProfile = {
  equipment: 'flatbed',
  subtype: 'class8_flatbed',
  rpmTargets: { green: 2.50, yellow: 2.25, red: 2.00 },
  surcharges: {
    tarp: 75,
    heavyPerMile: 0.08,
    heavyThresholdLbs: 48000,
    oversizeWidth: 225,
    oversizeHeight: 225,
    multiStop: 60,
    rush: 150,
    access: 0,
    securement: 75
  }
};

export const hotshotProfile: EquipmentProfile = {
  equipment: 'flatbed',
  subtype: 'hotshot',
  rpmTargets: { green: 2.75, yellow: 2.40, red: 2.10 },
  surcharges: {
    tarp: 60,                 // smaller tarps typical
    heavyPerMile: 0.06,       // lower GVWR → earlier heavy adder
    heavyThresholdLbs: 18000, // hotshot threshold
    oversizeWidth: 200,
    oversizeHeight: 150,
    multiStop: 60,
    rush: 175,                // more rush/expedite work
    access: 0,
    securement: 60
  }
};

export function selectProfile(equipment: Equipment, subtype?: FlatbedSubtype): EquipmentProfile {
  if (equipment === 'flatbed' && subtype === 'hotshot') return hotshotProfile;
  return class8FlatbedProfile; // default to class-8 flatbed for MVP
}
