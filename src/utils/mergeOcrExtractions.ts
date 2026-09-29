export interface OcrExtractedData {
  origin?: string;
  destination?: string;
  miles?: string;
  deadheadMiles?: string;
  rate?: string;
  fsc?: string;
  tolls?: string;
  weight?: string;
  loadReference?: string;
  confidence?: number;
}

export interface OcrConflict {
  field: keyof OcrExtractedData;
  values: Array<{ value: string; image: number }>;
}

const MERGE_FIELDS: Array<keyof OcrExtractedData> = [
  'origin', 'destination', 'miles', 'deadheadMiles', 'rate',
  'fsc', 'tolls', 'weight', 'loadReference',
];

export function mergeOcrExtractions(items: OcrExtractedData[]) {
  const merged: OcrExtractedData = {};
  const sources: Partial<Record<keyof OcrExtractedData, number[]>> = {};
  const conflicts: OcrConflict[] = [];

  for (const field of MERGE_FIELDS) {
    const seen = new Map<string, { value: string; images: number[] }>();
    items.forEach((item, index) => {
      const raw = item[field];
      if (typeof raw !== 'string' || !raw.trim()) return;
      const value = raw.trim();
      const key = value.toLowerCase().replace(/[$,\s]/g, '');
      const existing = seen.get(key);
      if (existing) existing.images.push(index + 1);
      else seen.set(key, { value, images: [index + 1] });
    });

    const unique = [...seen.values()];
    if (unique.length === 1) {
      (merged as Record<string, unknown>)[field] = unique[0].value;
      sources[field] = unique[0].images;
    } else if (unique.length > 1) {
      conflicts.push({
        field,
        values: unique.flatMap((entry) =>
          entry.images.map((image) => ({ value: entry.value, image })),
        ),
      });
    }
  }

  const confidences = items
    .map((item) => item.confidence)
    .filter((value): value is number => typeof value === 'number');
  if (confidences.length) {
    merged.confidence = Math.min(...confidences);
  }

  return { merged, sources, conflicts };
}
