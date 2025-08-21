export type Equipment = 'cargo_van' | 'straight_truck' | 'hotshot';

export interface RpmTargets { green: number; yellow: number; red: number; }
export interface SurchargePrefs {
  tarp: number; heavyPerMile: number; heavyThresholdLbs: number;
  oversizeWidth: number; oversizeHeight: number; multiStop: number;
  rush: number; weekend: number; afterHours: number; inside: number;
  residential: number; liftgate: number; palletJack: number;
  detentionPerHour: number; access: number; securement: number;
}
export interface EquipmentProfile {
  equipment: Equipment;
  rpmTargets: RpmTargets;
  surcharges: SurchargePrefs;
}

export const hotshotProfile: EquipmentProfile = {
  equipment: 'hotshot',
  rpmTargets: { green: 2.75, yellow: 2.40, red: 2.10 },
  surcharges: {
    tarp: 60, heavyPerMile: 0.06, heavyThresholdLbs: 18000,
    oversizeWidth: 200, oversizeHeight: 150, multiStop: 60,
    rush: 175, weekend: 0, afterHours: 0, inside: 0,
    residential: 0, liftgate: 0, palletJack: 0,
    detentionPerHour: 0, access: 0, securement: 60
  }
};

export const cargoVanProfile: EquipmentProfile = {
  equipment: 'cargo_van',
  rpmTargets: { green: 1.75, yellow: 1.50, red: 1.25 },
  surcharges: {
    tarp: 0, heavyPerMile: 0.05, heavyThresholdLbs: 2500,
    oversizeWidth: 0, oversizeHeight: 0, multiStop: 30,
    rush: 50, weekend: 50, afterHours: 50, inside: 50,
    residential: 50, liftgate: 0, palletJack: 0,
    detentionPerHour: 0, access: 0, securement: 0
  }
};

export const straightTruckProfile: EquipmentProfile = {
  equipment: 'straight_truck',
  rpmTargets: { green: 2.25, yellow: 2.00, red: 1.75 },
  surcharges: {
    tarp: 0, heavyPerMile: 0.07, heavyThresholdLbs: 20000,
    oversizeWidth: 0, oversizeHeight: 0, multiStop: 50,
    rush: 125, weekend: 75, afterHours: 0, inside: 50,
    residential: 75, liftgate: 75, palletJack: 50,
    detentionPerHour: 0, access: 0, securement: 0
  }
};

export function selectProfile(equipment: Equipment): EquipmentProfile {
  if (equipment === 'cargo_van') return cargoVanProfile;
  if (equipment === 'straight_truck') return straightTruckProfile;
  if (equipment === 'hotshot') return hotshotProfile;
  return hotshotProfile; // default
}
