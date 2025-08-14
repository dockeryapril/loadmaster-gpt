import { DetectedField } from './SmartFieldDetector';

export function ensureMiles(
  fields: DetectedField[],
  promptFn: (message: string) => string | null = window.prompt
): DetectedField[] | null {
  const hasMiles = fields.some(f => f.field === 'miles' && f.value.trim() !== '');
  if (hasMiles) {
    return fields;
  }
  const milesValue = promptFn('Miles not detected. Please enter miles:');
  if (!milesValue || milesValue.trim() === '') {
    return null;
  }
  return [
    ...fields,
    { field: 'miles', value: milesValue.trim(), confidence: 'low' },
  ];
}
