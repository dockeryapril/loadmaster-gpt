import { describe, expect, it } from 'vitest';
import { createDriverProfile } from '@/types/driverProfile';
import { emptyLoadForm } from '@/types/mvp';
import { applyProfileToOffer } from './applyDriverProfile';

describe('applyProfileToOffer', () => {
  it('changes operating setup without overwriting the current offer', () => {
    const profile = createDriverProfile('team', 'Straight Truck Team');
    profile.equipment = 'straight_truck';
    profile.compensation.percentage = 40;

    const offer = {
      ...emptyLoadForm,
      equipment: 'cargo_van' as const,
      origin: 'Atlanta, GA',
      destination: 'Laredo, TX',
      miles: '1048',
      deadheadMiles: '42',
      rate: '1750',
      fsc: '300',
      tolls: '25',
      notes: 'Dispatch offer',
    };

    const result = applyProfileToOffer(offer, profile);
    expect(result.equipment).toBe('straight_truck');
    expect(result.splitPercent).toBe('40');
    expect(result.origin).toBe('Atlanta, GA');
    expect(result.destination).toBe('Laredo, TX');
    expect(result.miles).toBe('1048');
    expect(result.deadheadMiles).toBe('42');
    expect(result.rate).toBe('1750');
    expect(result.fsc).toBe('300');
    expect(result.tolls).toBe('25');
    expect(result.notes).toBe('Dispatch offer');
  });
});
