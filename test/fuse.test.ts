import { describe, it, expect } from 'vitest';
import { fuse } from '../src/ai/fuse';

describe('fuse date normalization', () => {
  it('treats equivalent ISO strings with different zones as equal', () => {
    const base = { pickupAt: '2025-08-14T14:00:00-04:00' };
    const patch = { pickupAt: '2025-08-14T18:00:00Z' };
    const result = fuse(base, patch);
    expect(result).toBe(base);
  });

  it('updates when timestamps differ', () => {
    const base = { pickupAt: '2025-08-14T14:00:00-04:00' };
    const patch = { pickupAt: '2025-08-14T15:00:00-04:00' };
    const result = fuse(base, patch);
    expect(result).not.toBe(base);
    expect(result.pickupAt).toBe(patch.pickupAt);
  });
});
