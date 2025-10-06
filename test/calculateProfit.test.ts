import { describe, expect, it } from 'vitest';
import { calculateProfit } from '../src/utils/calculateProfit';
import type { CostProfile, LoadOpportunity } from '../src/types';

describe('calculateProfit', () => {
  const load: LoadOpportunity = {
    origin: 'Dallas, TX',
    destination: 'Chicago, IL',
    miles: 500,
    rateAllIn: 1500,
    fuelSurcharge: 200,
  };

  const profile: CostProfile = {
    fixedCostsPerDay: 250,
    variableCostsPerMile: 0.35,
    fuelEfficiency: 6.5,
    dieselPricePerGallon: 4.5,
    targetMargin: 200,
  };

  it('calculates rpm, margin, and takeIt flag', () => {
    const result = calculateProfit(load, profile);
    expect(result.rpm).toBe('3.40');
    expect(result.margin).toBe('928.85');
    expect(result.takeIt).toBe(true);
  });

  it('indicates when margin misses the target', () => {
    const result = calculateProfit(load, { ...profile, targetMargin: 2000 });
    expect(result.takeIt).toBe(false);
  });

  it('handles zero miles without dividing by zero', () => {
    const result = calculateProfit({ ...load, miles: 0 }, profile);
    expect(result.rpm).toBe('0.00');
  });
});
