import { describe, expect, it } from 'vitest';
import { reconcileOfferSources } from './reconcileOfferSources';

describe('reconcileOfferSources', () => {
  it('combines pasted text and image extraction into one offer', () => {
    const result = reconcileOfferSources([
      { label: 'Pasted text', data: { origin: 'Atlanta, GA', miles: '1048' } },
      { label: 'Image 2', data: { destination: 'Laredo, TX', rate: '1750' } },
    ]);
    expect(result.values).toMatchObject({
      origin: 'Atlanta, GA',
      destination: 'Laredo, TX',
      miles: '1048',
      rate: '1750',
    });
    expect(result.sources.rate).toEqual(['Image 2']);
  });

  it('keeps matching values and records both sources', () => {
    const result = reconcileOfferSources([
      { label: 'Pasted text', data: { rate: '$1,750' } },
      { label: 'Image 1', data: { rate: '1750' } },
    ]);
    expect(result.conflicts.rate).toBeUndefined();
    expect(result.sources.rate).toEqual(['Pasted text', 'Image 1']);
  });

  it('flags cross-source disagreement instead of choosing a winner', () => {
    const result = reconcileOfferSources([
      { label: 'Pasted text', data: { rate: '1750' } },
      { label: 'Image 1', data: { rate: '1850' } },
    ]);
    expect(result.values.rate).toBeUndefined();
    expect(result.conflicts.rate).toEqual([
      { value: '1750', source: 'Pasted text' },
      { value: '1850', source: 'Image 1' },
    ]);
  });
});
