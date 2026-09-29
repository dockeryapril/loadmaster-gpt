import { describe, expect, it } from 'vitest';
import { defaultCompensationProfile } from '@/types/compensation';
import { buildCompensationCounter } from './compensationCounter';

describe('saved compensation targets', () => {
  it('uses a saved loaded-mile target instead of the generic bump', () => {
    const p = { ...defaultCompensationProfile, type: 'per_mile' as const, perLoadedMile: .70, perDeadheadMile: .40 };
    const c = buildCompensationCounter(p, 500, 50, 1200, 1300, { targetLoadedMileRate: .85 });
    expect(c.target).toBe(.85);
  });
  it('uses a saved deadhead target for unpaid deadhead', () => {
    const p = { ...defaultCompensationProfile, type: 'per_mile' as const, perLoadedMile: .80, perDeadheadMile: 0 };
    expect(buildCompensationCounter(p, 500, 100, 1200, 1300, { targetDeadheadRate: .50 }).target).toBe(.50);
  });
  it('uses a saved flat-pay target', () => {
    const p = { ...defaultCompensationProfile, type: 'flat' as const, flatRate: 700 };
    expect(buildCompensationCounter(p, 500, 0, 1200, 1300, { targetFlatPay: 850 }).target).toBe(850);
  });
});
