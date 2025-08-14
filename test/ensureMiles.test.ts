import { describe, it, expect, vi } from 'vitest';
import { ensureMiles } from '@/utils/ensureMiles';
import type { DetectedField } from '@/utils/SmartFieldDetector';

describe('ensureMiles', () => {
  const baseFields: DetectedField[] = [
    { field: 'rate', value: '1000', confidence: 'high' },
  ];

  it('returns original fields when miles present', () => {
    const fields = [...baseFields, { field: 'miles', value: '500', confidence: 'high' }];
    const result = ensureMiles(fields, () => null);
    expect(result).toEqual(fields);
  });

  it('adds miles when prompt provides value', () => {
    const prompt = vi.fn().mockReturnValue('750');
    const result = ensureMiles(baseFields, prompt);
    expect(prompt).toHaveBeenCalled();
    expect(result).toEqual([
      ...baseFields,
      { field: 'miles', value: '750', confidence: 'low' },
    ]);
  });

  it('returns null when user cancels prompt', () => {
    const prompt = vi.fn().mockReturnValue(null);
    const result = ensureMiles(baseFields, prompt);
    expect(prompt).toHaveBeenCalled();
    expect(result).toBeNull();
  });
});
