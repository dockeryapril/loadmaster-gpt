import { describe, expect, it } from 'vitest';
import { calculateProfit } from '@/types/load';

describe('calculateProfit', () => {
  it('adds rate and FSC then subtracts tolls and fuel', () => {
    expect(calculateProfit(1500, 200, 50, 300)).toBe(1350);
  });

  it('handles missing optional values', () => {
    expect(calculateProfit(1000)).toBe(1000);
  });

  it('treats undefined inputs as zero', () => {
    expect(calculateProfit(800, undefined, undefined, 100)).toBe(700);
  });
});
