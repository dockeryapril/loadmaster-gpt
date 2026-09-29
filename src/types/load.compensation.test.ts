import { describe, expect, it } from 'vitest';
import { calculateDetailedProfit } from './load';
import { defaultCostAssumptions } from './mvp';

describe('calculateDetailedProfit compensation pay base', () => {
  it('preserves legacy behavior when FSC participates in the split', () => {
    const result = calculateDetailedProfit(2000, 300, 0, 1000, defaultCostAssumptions, 40, {
      includeFsc: true,
      includeTolls: true,
      includeFuel: false,
      includeFscInSplit: true,
    });
    expect(result.breakdown.yourShare).toBe(920);
  });

  it('can calculate percentage pay on linehaul only', () => {
    const result = calculateDetailedProfit(2000, 300, 0, 1000, defaultCostAssumptions, 40, {
      includeFsc: true,
      includeTolls: true,
      includeFuel: false,
      includeFscInSplit: false,
    });
    expect(result.breakdown.grossRevenue).toBe(2300);
    expect(result.breakdown.splitEligibleRevenue).toBe(2000);
    expect(result.breakdown.yourShare).toBe(800);
  });
});
