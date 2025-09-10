import type { Equipment, EquipmentProfile, SurchargePrefs, RpmTargets } from './equipmentProfiles';

export interface LoadFields {
  brokerName?: string; pickup?: string; delivery?: string;
  distanceMi: number; deadheadMi?: number; pickupAt?: string;
  weightLbs?: number; widthFt?: number; heightFt?: number; stops?: number;
  tarp?: boolean; jobsite?: boolean; itemType?: string; detentionHours?: number;
  weekend?: boolean; afterHours?: boolean; inside?: boolean; residential?: boolean;
  liftgate?: boolean; palletJack?: boolean;
  detentionPay?: number; lumperPay?: number; layoverPay?: number; hazmatPay?: number;
  offerFlat: number; equipment: Equipment;
}

export interface CalcResult {
  baseRpm: number;
  surcharges: {
    tarp: number; heavyPerMile: number; oversizeWidth: number; oversizeHeight: number;
    multiStop: number; rush: number; weekend: number; afterHours: number;
    inside: number; residential: number; liftgate: number; palletJack: number;
    detentionPerHour: number; access: number; securement: number;
  };
  negotiation: { anchor: number; target: number; floor: number };
  resultColor: 'red' | 'yellow' | 'green';
}

export interface NegotiationMargins { anchorPct: number; targetPct: number; floorPct: number; }
export { Equipment, EquipmentProfile, SurchargePrefs, RpmTargets };
