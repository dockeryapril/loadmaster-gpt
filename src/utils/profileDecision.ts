import type { CompensationProfile } from '@/types/compensation';
import type { CompensationTargets } from '@/types/driverProfile';
import type { GuidanceLevel } from '@/components/GuidanceBadge';

export interface ProfileDecision {
  level: GuidanceLevel;
  message: string;
}

export function getProfileCompensationDecision(
  compensation: CompensationProfile,
  targets: CompensationTargets | undefined,
): ProfileDecision | null {
  if (!targets) return null;

  let current = 0, target = 0, minimum = 0, unit = '';
  switch (compensation.type) {
    case 'per_mile':
      current = compensation.perLoadedMile;
      target = targets.targetLoadedMileRate;
      minimum = targets.minimumLoadedMileRate;
      unit = '/loaded mi';
      break;
    case 'flat':
      current = compensation.flatRate;
      target = targets.targetFlatPay;
      minimum = targets.minimumFlatPay;
      break;
    case 'percentage':
      current = compensation.percentage;
      target = targets.targetPercentage;
      minimum = targets.minimumPercentage;
      unit = '%';
      break;
    default:
      return null;
  }

  if (target <= 0 || minimum <= 0) return null;
  const format = (v: number) => unit === '%' ? `${v}%` : `$${v.toFixed(2)}${unit}`;
  if (current >= target) return { level: 'book', message: `Meets your saved target of ${format(target)}.` };
  if (current >= minimum) return { level: 'counter', message: `Above your ${format(minimum)} minimum but below your ${format(target)} target.` };
  return { level: 'pass', message: `Below your saved minimum of ${format(minimum)}.` };
}
