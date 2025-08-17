/* eslint-disable no-undef */
import { describe, it, expect, vi } from 'vitest';
import fixtures from '../../../fixtures.json';
import { computeCalc } from '../src/computeNegotiation';
import { suggestTemplates } from '../src/generateMessages';
import { selectProfile } from '../src/equipmentProfiles';

const margins = { anchorPct: 0.18, targetPct: 0.10, floorPct: 0.00 };
vi.setSystemTime(new Date('2025-08-13T09:00:00-04:00'));

function pickStep(scn: any, endpoint: string) {
  return scn.steps.find((s: any) => s.endpoint === endpoint);
}

describe('LoadMaster Flatbed fixtures', () => {
  for (const scn of (fixtures as any).scenarios) {
    it(`${scn.id} - ${scn.name}`, () => {
      const ocr = pickStep(scn, '/ocr').response.fields;
      const expectedCalc = pickStep(scn, '/calc').response;
      const expectedTemplates = pickStep(scn, '/templates').response.suggestions;

      const fields = {
        distanceMi: ocr.distanceMi ?? pickStep(scn, '/loads').request.route.distanceMi,
        offerFlat: ocr.offerFlat,
        weightLbs: ocr.weightLbs,
        widthFt: ocr.widthFt,
        heightFt: ocr.heightFt,
        stops: ocr.stops,
        tarp: ocr.tarp,
        jobsite: ocr.jobsite,
        itemType: ocr.itemType,
        pickupAt: ocr.pickupAt,
        equipment: 'flatbed',
        equipmentSubtype: 'class8_flatbed'
      } as const;

      const calc = computeCalc(fields as any, margins, selectProfile('flatbed','class8_flatbed'));

      // Base RPM & color should match
      expect(calc.baseRpm).toBeCloseTo(expectedCalc.baseRpm, 2);
      expect(calc.resultColor).toBe(expectedCalc.resultColor);

      // Key surcharges must match when present in fixture
      for (const k of Object.keys(expectedCalc.surcharges)) {
        // Skip securement key casing issues by normalizing
        const expected = (expectedCalc.surcharges as any)[k];
        const actual = (calc.surcharges as any)[k] ?? 0;
        // Only assert when fixture includes key (not undefined)
        if (typeof expected !== 'undefined') {
          if (k === 'heavyPerMile') {
            // heavyPerMile is a rate; just compare value
            expect(actual).toBeCloseTo(expected, 2);
          } else {
            expect(actual).toBeCloseTo(expected, 0);
          }
        }
      }

      const notes = suggestTemplates(fields as any, calc, expectedTemplates.length);
      expect(notes.map(n => n.templateId)).toEqual(expectedTemplates.map((t: any) => t.templateId));
    });
  }
});
