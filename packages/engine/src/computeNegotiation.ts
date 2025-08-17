import { selectProfile, EquipmentProfile } from './equipmentProfiles';
import type { LoadFields, CalcResult, NegotiationMargins } from './types';

function round2(n: number): number { return Math.round((n + Number.EPSILON) * 100) / 100; }
function isRush(pickupAt?: string, now = new Date()): boolean {
  if (!pickupAt) return false;
  const diffHrs = (new Date(pickupAt).getTime() - now.getTime()) / 36e5;
  return diffHrs >= 0 && diffHrs <= 6;
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

  // Shared adders across all equipment types
  const rush = isRush(fields.pickupAt) ? p.surcharges.rush : 0;
  const multiStop = fields.stops && fields.stops > 1 ? (fields.stops - 1) * p.surcharges.multiStop : 0;
  const access = fields.jobsite ? p.surcharges.access : 0;
  const detentionPerHour = fields.detentionHours ? fields.detentionHours * p.surcharges.detentionPerHour : 0;

  // Flatbed / Hotshot specific adders
  const isFlatbed = p.equipment === 'flatbed';
  const tarp = isFlatbed && fields.tarp ? p.surcharges.tarp : 0;
  const oversizeWidth =
    isFlatbed && fields.widthFt && fields.widthFt > 8.5 ? p.surcharges.oversizeWidth : 0;
  const oversizeHeight =
    isFlatbed && fields.heightFt && fields.heightFt > 13.5 ? p.surcharges.oversizeHeight : 0;
  const securement = isFlatbed && isSecurementIntensive(fields.itemType) ? p.surcharges.securement : 0;
  const heavyPerMile =
    isFlatbed && fields.weightLbs && fields.weightLbs >= p.surcharges.heavyThresholdLbs
      ? p.surcharges.heavyPerMile
      : 0;

  // Cargo van specific adders
  const isCargoVan = p.equipment === 'cargo_van';
  const weekend = isCargoVan && fields.weekend ? p.surcharges.weekend : 0;
  const afterHours = isCargoVan && fields.afterHours ? p.surcharges.afterHours : 0;

  // Straight truck specific adders
  const isStraight = p.equipment === 'straight_truck';
  const liftgate = isStraight && fields.liftgate ? p.surcharges.liftgate : 0;
  const palletJack = isStraight && fields.palletJack ? p.surcharges.palletJack : 0;

  // Inside/residential apply to cargo van & straight truck
  const inside = (isCargoVan || isStraight) && fields.inside ? p.surcharges.inside : 0;
  const residential = (isCargoVan || isStraight) && fields.residential ? p.surcharges.residential : 0;

  const sur = {
    tarp,
    heavyPerMile,
    oversizeWidth,
    oversizeHeight,
    multiStop,
    rush,
    weekend,
    afterHours,
    inside,
    residential,
    liftgate,
    palletJack,
    detentionPerHour,
    access,
    securement
  } as const;

  const flatAdder =
    rush +
    multiStop +
    access +
    detentionPerHour +
    tarp +
    oversizeWidth +
    oversizeHeight +
    securement +
    weekend +
    afterHours +
    inside +
    residential +
    liftgate +
    palletJack;

  const heavyAdder = heavyPerMile * miles;
  const targetTotal = baseFlat + flatAdder + heavyAdder;

  const anchor = Math.round(targetTotal * (1 + margins.anchorPct));
  const target = Math.round(targetTotal * (1 + margins.targetPct));
  const floor  = Math.round(targetTotal * (1 + margins.floorPct));

  return { baseRpm, surcharges: sur, negotiation: { anchor, target, floor }, resultColor: colorFromRpm(baseRpm, p) };
}
