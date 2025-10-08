import { DetectedField } from './SmartFieldDetector';

export function ensureMiles(
  fields: DetectedField[],
  onMilesNeeded?: () => Promise<string | null>
): DetectedField[] | Promise<DetectedField[] | null> {
  const hasMiles = fields.some(f => f.field === 'miles' && f.value.trim() !== '');
  if (hasMiles) {
    return fields;
  }

  // If no callback provided, return null (backward compatibility)
  if (!onMilesNeeded) {
    return null;
  }

  // Return promise for async modal handling
  return onMilesNeeded().then(milesValue => {
    if (!milesValue || milesValue.trim() === '') {
      return null;
    }
    return [
      ...fields,
      { field: 'miles', value: milesValue.trim(), confidence: 'low' },
    ];
  });
}
