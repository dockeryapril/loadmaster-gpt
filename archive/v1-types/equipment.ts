export type Equipment = 'cargo_van' | 'straight_truck' | 'hotshot';

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
  weekend: number;
  afterHours: number;
  inside: number;
  residential: number;
  liftgate: number;
  palletJack: number;
  detentionPerHour: number;
  access: number;
  securement: number;
}

export interface EquipmentProfile {
  equipment: Equipment;
  rpmTargets: RpmTargets;
  surcharges: SurchargePrefs;
}
