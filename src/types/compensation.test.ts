import { describe, expect, it } from 'vitest';
import { calculateCompensation, defaultCompensationProfile } from './compensation';

describe('calculateCompensation', () => {
  it('calculates percentage pay with FSC in the pay base', () => {
    const result = calculateCompensation(
      { ...defaultCompensationProfile, type: 'percentage', percentage: 40, includeFscInPercentage: true },
      2000, 300, 1000, 50,
    );
    expect(result.pay).toBe(920);
  });

  it('calculates percentage pay on linehaul only', () => {
    const result = calculateCompensation(
      { ...defaultCompensationProfile, type: 'percentage', percentage: 40, includeFscInPercentage: false },
      2000, 300, 1000, 50,
    );
    expect(result.pay).toBe(800);
  });

  it('calculates loaded and deadhead per-mile pay', () => {
    const result = calculateCompensation(
      { ...defaultCompensationProfile, type: 'per_mile', perLoadedMile: 0.65, perDeadheadMile: 0.25 },
      2000, 0, 1000, 100,
    );
    expect(result.basePay).toBe(650);
    expect(result.deadheadPay).toBe(25);
    expect(result.pay).toBe(675);
  });

  it('adds explicit deadhead pay and deadhead FSC to flat pay', () => {
    const result = calculateCompensation(
      { ...defaultCompensationProfile, type: 'flat', flatRate: 700, deadheadFlatPay: 50, deadheadFsc: 20 },
      2000, 0, 1000, 100,
    );
    expect(result.pay).toBe(770);
  });
});
