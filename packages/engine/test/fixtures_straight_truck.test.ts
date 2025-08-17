/* eslint-disable no-undef */
import { describe, it, expect, vi } from 'vitest';
import fixtures from '../../../fixtures_straight_truck.json';
import { computeCalc } from '../src/computeNegotiation';
import { suggestTemplates } from '../src/generateMessages';
import { selectProfile } from '../src/equipmentProfiles';

const margins = { anchorPct: 0.18, targetPct: 0.10, floorPct: 0.00 };
vi.setSystemTime(new Date('2025-08-13T09:00:00-04:00'));

function pickStep(scn: any, endpoint: string) { return scn.steps.find((s: any) => s.endpoint === endpoint); }

describe('Straight truck fixtures', () => {
  for (const scn of (fixtures as any).scenarios) {
    it(`${scn.id} - ${scn.name}`, () => {
      const ocr = pickStep(scn, '/ocr').response.fields;
      const expectedCalc = pickStep(scn, '/calc').response;
      const expectedTemplates = pickStep(scn, '/templates').response.suggestions;

      let pickupAt = ocr.pickupAt;
      if (typeof pickupAt === 'string' && pickupAt.startsWith('now+')) {
        const match = pickupAt.match(/now\+(\d+)h/);
        if (match) {
          pickupAt = new Date(Date.now() + Number(match[1]) * 60 * 60 * 1000).toISOString();
        }
      }

      const fields = {
        distanceMi: ocr.distanceMi,
        offerFlat: ocr.offerFlat,
        liftgate: ocr.liftgate,
        inside: ocr.inside,
        residential: ocr.residential,
        palletJack: ocr.palletJack,
        stops: ocr.stops,
        pickupAt,
        equipment: 'straight_truck'
      } as const;

      const calc = computeCalc(fields as any, margins, selectProfile('straight_truck'));

      expect(calc.baseRpm).toBeCloseTo(expectedCalc.baseRpm, 2);
      expect(calc.resultColor).toBe(expectedCalc.resultColor);

      for (const k of Object.keys(expectedCalc.surcharges)) {
        const expected = (expectedCalc.surcharges as any)[k];
        const actual = (calc.surcharges as any)[k] ?? 0;
        if (typeof expected !== 'undefined') {
          if (k === 'heavyPerMile') expect(actual).toBeCloseTo(expected, 2);
          else expect(actual).toBeCloseTo(expected, 0);
        }
      }

      const notes = suggestTemplates(fields as any, calc, expectedTemplates.length);
      expect(notes.map(n => n.templateId)).toEqual(expectedTemplates.map((t: any) => t.templateId));
    });
  }
});
