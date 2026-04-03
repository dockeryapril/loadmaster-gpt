import { describe, expect, it } from 'vitest';
import { computeThresholdRecommendation } from './thresholdRecommendations';
import { defaultCostAssumptions, type LoadEntrySnapshot } from '@/types/mvp';

function makeLoad(index: number, overrides: Partial<LoadEntrySnapshot> = {}): LoadEntrySnapshot {
  return {
    id: String(index),
    createdAt: new Date(2026, 0, index + 1).toISOString(),
    outcome: 'book',
    origin: 'Dallas, TX',
    destination: 'Houston, TX',
    miles: 250,
    rate: 1000,
    fsc: 0,
    tolls: 0,
    fuelCost: 0,
    profit: 600 + index * 10,
    rpm: 0.8 + index * 0.01,
    ...overrides,
  };
}

describe('computeThresholdRecommendation', () => {
  it('returns null when sample size is too small', () => {
    const history = Array.from({ length: 10 }, (_, i) => makeLoad(i));
    const result = computeThresholdRecommendation(history, defaultCostAssumptions);
    expect(result).toBeNull();
  });

  it('returns recommendation when enough loads are present', () => {
    const history = Array.from({ length: 60 }, (_, i) => makeLoad(i));
    const result = computeThresholdRecommendation(history, defaultCostAssumptions);

    expect(result).not.toBeNull();
    expect(result?.recommended.goodRpm).toBeGreaterThan(result?.recommended.fairRpm ?? 0);
    expect(result?.recommended.goodProfit).toBeGreaterThan(result?.recommended.fairProfit ?? 0);
    expect(result?.sampleSize).toBe(60);
  });

  it('uses all loads if successful load count is insufficient', () => {
    const history = Array.from({ length: 60 }, (_, i) =>
      makeLoad(i, {
        outcome: i < 10 ? 'book' : 'pass',
      }),
    );

    const result = computeThresholdRecommendation(history, {
      ...defaultCostAssumptions,
      goodRpm: 0.4,
      fairRpm: 0.3,
      goodProfit: 300,
      fairProfit: 200,
    });

    expect(result).not.toBeNull();
    expect(result?.reasons.some((reason) => reason.includes('using all recent loads'))).toBe(true);
  });
});
