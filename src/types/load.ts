/**
 * Simplified profit calculation for reboot
 * Phase 2 will add detailed cost breakdown
 */
export const calculateProfit = (
  rate: number,
  fsc: number,
  tolls: number,
  fuelCost: number
): number => {
  return rate + fsc - tolls - fuelCost;
};