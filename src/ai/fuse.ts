export type AnyRecord = Record<string, any>;

const DATE_KEY_REGEX = /(At|Date)$/i;

function normalizeValue(key: string, value: any): any {
  if (value === undefined || value === null) return value;
  if (DATE_KEY_REGEX.test(key)) {
    const time = new Date(value as any).getTime();
    if (!Number.isNaN(time)) return time;
  }
  return value;
}

/**
 * Merge `incoming` fields into `current`, returning `current` if nothing
 * materially changed. Date-like values are normalized to timestamps before
 * comparison to avoid false mismatches due to formatting or timezone.
 */
export function fuse<T extends AnyRecord>(current: T, incoming: Partial<T>): T {
  let changed = false;
  const result: AnyRecord = { ...current };

  for (const [key, value] of Object.entries(incoming)) {
    const normalizedIncoming = normalizeValue(key, value);
    const normalizedCurrent = normalizeValue(key, (current as any)[key]);
    if (normalizedIncoming !== normalizedCurrent) {
      result[key] = value;
      changed = true;
    }
  }

  return changed ? (result as T) : current;
}

export { normalizeValue };
