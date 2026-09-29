import { describe, expect, it } from 'vitest';
import { defaultCompensationProfile } from '@/types/compensation';
import { buildCompensationCounter } from './compensationCounter';

describe('compensation counter', () => {
  it('asks for deadhead pay when a per-mile driver has unpaid deadhead', () => {
    const p = { ...defaultCompensationProfile, type: 'per_mile' as const, perLoadedMile: .80, perDeadheadMile: 0 };
    const c = buildCompensationCounter(p, 500, 100, 1200, 1300);
    expect(c.lever).toBe('deadhead_rate');
    expect(c.target).toBe(.80);
  });
  it('counters the loaded-mile rate when deadhead is already paid', () => {
    const p = { ...defaultCompensationProfile, type: 'per_mile' as const, perLoadedMile: .80, perDeadheadMile: .40 };
    expect(buildCompensationCounter(p, 500, 100, 1200, 1300).lever).toBe('loaded_mile_rate');
  });
  it('counters driver flat pay for flat profiles', () => {
    const p = { ...defaultCompensationProfile, type: 'flat' as const, flatRate: 700 };
    const c = buildCompensationCounter(p, 500, 0, 1200, 1300);
    expect(c.lever).toBe('flat_pay');
    expect(c.target).toBe(756);
  });
});
