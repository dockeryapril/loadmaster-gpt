import { describe, expect, it } from 'vitest';
import { mergeOcrExtractions } from './mergeOcrExtractions';

describe('mergeOcrExtractions', () => {
  it('combines complementary fields and records their image sources', () => {
    const result = mergeOcrExtractions([
      { origin: 'Atlanta, GA', destination: 'Laredo, TX', confidence: 0.96 },
      { miles: '1048', rate: '1750', fsc: '300', confidence: 0.91 },
    ]);
    expect(result.merged).toMatchObject({
      origin: 'Atlanta, GA',
      destination: 'Laredo, TX',
      miles: '1048',
      rate: '1750',
      fsc: '300',
    });
    expect(result.sources.rate).toEqual([2]);
    expect(result.conflicts).toEqual([]);
  });

  it('flags conflicting values instead of guessing', () => {
    const result = mergeOcrExtractions([
      { rate: '1750' },
      { rate: '1850' },
    ]);
    expect(result.merged.rate).toBeUndefined();
    expect(result.conflicts).toEqual([
      {
        field: 'rate',
        values: [
          { value: '1750', image: 1 },
          { value: '1850', image: 2 },
        ],
      },
    ]);
  });

  it('treats formatting-only numeric differences as the same value', () => {
    const result = mergeOcrExtractions([
      { rate: '$1,750' },
      { rate: '1750' },
    ]);
    expect(result.conflicts).toEqual([]);
    expect(result.sources.rate).toEqual([1, 2]);
  });
});
