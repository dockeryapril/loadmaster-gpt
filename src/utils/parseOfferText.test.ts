import { describe, expect, it } from 'vitest';
import { parseOfferText } from './parseOfferText';

describe('parseOfferText', () => {
  it('parses a compact dispatch offer', () => {
    const parsed = parseOfferText(
      'PU Gainesville, GA\nDEL Laredo, TX\n1048 loaded / 42 DH\n$1750 + FSC $300'
    );

    expect(parsed.origin).toBe('Gainesville, GA');
    expect(parsed.destination).toBe('Laredo, TX');
    expect(parsed.miles).toBe('1048');
    expect(parsed.deadheadMiles).toBe('42');
    expect(parsed.rate).toBe('1750');
    expect(parsed.fsc).toBe('300');
  });

  it('parses labeled fields without inventing missing values', () => {
    const parsed = parseOfferText(
      'Origin: Atlanta, GA\nDestination: Nashville, TN\nLoaded miles: 250\nRate: $700'
    );

    expect(parsed.origin).toBe('Atlanta, GA');
    expect(parsed.destination).toBe('Nashville, TN');
    expect(parsed.miles).toBe('250');
    expect(parsed.rate).toBe('700');
    expect(parsed.deadheadMiles).toBeUndefined();
    expect(parsed.fsc).toBeUndefined();
  });
});
