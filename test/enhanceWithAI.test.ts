import { describe, it, expect, vi } from 'vitest';

vi.mock('@/utils/apiWrapper', () => ({
  callOpenAIWithRateLimit: vi.fn(),
  RateLimitExceededError: class RateLimitExceededError extends Error {},
}));

import { callOpenAIWithRateLimit, RateLimitExceededError } from '@/utils/apiWrapper';
import { enhanceWithAI } from '@/features/negotiation/enhanceWithAI';

describe('enhanceWithAI', () => {
  it('returns improved script', async () => {
    vi.mocked(callOpenAIWithRateLimit).mockResolvedValue({ generatedText: 'better' });
    const result = await enhanceWithAI({ baseScript: 'hello', context: 'ctx' });
    expect(result).toBe('better');
  });

  it('propagates rate limit errors', async () => {
    const err = new RateLimitExceededError('limit');
    vi.mocked(callOpenAIWithRateLimit).mockRejectedValue(err);
    await expect(enhanceWithAI({ baseScript: 'hi', context: 'ctx' })).rejects.toBe(err);
  });

  it('propagates other errors', async () => {
    const err = new Error('network');
    vi.mocked(callOpenAIWithRateLimit).mockRejectedValue(err);
    await expect(enhanceWithAI({ baseScript: 'hi', context: 'ctx' })).rejects.toBe(err);
  });
});
