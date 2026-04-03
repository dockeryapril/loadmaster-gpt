import type { CostAssumptions, LoadEntrySnapshot } from '@/types/mvp';

export interface ThresholdRecommendation {
  recommended: Pick<CostAssumptions, 'goodRpm' | 'fairRpm' | 'goodProfit' | 'fairProfit'>;
  sampleSize: number;
  confidence: 'low' | 'medium' | 'high';
  reasons: string[];
  delta: {
    goodRpmPct: number;
    fairRpmPct: number;
    goodProfitPct: number;
    fairProfitPct: number;
  };
}

const MIN_SAMPLE_SIZE = 30;
const MIN_RPM_CHANGE = 0.03;
const MIN_PROFIT_CHANGE = 40;
const MIN_RPM_GAP = 0.05;
const MIN_PROFIT_GAP = 50;

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

const percentile = (values: number[], p: number): number => {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const index = (sorted.length - 1) * p;
  const lower = Math.floor(index);
  const upper = Math.ceil(index);
  if (lower === upper) return sorted[lower];
  const weight = index - lower;
  return sorted[lower] * (1 - weight) + sorted[upper] * weight;
};

const calculateConfidence = (sampleSize: number): 'low' | 'medium' | 'high' => {
  if (sampleSize >= 80) return 'high';
  if (sampleSize >= 50) return 'medium';
  return 'low';
};

/**
 * Suggest threshold updates from recent user decision outcomes.
 *
 * Uses loads that were either booked or counters that were accepted as
 * the positive baseline for percentile-driven recommendations.
 */
export function computeThresholdRecommendation(
  history: LoadEntrySnapshot[],
  current: CostAssumptions,
): ThresholdRecommendation | null {
  const recent = history
    .slice(0, 100)
    .filter((entry) => Number.isFinite(entry.rpm) && Number.isFinite(entry.profit));

  if (recent.length < MIN_SAMPLE_SIZE) {
    return null;
  }

  const successful = recent.filter(
    (entry) => entry.outcome === 'book' || (entry.outcome === 'counter' && entry.counterResult === 'accepted'),
  );

  const baseline = successful.length >= MIN_SAMPLE_SIZE ? successful : recent;

  const rpmValues = baseline.map((entry) => entry.rpm);
  const profitValues = baseline.map((entry) => entry.profit);

  let fairRpm = clamp(percentile(rpmValues, 0.4), 0.1, 10);
  let goodRpm = clamp(percentile(rpmValues, 0.7), 0.1, 10);
  let fairProfit = clamp(percentile(profitValues, 0.4), 0, 50000);
  let goodProfit = clamp(percentile(profitValues, 0.7), 0, 50000);

  // Enforce ordering and healthy separation.
  if (goodRpm <= fairRpm) {
    goodRpm = fairRpm + MIN_RPM_GAP;
  }
  if (goodProfit <= fairProfit) {
    goodProfit = fairProfit + MIN_PROFIT_GAP;
  }

  fairRpm = Number(fairRpm.toFixed(2));
  goodRpm = Number(goodRpm.toFixed(2));
  fairProfit = Math.round(fairProfit);
  goodProfit = Math.round(goodProfit);

  const rpmChanged =
    Math.abs(goodRpm - current.goodRpm) >= MIN_RPM_CHANGE ||
    Math.abs(fairRpm - current.fairRpm) >= MIN_RPM_CHANGE;

  const profitChanged =
    Math.abs(goodProfit - current.goodProfit) >= MIN_PROFIT_CHANGE ||
    Math.abs(fairProfit - current.fairProfit) >= MIN_PROFIT_CHANGE;

  if (!rpmChanged && !profitChanged) {
    return null;
  }

  const acceptedCounters = recent.filter(
    (entry) => entry.outcome === 'counter' && entry.counterResult === 'accepted',
  ).length;

  const reasons = [
    `Analyzed ${recent.length} recent loads`,
    successful.length >= MIN_SAMPLE_SIZE
      ? `Using ${successful.length} successful loads (booked + accepted counters)`
      : 'Not enough successful loads yet, using all recent loads as baseline',
  ];

  if (acceptedCounters > 0) {
    reasons.push(`${acceptedCounters} counters were accepted in this sample`);
  }

  const delta = {
    goodRpmPct: ((goodRpm - current.goodRpm) / Math.max(current.goodRpm, 0.01)) * 100,
    fairRpmPct: ((fairRpm - current.fairRpm) / Math.max(current.fairRpm, 0.01)) * 100,
    goodProfitPct: ((goodProfit - current.goodProfit) / Math.max(current.goodProfit, 1)) * 100,
    fairProfitPct: ((fairProfit - current.fairProfit) / Math.max(current.fairProfit, 1)) * 100,
  };

  return {
    recommended: {
      goodRpm,
      fairRpm,
      goodProfit,
      fairProfit,
    },
    sampleSize: recent.length,
    confidence: calculateConfidence(baseline.length),
    reasons,
    delta,
  };
}
