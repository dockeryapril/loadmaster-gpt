import type { Equipment, FlatbedSubtype, EquipmentProfile, SurchargePrefs, RpmTargets } from './equipmentProfiles.js';

export interface LoadFields {
  brokerName?: string;
  pickup?: string;
  delivery?: string;
  distanceMi: number;
  deadheadMi?: number;
  pickupAt?: string; // ISO
  weightLbs?: number;
  widthFt?: number;
  heightFt?: number;
  stops?: number;
  tarp?: boolean;
  jobsite?: boolean;
  itemType?: string;
  offerFlat: number;
  equipment: Equipment;
  equipmentSubtype?: FlatbedSubtype;
}

export interface CalcResult {
  baseRpm: number;
  surcharges: {
    tarp: number;
    heavyPerMile: number; // rate per mile used (0 if none)
    oversizeWidth: number;
    oversizeHeight: number;
    multiStop: number;
    rush: number;
    access: number;
    securement: number;
  };
  negotiation: { anchor: number; target: number; floor: number };
  resultColor: 'red' | 'yellow' | 'green';
}

export interface NegotiationMargins {
  anchorPct: number; // e.g., 0.18
  targetPct: number; // e.g., 0.10
  floorPct: number;  // e.g., 0.00
}

export { Equipment, FlatbedSubtype, EquipmentProfile, SurchargePrefs, RpmTargets };
