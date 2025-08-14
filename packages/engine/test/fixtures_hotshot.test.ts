/* eslint-disable no-undef */
import { describe, it, expect } from 'vitest';
import fixtures from '../../../LoadMaster_GPT/helper_dropin/fixtures_hotshot.json';
import { computeCalc } from '../src/computeNegotiation';
import { suggestTemplates } from '../src/generateMessages';
import { selectProfile } from '../src/equipmentProfiles';

const margins = { anchorPct: 0.18, targetPct: 0.10, floorPct: 0.00 };
function pickStep(scn: any, endpoint: string) { return scn.steps.find((s: any) => s.endpoint === endpoint); }

describe('Hotshot fixtures', () => {
  for (const scn of (fixtures as any).scenarios) {
    it(`${scn.id} - ${scn.name}`, () => {
      const ocr = pickStep(scn, '/ocr').response.fields;
      const expectedCalc = pickStep(scn, '/calc').response;
      const expectedTemplates = pickStep(scn, '/templates').response.suggestions;
      const fields = {
        distanceMi: ocr.distanceMi ?? pickStep(scn, '/loads').request.route.distanceMi,
        offerFlat: ocr.offerFlat, weightLbs: ocr.weightLbs, widthFt: ocr.widthFt, heightFt: ocr.heightFt,
        stops: ocr.stops, tarp: ocr.tarp, jobsite: ocr.jobsite, itemType: ocr.itemType, pickupAt: ocr.pickupAt,
        equipment: 'flatbed', equipmentSubtype: 'hotshot'
      } as const;
      const calc = computeCalc(fields as any, margins, selectProfile('flatbed','hotshot'));
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
