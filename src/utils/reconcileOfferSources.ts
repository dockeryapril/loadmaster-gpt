export type OfferField =
  | 'origin' | 'destination' | 'miles' | 'deadheadMiles'
  | 'rate' | 'fsc' | 'tolls';

export interface OfferCandidate {
  value: string;
  source: string;
}

export interface UnifiedOffer {
  values: Partial<Record<OfferField, string>>;
  sources: Partial<Record<OfferField, string[]>>;
  conflicts: Partial<Record<OfferField, OfferCandidate[]>>;
}

const FIELDS: OfferField[] = [
  'origin', 'destination', 'miles', 'deadheadMiles', 'rate', 'fsc', 'tolls',
];

const normalize = (value: string) =>
  value.trim().toLowerCase().replace(/[$,\s]/g, '');

export function reconcileOfferSources(
  sources: Array<{ label: string; data: Partial<Record<OfferField, string | undefined>> }>,
): UnifiedOffer {
  const result: UnifiedOffer = { values: {}, sources: {}, conflicts: {} };

  for (const field of FIELDS) {
    const candidates = sources.flatMap(({ label, data }) => {
      const value = data[field]?.trim();
      return value ? [{ value, source: label }] : [];
    });
    const groups = new Map<string, OfferCandidate[]>();
    for (const candidate of candidates) {
      const key = normalize(candidate.value);
      groups.set(key, [...(groups.get(key) || []), candidate]);
    }
    const unique = [...groups.values()];
    if (unique.length === 1) {
      result.values[field] = unique[0][0].value;
      result.sources[field] = unique[0].map((candidate) => candidate.source);
    } else if (unique.length > 1) {
      result.conflicts[field] = unique.flat();
    }
  }

  return result;
}
