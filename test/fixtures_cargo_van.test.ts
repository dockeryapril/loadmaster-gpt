import { describe, it, expect } from 'vitest';
import fixtures from '../fixtures_cargo_van.json';
import { computeCalc } from '../packages/engine/src/computeNegotiation';
import { suggestTemplates } from '../packages/engine/src/generateMessages';
import { selectProfile } from '../packages/engine/src/equipmentProfiles';

const margins = { anchorPct: 0.18, targetPct: 0.10, floorPct: 0.00 };

function pickStep(scn: any, endpoint: string) {
  return scn.steps.find((s: any) => s.endpoint === endpoint);
}

describe('Cargo van fixtures', () => {
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
        weekend: ocr.weekend,
        afterHours: ocr.afterHours,
        inside: ocr.inside,
        residential: ocr.residential,
        stops: ocr.stops,
        pickupAt,
        equipment: 'cargo_van'
      } as const;

      const calc = computeCalc(fields as any, margins, selectProfile('cargo_van'));

      expect(calc.baseRpm).toBeCloseTo(expectedCalc.baseRpm, 2);
      expect(calc.resultColor).toBe(expectedCalc.resultColor);

      for (const k of Object.keys(expectedCalc.surcharges)) {
        const expected = (expectedCalc.surcharges as any)[k];
        const actual = (calc.surcharges as any)[k] ?? 0;
        if (typeof expected !== 'undefined') {
          expect(actual).toBeCloseTo(expected, 0);
        }
      }

      const notes = suggestTemplates(fields as any, calc, expectedTemplates.length);
      expect(notes.map((n) => n.templateId)).toEqual(
        expectedTemplates.map((t: any) => t.templateId)
      );
    });
  }
});
