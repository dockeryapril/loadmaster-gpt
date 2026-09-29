import { describe, expect, it } from 'vitest';
import { calculateDriverDecisionEconomics } from './driverDecisionEconomics';

const compensation = { pay: 800, basePay: 750, deadheadPay: 50, deadheadFsc: 0, payBase: 2000 };

describe('driver decision economics', () => {
  it('uses actual driver compensation for non-truck profiles', () => {
    const result = calculateDriverDecisionEconomics('percentage', compensation, 1200, 900, 100, 50);
    expect(result.basis).toBe('driver');
    expect(result.net).toBe(750);
    expect(result.effectiveRpm).toBe(0.75);
  });

  it('keeps truck economics for truck profiles', () => {
    const result = calculateDriverDecisionEconomics('truck', { ...compensation, pay: 2000 }, 1200, 900, 100);
    expect(result.basis).toBe('truck');
    expect(result.net).toBe(1200);
    expect(result.effectiveRpm).toBe(1.2);
  });
});
