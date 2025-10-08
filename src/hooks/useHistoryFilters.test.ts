import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useHistoryFilters } from './useHistoryFilters';
import type { LoadEntrySnapshot } from '@/types/mvp';

const mockHistory: LoadEntrySnapshot[] = [
  {
    id: '1',
    createdAt: new Date('2025-10-05T10:00:00Z').toISOString(),
    outcome: 'book',
    origin: 'Chicago, IL',
    destination: 'New York, NY',
    miles: 800,
    rate: 2400,
    fsc: 200,
    tolls: 50,
    fuelCost: 400,
    profit: 2150,
    rpm: 2.69,
  },
  {
    id: '2',
    createdAt: new Date('2025-10-06T12:00:00Z').toISOString(),
    outcome: 'pass',
    origin: 'Los Angeles, CA',
    destination: 'Phoenix, AZ',
    miles: 400,
    rate: 600,
    fsc: 50,
    tolls: 0,
    fuelCost: 200,
    profit: 450,
    rpm: 1.13,
  },
  {
    id: '3',
    createdAt: new Date('2025-10-07T14:00:00Z').toISOString(),
    outcome: 'counter',
    origin: 'Dallas, TX',
    destination: 'Houston, TX',
    miles: 250,
    rate: 500,
    fsc: 25,
    tolls: 10,
    fuelCost: 150,
    profit: 365,
    rpm: 1.46,
  },
  {
    id: '4',
    createdAt: new Date('2025-10-08T16:00:00Z').toISOString(),
    outcome: 'book',
    origin: 'Miami, FL',
    destination: 'Atlanta, GA',
    miles: 650,
    rate: 1800,
    fsc: 150,
    tolls: 30,
    fuelCost: 320,
    profit: 1600,
    rpm: 2.46,
  },
];

describe('useHistoryFilters', () => {
  describe('outcome filter', () => {
    it('should show all entries when filter is "all"', () => {
      const { result } = renderHook(() => useHistoryFilters(mockHistory));
      expect(result.current.filtered).toHaveLength(4);
    });

    it('should filter by "book" outcome', () => {
      const { result } = renderHook(() => useHistoryFilters(mockHistory));
      
      act(() => {
        result.current.setOutcomeFilter('book');
      });

      expect(result.current.filtered).toHaveLength(2);
      expect(result.current.filtered.every((entry) => entry.outcome === 'book')).toBe(true);
    });

    it('should filter by "pass" outcome', () => {
      const { result } = renderHook(() => useHistoryFilters(mockHistory));
      
      act(() => {
        result.current.setOutcomeFilter('pass');
      });

      expect(result.current.filtered).toHaveLength(1);
      expect(result.current.filtered[0].outcome).toBe('pass');
    });

    it('should filter by "counter" outcome', () => {
      const { result } = renderHook(() => useHistoryFilters(mockHistory));
      
      act(() => {
        result.current.setOutcomeFilter('counter');
      });

      expect(result.current.filtered).toHaveLength(1);
      expect(result.current.filtered[0].outcome).toBe('counter');
    });
  });

  describe('search filter', () => {
    it('should search by origin (case-insensitive)', () => {
      const { result } = renderHook(() => useHistoryFilters(mockHistory));
      
      act(() => {
        result.current.setSearchQuery('chicago');
      });

      expect(result.current.filtered).toHaveLength(1);
      expect(result.current.filtered[0].origin).toBe('Chicago, IL');
    });

    it('should search by destination (case-insensitive)', () => {
      const { result } = renderHook(() => useHistoryFilters(mockHistory));
      
      act(() => {
        result.current.setSearchQuery('atlanta');
      });

      expect(result.current.filtered).toHaveLength(1);
      expect(result.current.filtered[0].destination).toBe('Atlanta, GA');
    });

    it('should handle partial matches', () => {
      const { result } = renderHook(() => useHistoryFilters(mockHistory));
      
      act(() => {
        result.current.setSearchQuery('angeles');
      });

      expect(result.current.filtered).toHaveLength(1);
      expect(result.current.filtered[0].origin).toBe('Los Angeles, CA');
    });

    it('should return empty array for no matches', () => {
      const { result } = renderHook(() => useHistoryFilters(mockHistory));
      
      act(() => {
        result.current.setSearchQuery('nonexistent city');
      });

      expect(result.current.filtered).toHaveLength(0);
    });
  });

  describe('sorting', () => {
    it('should sort by newest first (default)', () => {
      const { result } = renderHook(() => useHistoryFilters(mockHistory));
      
      const dates = result.current.filtered.map((entry) => new Date(entry.createdAt).getTime());
      for (let i = 0; i < dates.length - 1; i++) {
        expect(dates[i]).toBeGreaterThanOrEqual(dates[i + 1]);
      }
    });

    it('should sort by highest profit', () => {
      const { result } = renderHook(() => useHistoryFilters(mockHistory));
      
      act(() => {
        result.current.setSortBy('profit-high');
      });

      const profits = result.current.filtered.map((entry) => entry.profit);
      expect(profits[0]).toBe(2150); // Highest
      expect(profits[profits.length - 1]).toBe(365); // Lowest
    });

    it('should sort by lowest profit', () => {
      const { result } = renderHook(() => useHistoryFilters(mockHistory));
      
      act(() => {
        result.current.setSortBy('profit-low');
      });

      const profits = result.current.filtered.map((entry) => entry.profit);
      expect(profits[0]).toBe(365); // Lowest
      expect(profits[profits.length - 1]).toBe(2150); // Highest
    });

    it('should sort by best RPM', () => {
      const { result } = renderHook(() => useHistoryFilters(mockHistory));
      
      act(() => {
        result.current.setSortBy('rpm-high');
      });

      const rpms = result.current.filtered.map((entry) => entry.rpm);
      expect(rpms[0]).toBeGreaterThanOrEqual(rpms[1]);
      expect(rpms[1]).toBeGreaterThanOrEqual(rpms[2]);
    });

    it('should sort by worst RPM', () => {
      const { result } = renderHook(() => useHistoryFilters(mockHistory));
      
      act(() => {
        result.current.setSortBy('rpm-low');
      });

      const rpms = result.current.filtered.map((entry) => entry.rpm);
      expect(rpms[0]).toBeLessThanOrEqual(rpms[1]);
      expect(rpms[1]).toBeLessThanOrEqual(rpms[2]);
    });
  });

  describe('combined filters', () => {
    it('should apply outcome filter and search together', () => {
      const { result } = renderHook(() => useHistoryFilters(mockHistory));
      
      act(() => {
        result.current.setOutcomeFilter('book');
        result.current.setSearchQuery('chicago');
      });

      expect(result.current.filtered).toHaveLength(1);
      expect(result.current.filtered[0].outcome).toBe('book');
      expect(result.current.filtered[0].origin).toBe('Chicago, IL');
    });

    it('should apply all filters and sorting together', () => {
      const { result } = renderHook(() => useHistoryFilters(mockHistory));
      
      act(() => {
        result.current.setOutcomeFilter('book');
        result.current.setSortBy('profit-high');
      });

      expect(result.current.filtered).toHaveLength(2);
      expect(result.current.filtered[0].profit).toBeGreaterThan(result.current.filtered[1].profit);
    });
  });
});
