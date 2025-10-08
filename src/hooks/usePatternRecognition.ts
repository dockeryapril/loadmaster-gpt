import { useMemo } from 'react';
import { useDecisionStore } from '@/store/useDecisionStore';
import { analyzePatterns, findSimilarLoads, PatternInsights, SimilarLoad } from '@/utils/patternAnalysis';

/**
 * Hook to get pattern insights from decision history
 */
export function usePatternRecognition() {
  const history = useDecisionStore(state => state.history);

  const insights = useMemo<PatternInsights>(() => {
    return analyzePatterns(history);
  }, [history]);

  return { insights };
}

/**
 * Hook to find similar loads for current calculation
 */
export function useSimilarLoads(currentLoad: { rpm: number; origin: string; destination: string } | null) {
  const history = useDecisionStore(state => state.history);

  const similarLoad = useMemo<SimilarLoad | null>(() => {
    if (!currentLoad) return null;
    return findSimilarLoads(currentLoad, history);
  }, [currentLoad, history]);

  return { similarLoad };
}
