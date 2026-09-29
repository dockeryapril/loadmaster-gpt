import { describe, expect, it } from 'vitest';
import { defaultCompensationProfile } from '@/types/compensation';
import { calculateDriverNegotiationTargets } from './driverNegotiationEconomics';

describe('driver negotiation economics', () => {
  it('works backward from percentage-driver economics to truck linehaul', () => {
    const profile = { ...defaultCompensationProfile, type: 'percentage' as const, percentage: 40, includeFscInPercentage: false };
    const result = calculateDriverNegotiationTargets(profile, 750, 50, 2000, 300);
    expect(result.negotiable).toBe(true);
    expect(result.anchor).toBeGreaterThan(result.target);
    expect(result.target).toBeGreaterThan(result.floor);
    expect(result.floor).toBeGreaterThanOrEqual(2000);
  });

  it('does not invent a linehaul counter for per-mile pay', () => {
    const profile = { ...defaultCompensationProfile, type: 'per_mile' as const, perLoadedMile: 0.7 };
    const result = calculateDriverNegotiationTargets(profile, 700, 0, 2000, 0);
    expect(result.negotiable).toBe(false);
    expect(result.reason).toContain('mile rates');
  });

  it('does not invent a linehaul counter for flat driver pay', () => {
    const profile = { ...defaultCompensationProfile, type: 'flat' as const, flatRate: 800 };
    expect(calculateDriverNegotiationTargets(profile, 800, 0, 2000, 0).negotiable).toBe(false);
  });
});
