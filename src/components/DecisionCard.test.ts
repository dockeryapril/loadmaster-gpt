import { describe, expect, it } from 'vitest';
import { getLoadGuidance } from './GuidanceBadge';

const thresholds = {
  goodRpm: 0.8,
  fairRpm: 0.7,
  goodProfit: 900,
  fairProfit: 450,
};

describe('decision guidance thresholds', () => {
  it('books only when RPM and profit meet good thresholds', () => {
    expect(getLoadGuidance(0.9, 1000, thresholds).level).toBe('book');
  });

  it('passes when either RPM or profit falls below the fair floor', () => {
    expect(getLoadGuidance(0.69, 1000, thresholds).level).toBe('pass');
    expect(getLoadGuidance(0.9, 449, thresholds).level).toBe('pass');
  });

  it('counters in the marginal band', () => {
    expect(getLoadGuidance(0.75, 700, thresholds).level).toBe('counter');
  });
});
