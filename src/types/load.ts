import type { CostAssumptions } from './mvp';

/**
 * Simplified profit calculation (legacy, Phase 1)
 */
export const calculateProfit = (
  rate: number,
  fsc: number,
  tolls: number,
  fuelCost: number
): number => {
  return rate + fsc - tolls - fuelCost;
};

/**
 * Detailed profit calculation with cost breakdown (Phase 2)
 */
export interface ProfitBreakdown {
  grossRevenue: number;
  yourShare: number;
  splitPercent: number;
  linehaulRate: number;
  fsc: number;
  fuelCost: number;
  tollCost: number;
  variableCosts: number;
  fixedCosts: number;
  totalCosts: number;
  netProfit: number;
}

export interface DetailedProfitCalculation {
  profit: number;
  breakdown: ProfitBreakdown;
  fuelPriceUsed: number;
  timestamp: string;
}

export function calculateDetailedProfit(
  rate: number,
  fsc: number,
  tolls: number,
  miles: number,
  costProfile: CostAssumptions,
  splitPercent: number = 100
): DetailedProfitCalculation {
  // Revenue
  const grossRevenue = rate + fsc;
  const yourShare = grossRevenue * (splitPercent / 100);

  // Costs
  const fuelCost = miles > 0 && costProfile.averageMPG > 0
    ? (miles / costProfile.averageMPG) * costProfile.fuelPricePerGallon
    : 0;
  
  const variableCosts = miles * costProfile.variableCostPerMile;
  
  // Prorate fixed costs based on industry average of 2500 miles/week
  const fixedCosts = miles > 0
    ? (costProfile.dailyFixedCosts / 2500) * miles
    : 0;

  const totalCosts = fuelCost + tolls + variableCosts + fixedCosts;
  const netProfit = yourShare - totalCosts;

  return {
    profit: netProfit,
    breakdown: {
      grossRevenue,
      yourShare,
      splitPercent,
      linehaulRate: rate,
      fsc,
      fuelCost,
      tollCost: tolls,
      variableCosts,
      fixedCosts,
      totalCosts,
      netProfit,
    },
    fuelPriceUsed: costProfile.fuelPricePerGallon,
    timestamp: new Date().toISOString(),
  };
}
