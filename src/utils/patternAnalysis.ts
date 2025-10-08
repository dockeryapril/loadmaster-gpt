import { LoadEntrySnapshot } from '@/types/mvp';

export interface RPMRangeStats {
  range: string;
  minRPM: number;
  maxRPM: number;
  totalLoads: number;
  bookedCount: number;
  acceptanceRate: number;
}

export interface PatternInsights {
  rpmRanges: RPMRangeStats[];
  avgProfit: number;
  bestRPM: number;
  mostCommonRoute: string | null;
  totalDecisions: number;
  bookingRate: number;
}

export interface SimilarLoad {
  avgRPM: number;
  avgProfit: number;
  bookingRate: number;
  count: number;
}

/**
 * Analyzes decision history to generate pattern insights
 */
export function analyzePatterns(decisions: LoadEntrySnapshot[]): PatternInsights {
  if (decisions.length === 0) {
    return {
      rpmRanges: [],
      avgProfit: 0,
      bestRPM: 0,
      mostCommonRoute: null,
      totalDecisions: 0,
      bookingRate: 0,
    };
  }

  // Calculate RPM range statistics
  const rpmRanges = calculateRPMRanges(decisions);

  // Calculate average profit
  const totalProfit = decisions.reduce((sum, d) => sum + d.profit, 0);
  const avgProfit = totalProfit / decisions.length;

  // Find best RPM
  const bestRPM = Math.max(...decisions.map(d => d.rpm));

  // Find most common route
  const mostCommonRoute = findMostCommonRoute(decisions);

  // Calculate booking rate
  const bookedCount = decisions.filter(d => d.outcome === 'book').length;
  const bookingRate = (bookedCount / decisions.length) * 100;

  return {
    rpmRanges,
    avgProfit,
    bestRPM,
    mostCommonRoute,
    totalDecisions: decisions.length,
    bookingRate,
  };
}

/**
 * Categorizes decisions into RPM ranges and calculates acceptance rates
 */
function calculateRPMRanges(decisions: LoadEntrySnapshot[]): RPMRangeStats[] {
  const ranges = [
    { label: '$0.00-$1.00', min: 0, max: 1 },
    { label: '$1.00-$1.50', min: 1, max: 1.5 },
    { label: '$1.50-$2.00', min: 1.5, max: 2 },
    { label: '$2.00-$2.50', min: 2, max: 2.5 },
    { label: '$2.50+', min: 2.5, max: Infinity },
  ];

  return ranges.map(({ label, min, max }) => {
    const loadsInRange = decisions.filter(d => d.rpm >= min && d.rpm < max);
    const bookedCount = loadsInRange.filter(d => d.outcome === 'book').length;
    const totalLoads = loadsInRange.length;
    const acceptanceRate = totalLoads > 0 ? (bookedCount / totalLoads) * 100 : 0;

    return {
      range: label,
      minRPM: min,
      maxRPM: max,
      totalLoads,
      bookedCount,
      acceptanceRate,
    };
  });
}

/**
 * Finds the most frequently traveled route
 */
function findMostCommonRoute(decisions: LoadEntrySnapshot[]): string | null {
  if (decisions.length === 0) return null;

  const routeCounts = new Map<string, number>();

  decisions.forEach(d => {
    const route = `${d.origin} → ${d.destination}`;
    routeCounts.set(route, (routeCounts.get(route) || 0) + 1);
  });

  let maxCount = 0;
  let mostCommon: string | null = null;

  routeCounts.forEach((count, route) => {
    if (count > maxCount) {
      maxCount = count;
      mostCommon = route;
    }
  });

  return mostCommon;
}

/**
 * Finds similar loads based on RPM and route proximity
 */
export function findSimilarLoads(
  currentLoad: { rpm: number; origin: string; destination: string },
  decisions: LoadEntrySnapshot[]
): SimilarLoad | null {
  // Find loads with similar RPM (±$0.25/mi) and same route
  const similarLoads = decisions.filter(d => {
    const rpmMatch = Math.abs(d.rpm - currentLoad.rpm) <= 0.25;
    const routeMatch = 
      d.origin.toLowerCase().includes(currentLoad.origin.toLowerCase()) &&
      d.destination.toLowerCase().includes(currentLoad.destination.toLowerCase());
    
    return rpmMatch && routeMatch;
  });

  if (similarLoads.length === 0) return null;

  const totalProfit = similarLoads.reduce((sum, d) => sum + d.profit, 0);
  const totalRPM = similarLoads.reduce((sum, d) => sum + d.rpm, 0);
  const bookedCount = similarLoads.filter(d => d.outcome === 'book').length;

  return {
    avgRPM: totalRPM / similarLoads.length,
    avgProfit: totalProfit / similarLoads.length,
    bookingRate: (bookedCount / similarLoads.length) * 100,
    count: similarLoads.length,
  };
}
