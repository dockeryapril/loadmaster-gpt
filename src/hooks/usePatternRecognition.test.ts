import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { usePatternRecognition, useSimilarLoads } from './usePatternRecognition';
import { useDecisionStore } from '@/store/useDecisionStore';
import { LoadEntrySnapshot } from '@/types/mvp';

describe('usePatternRecognition', () => {
  beforeEach(() => {
    // Clear store before each test
    useDecisionStore.setState({ history: [] });
  });

  describe('usePatternRecognition', () => {
    it('should return empty insights when no decisions', () => {
      const { result } = renderHook(() => usePatternRecognition());

      expect(result.current.insights.totalDecisions).toBe(0);
      expect(result.current.insights.avgProfit).toBe(0);
      expect(result.current.insights.bestRPM).toBe(0);
    });

    it('should calculate insights from store decisions', () => {
      const history: LoadEntrySnapshot[] = [
        {
          id: '1',
          origin: 'Chicago',
          destination: 'Detroit',
          miles: 280,
          rate: 700,
          fsc: 50,
          tolls: 30,
          fuelCost: 120,
          profit: 600,
          rpm: 2.14,
          outcome: 'book',
          createdAt: new Date().toISOString(),
        },
        {
          id: '2',
          origin: 'Detroit',
          destination: 'Chicago',
          miles: 280,
          rate: 600,
          fsc: 40,
          tolls: 30,
          fuelCost: 120,
          profit: 490,
          rpm: 1.75,
          outcome: 'pass',
          createdAt: new Date().toISOString(),
        },
      ];

      useDecisionStore.setState({ history });

      const { result } = renderHook(() => usePatternRecognition());

      expect(result.current.insights.totalDecisions).toBe(2);
      expect(result.current.insights.avgProfit).toBe(545);
      expect(result.current.insights.bestRPM).toBe(2.14);
      expect(result.current.insights.bookingRate).toBe(50);
    });

    it('should update when decisions change', () => {
      const { result, rerender } = renderHook(() => usePatternRecognition());

      expect(result.current.insights.totalDecisions).toBe(0);

      // Add a decision
      useDecisionStore.setState({
        history: [
          {
            id: '1',
            origin: 'A',
            destination: 'B',
            miles: 100,
            rate: 200,
            fsc: 0,
            tolls: 0,
            fuelCost: 50,
            profit: 150,
            rpm: 1.5,
            outcome: 'book',
            createdAt: new Date().toISOString(),
          },
        ],
      });

      rerender();

      expect(result.current.insights.totalDecisions).toBe(1);
      expect(result.current.insights.avgProfit).toBe(150);
    });
  });

  describe('useSimilarLoads', () => {
    it('should return null when no current load', () => {
      const { result } = renderHook(() => useSimilarLoads(null));

      expect(result.current.similarLoad).toBeNull();
    });

    it('should return null when no similar loads in history', () => {
      const currentLoad = {
        rpm: 2.0,
        origin: 'New York',
        destination: 'Boston',
      };

      useDecisionStore.setState({
        history: [
          {
            id: '1',
            origin: 'Chicago',
            destination: 'Detroit',
            miles: 280,
            rate: 700,
            fsc: 50,
            tolls: 30,
            fuelCost: 120,
            profit: 600,
            rpm: 2.14,
            outcome: 'book',
            createdAt: new Date().toISOString(),
          },
        ],
      });

      const { result } = renderHook(() => useSimilarLoads(currentLoad));

      expect(result.current.similarLoad).toBeNull();
    });

    it('should find similar loads', () => {
      const currentLoad = {
        rpm: 2.1,
        origin: 'Chicago',
        destination: 'Detroit',
      };

      useDecisionStore.setState({
        history: [
          {
            id: '1',
            origin: 'Chicago',
            destination: 'Detroit',
            miles: 280,
            rate: 700,
            fsc: 50,
            tolls: 30,
            fuelCost: 120,
            profit: 600,
            rpm: 2.0,
            outcome: 'book',
            createdAt: new Date().toISOString(),
          },
          {
            id: '2',
            origin: 'Chicago',
            destination: 'Detroit',
            miles: 280,
            rate: 650,
            fsc: 40,
            tolls: 30,
            fuelCost: 120,
            profit: 540,
            rpm: 2.2,
            outcome: 'book',
            createdAt: new Date().toISOString(),
          },
        ],
      });

      const { result } = renderHook(() => useSimilarLoads(currentLoad));

      expect(result.current.similarLoad).not.toBeNull();
      expect(result.current.similarLoad?.count).toBe(2);
      expect(result.current.similarLoad?.bookingRate).toBe(100);
    });

    it('should update when current load changes', () => {
      const { result, rerender } = renderHook(
        ({ load }) => useSimilarLoads(load),
        {
          initialProps: {
            load: null as { rpm: number; origin: string; destination: string } | null,
          },
        }
      );

      expect(result.current.similarLoad).toBeNull();

      useDecisionStore.setState({
        history: [
          {
            id: '1',
            origin: 'Chicago',
            destination: 'Detroit',
            miles: 280,
            rate: 700,
            fsc: 50,
            tolls: 30,
            fuelCost: 120,
            profit: 600,
            rpm: 2.0,
            outcome: 'book',
            createdAt: new Date().toISOString(),
          },
        ],
      });

      rerender({
        load: { rpm: 2.0, origin: 'Chicago', destination: 'Detroit' },
      });

      expect(result.current.similarLoad).not.toBeNull();
    });
  });
});
