import type { CompensationProfile } from '@/types/compensation';

export interface DriverNegotiationTargets {
  negotiable: boolean;
  reason?: string;
  anchor: number;
  target: number;
  floor: number;
}

function roundDollar(value: number) {
  return Math.max(0, Math.round(value));
}

function requiredTruckRate(
  desiredDriverNet: number,
  driverExpenses: number,
  profile: CompensationProfile,
  fsc: number,
): number | null {
  const desiredPay = desiredDriverNet + driverExpenses;

  if (profile.type === 'percentage') {
    const pct = profile.percentage / 100;
    if (pct <= 0) return null;
    const fscInBase = profile.includeFscInPercentage ? fsc : 0;
    const fixedExtras = profile.deadheadFlatPay + profile.deadheadFsc;
    return Math.max(0, (desiredPay - fixedExtras) / pct - fscInBase);
  }

  if (profile.type === 'truck') return desiredPay - fsc;
  return null;
}

export function calculateDriverNegotiationTargets(
  profile: CompensationProfile,
  currentDriverNet: number,
  driverExpenses: number,
  currentTruckRate: number,
  fsc: number,
  margins = { anchorPct: 0.15, targetPct: 0.08, floorPct: 0.02 },
): DriverNegotiationTargets {
  if (profile.type === 'per_mile') {
    return { negotiable: false, reason: 'Your pay is set by loaded/deadhead mile rates, so changing the truck linehaul does not change your pay.', anchor: 0, target: 0, floor: 0 };
  }
  if (profile.type === 'flat') {
    return { negotiable: false, reason: 'Your pay is a flat amount, so changing the truck linehaul does not change your pay.', anchor: 0, target: 0, floor: 0 };
  }

  const floorNet = currentDriverNet * (1 + margins.floorPct);
  const targetNet = currentDriverNet * (1 + margins.targetPct);
  const anchorNet = currentDriverNet * (1 + margins.anchorPct);
  const floor = requiredTruckRate(floorNet, driverExpenses, profile, fsc);
  const target = requiredTruckRate(targetNet, driverExpenses, profile, fsc);
  const anchor = requiredTruckRate(anchorNet, driverExpenses, profile, fsc);
  if (floor === null || target === null || anchor === null) {
    return { negotiable: false, reason: 'Add a valid compensation percentage before building a linehaul counter.', anchor: 0, target: 0, floor: 0 };
  }

  return {
    negotiable: true,
    floor: roundDollar(Math.max(currentTruckRate, floor)),
    target: roundDollar(Math.max(currentTruckRate, target)),
    anchor: roundDollar(Math.max(currentTruckRate, anchor)),
  };
}
