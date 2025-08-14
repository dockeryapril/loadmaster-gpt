import { selectProfile, EquipmentProfile } from './equipmentProfiles';
import type { LoadFields, CalcResult, NegotiationMargins } from './types';

function round2(n: number): number { return Math.round((n + Number.EPSILON) * 100) / 100; }
function isRush(pickupAt?: string, now = new Date()): boolean {
  if (!pickupAt) return false;
  const diffHrs = (new Date(pickupAt).getTime() - now.getTime()) / 36e5;
  return diffHrs <= 6;
}
function isSecurementIntensive(itemType?: string): boolean {
  if (!itemType) return false;
  const s = itemType.toLowerCase();
  return ['coil','coils','steel coil','machinery','pipe','pipes','rebar','equipment','palletized steel'].some(k => s.includes(k));
}
function colorFromRpm(rpm: number, profile: EquipmentProfile): 'red' | 'yellow' | 'green' {
  const { red, yellow, green } = profile.rpmTargets;
  if (rpm < red) return 'red';
  if (rpm < yellow) return 'yellow';
  if (rpm >= green) return 'green';
  return 'yellow';
}

export function computeCalc(fields: LoadFields, margins: NegotiationMargins, profile?: EquipmentProfile): CalcResult {
  const p = profile ?? selectProfile(fields.equipment, fields.equipmentSubtype);
  const miles = Math.max(1, Number(fields.distanceMi || 0));
  const baseFlat = Number(fields.offerFlat || 0);
  const baseRpm = round2(baseFlat / miles);

  const sur = {
    tarp: fields.tarp ? p.surcharges.tarp : 0,
    heavyPerMile: fields.weightLbs && fields.weightLbs >= p.surcharges.heavyThresholdLbs ? p.surcharges.heavyPerMile : 0,
    oversizeWidth: fields.widthFt && fields.widthFt > 8.5 ? p.surcharges.oversizeWidth : 0,
    oversizeHeight: fields.heightFt && fields.heightFt > 13.5 ? p.surcharges.oversizeHeight : 0,
    multiStop: fields.stops && fields.stops > 1 ? (fields.stops - 1) * p.surcharges.multiStop : 0,
    rush: isRush(fields.pickupAt) ? p.surcharges.rush : 0,
    access: fields.jobsite ? p.surcharges.access : 0,
    securement: isSecurementIntensive(fields.itemType) ? p.surcharges.securement : 0
  };

  const flatAdder = sur.tarp + sur.oversizeWidth + sur.oversizeHeight + sur.multiStop + sur.rush + sur.access + sur.securement;
  const heavyAdder = sur.heavyPerMile * miles;
  const targetTotal = baseFlat + flatAdder + heavyAdder;

  const anchor = Math.round(targetTotal * (1 + margins.anchorPct));
  const target = Math.round(targetTotal * (1 + margins.targetPct));
  const floor  = Math.round(targetTotal * (1 + margins.floorPct));

  return { baseRpm, surcharges: sur, negotiation: { anchor, target, floor }, resultColor: colorFromRpm(baseRpm, p) };
}
