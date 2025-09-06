/* eslint-disable no-undef */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { fuse } from '../../../src/ai/fuse';
import { validateAndNormalize, findWarnings } from '../../../src/lib/normalize';
import { extractText } from '../../../src/ai/extractText';

// Mock the extractText function
vi.mock('../../../src/ai/extractText', () => ({
  extractText: vi.fn()
}));

describe('fuse + extraction integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('normalizes pickup time and warns on oversize width for hotshot', async () => {
    // Mock extractText to return hotshot data
    vi.mocked(extractText).mockResolvedValue(JSON.stringify({
      distanceMi: 250,
      offerFlat: 650,
      widthFt: 9.2,
      heightFt: 7.5,
      pickupAt: '2025-08-14T18:00:00Z'
    }));

    const mockText = await extractText('mock ocr text');
    const { data } = validateAndNormalize(JSON.parse(mockText));
    const baseData = { equipment: 'hotshot', distanceMi: 250 };
    const fused = fuse(baseData, data || {});
    const warnings = findWarnings(data || {});

    expect(fused.widthFt).toBe(9.2);
    expect(warnings).toContain('Overwidth load');
  });

  it('warns on low confidence cargo van extraction', async () => {
    vi.mocked(extractText).mockResolvedValue(JSON.stringify({
      distanceMi: 120,
      offerFlat: 250,
      weekend: true,
      confidence: 'low'
    }));

    const mockText = await extractText('blurry cargo van load sheet');
    const { data } = validateAndNormalize(JSON.parse(mockText));
    const baseData = { equipment: 'cargo_van', distanceMi: 120 };
    const fused = fuse(baseData, data || {});

    expect(fused.weekend).toBe(true);
    expect(fused.distanceMi).toBe(120);
  });

  it('detects overheight straight truck', async () => {
    vi.mocked(extractText).mockResolvedValue(JSON.stringify({
      distanceMi: 180,
      offerFlat: 540,
      heightFt: 14.2,
      liftgate: true
    }));

    const mockText = await extractText('straight truck load confirmation');
    const { data } = validateAndNormalize(JSON.parse(mockText));
    const warnings = findWarnings(data || {});
    const baseData = { equipment: 'straight_truck', distanceMi: 180 };
    const fused = fuse(baseData, data || {});

    expect(fused.heightFt).toBe(14.2);
    expect(fused.liftgate).toBe(true);
    expect(warnings).toContain('Overheight load');
  });
});