import { describe, expect, it } from 'vitest';
import { calculateResetDate } from './useUsageLimits';

describe('calculateResetDate', () => {
  it('returns one month after the provided start date', () => {
    const start = new Date('2025-01-15T10:30:00Z');
    const reset = calculateResetDate(start);
    expect(reset.toISOString()).toBe(new Date('2025-02-15T10:30:00Z').toISOString());
  });

  it('handles end-of-month dates by clamping to the last day of the next month', () => {
    const start = new Date('2025-01-31T05:00:00Z');
    const reset = calculateResetDate(start);
    expect(reset.getUTCFullYear()).toBe(2025);
    expect(reset.getUTCMonth()).toBe(1); // February
    expect(reset.getUTCDate()).toBe(28); // Feb 28, 2025
  });

  it('uses the reference date when the start date is not available', () => {
    const reference = new Date('2025-03-10T00:00:00Z');
    const reset = calculateResetDate(null, reference);
    expect(reset.toISOString()).toBe(new Date('2025-04-10T00:00:00Z').toISOString());
  });
});
