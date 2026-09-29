import { describe, expect, it } from 'vitest';
import { createDriverProfile } from './driverProfile';

describe('driver profiles', () => {
  it('is carrier-neutral and keeps team status separate from carrier', () => {
    const profile = createDriverProfile('1', 'Straight Truck Team');
    expect(profile.carrier).toBe('');
    expect(profile.operationMode).toBe('solo');
    profile.carrier = 'Example Carrier';
    profile.operationMode = 'team';
    expect(profile.carrier).toBe('Example Carrier');
    expect(profile.operationMode).toBe('team');
  });

  it('owns independent compensation and cost settings', () => {
    const first = createDriverProfile('1');
    const second = createDriverProfile('2');
    first.compensation.percentage = 40;
    first.costs.averageMPG = 9;
    expect(second.compensation.percentage).toBe(100);
    expect(second.costs.averageMPG).not.toBe(9);
  });
});
