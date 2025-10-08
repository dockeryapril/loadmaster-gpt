import { describe, it, expect } from 'vitest';
import { analyzePatterns, findSimilarLoads } from './patternAnalysis';
import { LoadEntrySnapshot } from '@/types/mvp';

describe('patternAnalysis', () => {
  describe('analyzePatterns', () => {
    it('should return empty insights for no decisions', () => {
      const result = analyzePatterns([]);
      
      expect(result.totalDecisions).toBe(0);
      expect(result.avgProfit).toBe(0);
      expect(result.bestRPM).toBe(0);
      expect(result.mostCommonRoute).toBeNull();
      expect(result.bookingRate).toBe(0);
      expect(result.rpmRanges).toHaveLength(0);
    });

    it('should calculate average profit correctly', () => {
      const decisions: LoadEntrySnapshot[] = [
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
          outcome: 'counter',
          createdAt: new Date().toISOString(),
        },
      ];

      const result = analyzePatterns(decisions);
      
      expect(result.avgProfit).toBe(545);
      expect(result.totalDecisions).toBe(2);
    });

    it('should find best RPM', () => {
      const decisions: LoadEntrySnapshot[] = [
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
        {
          id: '2',
          origin: 'C',
          destination: 'D',
          miles: 100,
          rate: 250,
          fsc: 0,
          tolls: 0,
          fuelCost: 50,
          profit: 200,
          rpm: 2.5,
          outcome: 'book',
          createdAt: new Date().toISOString(),
        },
      ];

      const result = analyzePatterns(decisions);
      
      expect(result.bestRPM).toBe(2.5);
    });

    it('should find most common route', () => {
      const decisions: LoadEntrySnapshot[] = [
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
          origin: 'Chicago',
          destination: 'Detroit',
          miles: 280,
          rate: 650,
          fsc: 40,
          tolls: 30,
          fuelCost: 120,
          profit: 540,
          rpm: 1.93,
          outcome: 'book',
          createdAt: new Date().toISOString(),
        },
        {
          id: '3',
          origin: 'Detroit',
          destination: 'Cleveland',
          miles: 170,
          rate: 400,
          fsc: 30,
          tolls: 20,
          fuelCost: 70,
          profit: 340,
          rpm: 2.0,
          outcome: 'pass',
          createdAt: new Date().toISOString(),
        },
      ];

      const result = analyzePatterns(decisions);
      
      expect(result.mostCommonRoute).toBe('Chicago → Detroit');
    });

    it('should calculate booking rate', () => {
      const decisions: LoadEntrySnapshot[] = [
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
        {
          id: '2',
          origin: 'C',
          destination: 'D',
          miles: 100,
          rate: 150,
          fsc: 0,
          tolls: 0,
          fuelCost: 50,
          profit: 100,
          rpm: 1.0,
          outcome: 'pass',
          createdAt: new Date().toISOString(),
        },
        {
          id: '3',
          origin: 'E',
          destination: 'F',
          miles: 100,
          rate: 180,
          fsc: 0,
          tolls: 0,
          fuelCost: 50,
          profit: 130,
          rpm: 1.3,
          outcome: 'counter',
          createdAt: new Date().toISOString(),
        },
        {
          id: '4',
          origin: 'G',
          destination: 'H',
          miles: 100,
          rate: 220,
          fsc: 0,
          tolls: 0,
          fuelCost: 50,
          profit: 170,
          rpm: 1.7,
          outcome: 'book',
          createdAt: new Date().toISOString(),
        },
      ];

      const result = analyzePatterns(decisions);
      
      expect(result.bookingRate).toBe(50); // 2 out of 4 = 50%
    });

    it('should categorize decisions into RPM ranges', () => {
      const decisions: LoadEntrySnapshot[] = [
        {
          id: '1',
          origin: 'A',
          destination: 'B',
          miles: 100,
          rate: 80,
          fsc: 0,
          tolls: 0,
          fuelCost: 50,
          profit: 30,
          rpm: 0.8,
          outcome: 'pass',
          createdAt: new Date().toISOString(),
        },
        {
          id: '2',
          origin: 'C',
          destination: 'D',
          miles: 100,
          rate: 130,
          fsc: 0,
          tolls: 0,
          fuelCost: 50,
          profit: 80,
          rpm: 1.3,
          outcome: 'counter',
          createdAt: new Date().toISOString(),
        },
        {
          id: '3',
          origin: 'E',
          destination: 'F',
          miles: 100,
          rate: 180,
          fsc: 0,
          tolls: 0,
          fuelCost: 50,
          profit: 130,
          rpm: 1.8,
          outcome: 'book',
          createdAt: new Date().toISOString(),
        },
        {
          id: '4',
          origin: 'G',
          destination: 'H',
          miles: 100,
          rate: 220,
          fsc: 0,
          tolls: 0,
          fuelCost: 50,
          profit: 170,
          rpm: 2.2,
          outcome: 'book',
          createdAt: new Date().toISOString(),
        },
      ];

      const result = analyzePatterns(decisions);
      
      expect(result.rpmRanges).toHaveLength(5);
      
      // Check $0.00-$1.00 range
      const range1 = result.rpmRanges.find(r => r.range === '$0.00-$1.00');
      expect(range1?.totalLoads).toBe(1);
      expect(range1?.bookedCount).toBe(0);
      expect(range1?.acceptanceRate).toBe(0);

      // Check $1.00-$1.50 range
      const range2 = result.rpmRanges.find(r => r.range === '$1.00-$1.50');
      expect(range2?.totalLoads).toBe(1);
      expect(range2?.bookedCount).toBe(0);
      expect(range2?.acceptanceRate).toBe(0);

      // Check $1.50-$2.00 range
      const range3 = result.rpmRanges.find(r => r.range === '$1.50-$2.00');
      expect(range3?.totalLoads).toBe(1);
      expect(range3?.bookedCount).toBe(1);
      expect(range3?.acceptanceRate).toBe(100);

      // Check $2.00-$2.50 range
      const range4 = result.rpmRanges.find(r => r.range === '$2.00-$2.50');
      expect(range4?.totalLoads).toBe(1);
      expect(range4?.bookedCount).toBe(1);
      expect(range4?.acceptanceRate).toBe(100);
    });
  });

  describe('findSimilarLoads', () => {
    const decisions: LoadEntrySnapshot[] = [
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
        origin: 'Chicago',
        destination: 'Detroit',
        miles: 280,
        rate: 650,
        fsc: 40,
        tolls: 30,
        fuelCost: 120,
        profit: 540,
        rpm: 2.0,
        outcome: 'book',
        createdAt: new Date().toISOString(),
      },
      {
        id: '3',
        origin: 'Detroit',
        destination: 'Cleveland',
        miles: 170,
        rate: 400,
        fsc: 30,
        tolls: 20,
        fuelCost: 70,
        profit: 340,
        rpm: 2.0,
        outcome: 'pass',
        createdAt: new Date().toISOString(),
      },
    ];

    it('should find similar loads with matching RPM and route', () => {
      const currentLoad = {
        rpm: 2.1,
        origin: 'Chicago',
        destination: 'Detroit',
      };

      const result = findSimilarLoads(currentLoad, decisions);
      
      expect(result).not.toBeNull();
      expect(result?.count).toBe(2);
      expect(result?.avgRPM).toBe(2.07);
      expect(result?.avgProfit).toBe(570);
      expect(result?.bookingRate).toBe(100);
    });

    it('should return null when no similar loads found', () => {
      const currentLoad = {
        rpm: 3.5,
        origin: 'New York',
        destination: 'Boston',
      };

      const result = findSimilarLoads(currentLoad, decisions);
      
      expect(result).toBeNull();
    });

    it('should match partial route names (case-insensitive)', () => {
      const currentLoad = {
        rpm: 2.05,
        origin: 'chicago',
        destination: 'detroit',
      };

      const result = findSimilarLoads(currentLoad, decisions);
      
      expect(result).not.toBeNull();
      expect(result?.count).toBe(2);
    });

    it('should respect RPM tolerance of ±$0.25', () => {
      const currentLoad = {
        rpm: 1.9, // Just outside tolerance for 2.14
        origin: 'Chicago',
        destination: 'Detroit',
      };

      const result = findSimilarLoads(currentLoad, decisions);
      
      // Should only match the 2.0 RPM load
      expect(result?.count).toBe(1);
    });
  });
});
