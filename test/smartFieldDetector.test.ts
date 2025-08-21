import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/utils/apiWrapper', () => ({
  callOpenAIWithRateLimit: vi.fn(),
  RateLimitExceededError: class RateLimitExceededError extends Error {}
}));

import { callOpenAIWithRateLimit } from '@/utils/apiWrapper';
import { SmartFieldDetector } from '@/utils/SmartFieldDetector';

describe('SmartFieldDetector.detectFields', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns high confidence when AI provides valid JSON', async () => {
    vi.mocked(callOpenAIWithRateLimit).mockResolvedValue({
      generatedText: JSON.stringify({
        fields: [
          { field: 'miles', value: '500', confidence: 'high' },
          { field: 'rate', value: '1000', confidence: 'high' }
        ]
      })
    });

    const result = await SmartFieldDetector.detectFields('Miles: 500 Rate: $1000');

    expect(result.confidence).toBe('high');
    expect(callOpenAIWithRateLimit).toHaveBeenCalled();
  });

  it('returns low confidence when fallback finds no fields', async () => {
    vi.mocked(callOpenAIWithRateLimit).mockResolvedValue({
      generatedText: 'invalid json'
    });

    const result = await SmartFieldDetector.detectFields('no useful data');

    expect(result.confidence).toBe('low');
  });

  it('assigns medium confidence for numeric matches in fallback detection', async () => {
    vi.mocked(callOpenAIWithRateLimit).mockResolvedValue({
      generatedText: 'invalid json'
    });

    const result = await SmartFieldDetector.detectFields('Rate: $1000 for a trip of 500 miles');

    const milesField = result.detectedFields.find(f => f.field === 'miles');
    expect(milesField?.confidence).toBe('medium');
    expect(result.confidence).toBe('medium');
  });
});

