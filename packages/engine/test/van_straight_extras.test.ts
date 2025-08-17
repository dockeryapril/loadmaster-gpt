/* eslint-disable no-undef */
import { describe, it, expect } from 'vitest';
import { computeCalc } from '../src/computeNegotiation';
import { selectProfile } from '../src/equipmentProfiles';

const margins = { anchorPct: 0.18, targetPct: 0.10, floorPct: 0.00 };

describe('Cargo van and straight truck extra surcharges', () => {
  it('adds only cargo van multi-stop surcharge', () => {
    const fields = {
      distanceMi: 100,
      offerFlat: 1000,
      equipment: 'cargo_van',
      weekend: true,
      afterHours: true,
      inside: true,
      residential: true,
      stops: 2
    } as const;

    const calc = computeCalc(fields as any, margins, selectProfile('cargo_van'));
    expect(calc.surcharges.weekend).toBe(0);
    expect(calc.surcharges.afterHours).toBe(0);
    expect(calc.surcharges.inside).toBe(0);
    expect(calc.surcharges.residential).toBe(0);
    expect(calc.surcharges.multiStop).toBe(30);
    const total = Object.values(calc.surcharges).reduce((a, b) => a + b, 0);
    expect(total).toBe(30);
  });

  it('adds straight truck multi-stop surcharge with other extras', () => {
    const fields = {
      distanceMi: 100,
      offerFlat: 1000,
      equipment: 'straight_truck',
      liftgate: true,
      inside: true,
      residential: true,
      palletJack: true,
      stops: 3
    } as const;

    const calc = computeCalc(fields as any, margins, selectProfile('straight_truck'));
    expect(calc.surcharges.liftgate).toBe(0);
    expect(calc.surcharges.inside).toBe(0);
    expect(calc.surcharges.residential).toBe(0);
    expect(calc.surcharges.palletJack).toBe(0);
    expect(calc.surcharges.multiStop).toBe(100);
    const total = Object.values(calc.surcharges).reduce((a, b) => a + b, 0);
    expect(total).toBe(100);
  });
});
