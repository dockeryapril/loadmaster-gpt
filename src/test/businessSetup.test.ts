import { describe, it, expect } from 'vitest';

// Business setup calculation functions
function calculateNetRpm(grossRpm: number, revenueSplitPercentage: number, weeklyFixedCosts: number, estimatedWeeklyMiles: number = 2500): number {
  const afterSplitRpm = grossRpm * (revenueSplitPercentage / 100);
  const fixedCostPerMile = weeklyFixedCosts / estimatedWeeklyMiles;
  return afterSplitRpm - fixedCostPerMile;
}

function calculateBusinessImpact(revenueSplitPercentage: number, weeklyFixedCosts: number, estimatedWeeklyMiles: number = 2500) {
  const splitImpact = 100 - revenueSplitPercentage;
  const fixedCostPerMile = weeklyFixedCosts / estimatedWeeklyMiles;
  
  return {
    splitImpact,
    fixedCostPerMile,
    totalImpactPerMile: (splitImpact / 100) + fixedCostPerMile
  };
}

describe('Business Setup Calculations', () => {
  describe('Revenue Split Calculations', () => {
    it('calculates 75% revenue split correctly', () => {
      const grossRpm = 2.50;
      const revenueSplit = 75;
      const weeklyCosts = 0;
      
      const netRpm = calculateNetRpm(grossRpm, revenueSplit, weeklyCosts);
      expect(netRpm).toBeCloseTo(1.875, 3);
    });

    it('calculates 85% revenue split correctly', () => {
      const grossRpm = 2.00;
      const revenueSplit = 85;
      const weeklyCosts = 0;
      
      const netRpm = calculateNetRpm(grossRpm, revenueSplit, weeklyCosts);
      expect(netRpm).toBeCloseTo(1.700, 3);
    });

    it('calculates 95% revenue split correctly', () => {
      const grossRpm = 3.00;
      const revenueSplit = 95;
      const weeklyCosts = 0;
      
      const netRpm = calculateNetRpm(grossRpm, revenueSplit, weeklyCosts);
      expect(netRpm).toBeCloseTo(2.850, 3);
    });

    it('handles 100% revenue split (no split)', () => {
      const grossRpm = 2.25;
      const revenueSplit = 100;
      const weeklyCosts = 0;
      
      const netRpm = calculateNetRpm(grossRpm, revenueSplit, weeklyCosts);
      expect(netRpm).toBeCloseTo(2.25, 3);
    });
  });

  describe('Weekly Fixed Costs Calculations', () => {
    it('calculates weekly costs impact with standard mileage', () => {
      const grossRpm = 2.50;
      const revenueSplit = 100;
      const weeklyCosts = 400;
      const weeklyMiles = 2500;
      
      const netRpm = calculateNetRpm(grossRpm, revenueSplit, weeklyCosts, weeklyMiles);
      const expectedCostPerMile = 400 / 2500; // 0.16
      expect(netRpm).toBeCloseTo(2.50 - expectedCostPerMile, 3);
    });

    it('calculates weekly costs impact with low mileage', () => {
      const grossRpm = 2.00;
      const revenueSplit = 100;
      const weeklyCosts = 300;
      const weeklyMiles = 1500;
      
      const netRpm = calculateNetRpm(grossRpm, revenueSplit, weeklyCosts, weeklyMiles);
      const expectedCostPerMile = 300 / 1500; // 0.20
      expect(netRpm).toBeCloseTo(2.00 - expectedCostPerMile, 3);
    });

    it('calculates weekly costs impact with high mileage', () => {
      const grossRpm = 2.75;
      const revenueSplit = 100;
      const weeklyCosts = 500;
      const weeklyMiles = 3500;
      
      const netRpm = calculateNetRpm(grossRpm, revenueSplit, weeklyCosts, weeklyMiles);
      const expectedCostPerMile = 500 / 3500; // ~0.143
      expect(netRpm).toBeCloseTo(2.75 - expectedCostPerMile, 3);
    });
  });

  describe('Combined Revenue Split and Fixed Costs', () => {
    it('calculates lease operator scenario (75% split + $400/week)', () => {
      const grossRpm = 2.50;
      const revenueSplit = 75;
      const weeklyCosts = 400;
      const weeklyMiles = 2500;
      
      const netRpm = calculateNetRpm(grossRpm, revenueSplit, weeklyCosts, weeklyMiles);
      const expectedAfterSplit = 2.50 * 0.75; // 1.875
      const expectedCostPerMile = 400 / 2500; // 0.16
      const expectedNet = expectedAfterSplit - expectedCostPerMile; // 1.715
      
      expect(netRpm).toBeCloseTo(expectedNet, 3);
    });

    it('calculates independent contractor scenario (95% split + $100/week)', () => {
      const grossRpm = 3.00;
      const revenueSplit = 95;
      const weeklyCosts = 100;
      const weeklyMiles = 2500;
      
      const netRpm = calculateNetRpm(grossRpm, revenueSplit, weeklyCosts, weeklyMiles);
      const expectedAfterSplit = 3.00 * 0.95; // 2.85
      const expectedCostPerMile = 100 / 2500; // 0.04
      const expectedNet = expectedAfterSplit - expectedCostPerMile; // 2.81
      
      expect(netRpm).toBeCloseTo(expectedNet, 3);
    });

    it('calculates company driver scenario (35% split + $0/week)', () => {
      const grossRpm = 2.25;
      const revenueSplit = 35;
      const weeklyCosts = 0;
      
      const netRpm = calculateNetRpm(grossRpm, revenueSplit, weeklyCosts);
      const expectedNet = 2.25 * 0.35; // 0.7875
      
      expect(netRpm).toBeCloseTo(expectedNet, 3);
    });
  });

  describe('Business Impact Analysis', () => {
    it('calculates impact for 75/25 lease scenario', () => {
      const impact = calculateBusinessImpact(75, 400);
      
      expect(impact.splitImpact).toBe(25);
      expect(impact.fixedCostPerMile).toBeCloseTo(0.16, 3);
      expect(impact.totalImpactPerMile).toBeCloseTo(0.41, 3); // 25% + 0.16
    });

    it('calculates impact for independent contractor scenario', () => {
      const impact = calculateBusinessImpact(95, 100);
      
      expect(impact.splitImpact).toBe(5);
      expect(impact.fixedCostPerMile).toBeCloseTo(0.04, 3);
      expect(impact.totalImpactPerMile).toBeCloseTo(0.09, 3); // 5% + 0.04
    });

    it('calculates impact for company driver scenario', () => {
      const impact = calculateBusinessImpact(35, 0);
      
      expect(impact.splitImpact).toBe(65);
      expect(impact.fixedCostPerMile).toBe(0);
      expect(impact.totalImpactPerMile).toBeCloseTo(0.65, 3);
    });
  });

  describe('Edge Cases and Validation', () => {
    it('handles zero revenue split', () => {
      const netRpm = calculateNetRpm(2.50, 0, 0);
      expect(netRpm).toBe(0);
    });

    it('handles negative weekly costs (should not happen but test defensive)', () => {
      const netRpm = calculateNetRpm(2.50, 100, -100);
      expect(netRpm).toBeCloseTo(2.54, 2); // Adds to RPM
    });

    it('handles very low weekly mileage', () => {
      const netRpm = calculateNetRpm(2.50, 100, 400, 100);
      const expectedCostPerMile = 400 / 100; // 4.00 per mile
      expect(netRpm).toBeCloseTo(2.50 - expectedCostPerMile, 2);
    });

    it('handles very high weekly mileage', () => {
      const netRpm = calculateNetRpm(2.50, 100, 400, 10000);
      const expectedCostPerMile = 400 / 10000; // 0.04 per mile
      expect(netRpm).toBeCloseTo(2.50 - expectedCostPerMile, 3);
    });

    it('validates revenue split percentage bounds', () => {
      // Test values outside normal range
      expect(() => calculateNetRpm(2.50, 150, 0)).not.toThrow();
      expect(() => calculateNetRpm(2.50, -10, 0)).not.toThrow();
      
      // But results should be mathematically correct
      const highSplit = calculateNetRpm(2.50, 150, 0);
      expect(highSplit).toBeCloseTo(3.75, 2); // 150% of 2.50
      
      const negativeSplit = calculateNetRpm(2.50, -10, 0);
      expect(negativeSplit).toBeCloseTo(-0.25, 2); // -10% of 2.50
    });
  });
});