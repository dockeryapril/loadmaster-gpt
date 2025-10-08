import type { LoadOpportunity, CostProfile } from '../types';

export function calculateProfit(load: LoadOpportunity, costProfile: CostProfile) {
  const revenue = load.rateAllIn + (load.fuelSurcharge ?? 0) + (load.accessorials ?? 0);

  const variableCosts = load.miles * costProfile.variableCostsPerMile;
  const fuelEfficiency = costProfile.fuelEfficiency > 0 ? costProfile.fuelEfficiency : 1;
  const fuelCost = (load.miles / fuelEfficiency) * costProfile.dieselPricePerGallon;
  const totalCosts = variableCosts + fuelCost + costProfile.fixedCostsPerDay;

  const miles = load.miles || 0;
  const rpmValue = miles > 0 ? revenue / miles : 0;
  const marginValue = revenue - totalCosts;
  const takeIt = marginValue >= costProfile.targetMargin;

  return {
    rpm: rpmValue.toFixed(2),
    margin: marginValue.toFixed(2),
    takeIt,
  };
}
