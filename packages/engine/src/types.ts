import type { Equipment, FlatbedSubtype, EquipmentProfile, SurchargePrefs, RpmTargets } from './equipmentProfiles';

export interface LoadFields {
  brokerName?: string; pickup?: string; delivery?: string;
  distanceMi: number; deadheadMi?: number; pickupAt?: string;
  weightLbs?: number; widthFt?: number; heightFt?: number; stops?: number;
  tarp?: boolean; jobsite?: boolean; itemType?: string;
  offerFlat: number; equipment: Equipment; equipmentSubtype?: FlatbedSubtype;
}

export interface CalcResult {
  baseRpm: number;
  surcharges: {
    tarp: number; heavyPerMile: number; oversizeWidth: number; oversizeHeight: number;
    multiStop: number; rush: number; access: number; securement: number;
  };
  negotiation: { anchor: number; target: number; floor: number };
  resultColor: 'red' | 'yellow' | 'green';
}

export interface NegotiationMargins { anchorPct: number; targetPct: number; floorPct: number; }
export { Equipment, FlatbedSubtype, EquipmentProfile, SurchargePrefs, RpmTargets };
