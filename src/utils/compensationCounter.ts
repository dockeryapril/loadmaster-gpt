import type { CompensationProfile } from '@/types/compensation';
import type { CompensationTargets } from '@/types/driverProfile';

export type CounterLever = 'truck_rate' | 'percentage' | 'loaded_mile_rate' | 'deadhead_rate' | 'flat_pay';

export interface CompensationCounter {
  lever: CounterLever;
  label: string;
  current: number;
  target: number;
  message: string;
}

function roundCents(n: number) { return Math.round(n * 100) / 100; }
function money(n: number) { return '$' + roundCents(n).toFixed(2); }

export function buildCompensationCounter(
  profile: CompensationProfile,
  loadedMiles: number,
  deadheadMiles: number,
  currentTruckRate: number,
  targetTruckRate: number,
  targets?: Partial<CompensationTargets>,
): CompensationCounter {
  if (profile.type === 'per_mile') {
    if (deadheadMiles > 0 && profile.perDeadheadMile <= 0) {
      const target = targets?.targetDeadheadRate || profile.perLoadedMile;
      return {
        lever: 'deadhead_rate',
        label: 'Deadhead rate',
        current: profile.perDeadheadMile,
        target,
        message: `I can take this if the ${deadheadMiles} deadhead miles are paid at ${money(target)}/mi.`,
      };
    }
    const allInMiles = loadedMiles + deadheadMiles;
    const currentPay = loadedMiles * profile.perLoadedMile + deadheadMiles * profile.perDeadheadMile;
    const targetPay = currentPay * 1.08;
    const calculatedTarget = loadedMiles > 0
      ? Math.max(profile.perLoadedMile, (targetPay - deadheadMiles * profile.perDeadheadMile) / loadedMiles)
      : profile.perLoadedMile;
    const target = targets?.targetLoadedMileRate || calculatedTarget;
    return {
      lever: 'loaded_mile_rate',
      label: 'Loaded-mile rate',
      current: profile.perLoadedMile,
      target: roundCents(target),
      message: `I can take this if you can do ${money(target)}/loaded mile${allInMiles > loadedMiles ? ' with the deadhead pay unchanged' : ''}.`,
    };
  }

  if (profile.type === 'flat') {
    const target = targets?.targetFlatPay || Math.round(profile.flatRate * 1.08);
    return {
      lever: 'flat_pay',
      label: 'Driver flat pay',
      current: profile.flatRate,
      target,
      message: `I can take this run if you can do $${target} flat to me.`,
    };
  }

  if (profile.type === 'percentage') {
    return {
      lever: 'truck_rate',
      label: 'Truck linehaul',
      current: currentTruckRate,
      target: targetTruckRate,
      message: `I can take this if the truck rate can come up to $${Math.round(targetTruckRate)}.`,
    };
  }

  return {
    lever: 'truck_rate',
    label: 'Truck rate',
    current: currentTruckRate,
    target: targetTruckRate,
    message: `I can take this load at $${Math.round(targetTruckRate)}.`,
  };
}
