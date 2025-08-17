/* eslint-disable no-undef */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { fuse } from '../../../src/ai/fuse';
import { validateAndNormalize, findWarnings } from '../../../src/lib/normalize';

vi.mock('../../../src/ai/extractText', () => ({
  extractText: vi.fn()
}));

import { extractText as extractFromText } from '../../../src/ai/extractText';

describe('extraction llm fusion', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  const hotshotText = `Hotshot load Houston to Dallas, pickup 2025-08-14 14:00 ET, 16000 lbs, 9ft wide, 8ft tall.`;
  const cargoVanText = `Cargo van run Austin to San Antonio, 200 miles, 1000 lbs.`;
  const straightTruckText = `Straight truck from Nashville to Memphis, 40000 lbs, 14ft tall.`;

  it('normalizes pickup time and warns on oversize width for hotshot', async () => {
    (extractFromText as any).mockResolvedValueOnce(
      JSON.stringify({
        fields: {
          distanceMi: '120',
          weightLbs: '16000',
          widthFt: '9',
          heightFt: '8',
          pickupAt: '2025-08-14T18:00:00Z'
        },
        confidence: 0.9
      })
    );

    const raw = await extractFromText(hotshotText);
    const { fields, confidence } = JSON.parse(raw);
    const normalized = validateAndNormalize(fields).data!;
    const base = { pickupAt: '2025-08-14T14:00:00-04:00' } as const;
    const fused = fuse(base, normalized);
    const warnings = findWarnings(fused as any);
    if (confidence < 0.8) warnings.push('Low confidence extraction');

    expect(fused.pickupAt).toBe(base.pickupAt);
    expect(fused.widthFt).toBe(9);
    expect(warnings).toContain('Overwidth load');
  });

  it('warns on low confidence cargo van extraction', async () => {
    (extractFromText as any).mockResolvedValueOnce(
      JSON.stringify({
        fields: {
          distanceMi: '200',
          weightLbs: '1000',
          widthFt: '5',
          heightFt: '5'
        },
        confidence: 0.5
      })
    );

    const raw = await extractFromText(cargoVanText);
    const { fields, confidence } = JSON.parse(raw);
    const normalized = validateAndNormalize(fields).data!;
    const fused = fuse({}, normalized);
    const warnings = findWarnings(fused as any);
    if (confidence < 0.8) warnings.push('Low confidence extraction');

    expect(fused.distanceMi).toBe(200);
    expect(warnings).toContain('Low confidence extraction');
  });

  it('detects overheight straight truck', async () => {
    (extractFromText as any).mockResolvedValueOnce(
      JSON.stringify({
        fields: {
          distanceMi: '300',
          weightLbs: '40000',
          widthFt: '8',
          heightFt: '14'
        },
        confidence: 0.9
      })
    );

    const raw = await extractFromText(straightTruckText);
    const { fields, confidence } = JSON.parse(raw);
    const normalized = validateAndNormalize(fields).data!;
    const fused = fuse({}, normalized);
    const warnings = findWarnings(fused as any);
    if (confidence < 0.8) warnings.push('Low confidence extraction');

    expect(fused.heightFt).toBe(14);
    expect(warnings).toContain('Overheight load');
  });
});
