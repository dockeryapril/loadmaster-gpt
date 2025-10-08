import { BusinessSetup } from '@/types/businessSetup';
import { UserSettings } from '@/types/load';

/**
 * Comprehensive business setup calculations for accurate net take-home
 */

export interface BusinessCostBreakdown {
  grossRevenue: number;
  revenueAfterSplit: number;
  fscAdjustment: number;
  deadheadPay: number;
  detentionPay: number;
  weeklyFixedCosts: number;
  weeklyFixedCostPerMile: number;
  adminFees: number;
  factoringFees: number;
  fuelCosts: number;
  tollCosts: number;
  netTakeHome: number;
}

export interface EnhancedLoadCalculation {
  rpm: number;
  grossRpm: number;
  netRpm: number;
  profit: number;
  totalMiles: number;
  netRate: number;
  businessCostBreakdown: BusinessCostBreakdown;
  isBusinessSetupUsed: boolean;
  missingSetupWarnings: string[];
}

/**
 * Calculate comprehensive net take-home using business setup data
 */
export function calculateNetTakeHome(
  miles: number,
  rate: number,
  fsc: number = 0,
  tolls: number = 0,
  deadheadMiles: number = 0,
  fuelCost: number = 0,
  businessSetup: BusinessSetup | null,
  settings: UserSettings
): EnhancedLoadCalculation {
  const totalMiles = miles + deadheadMiles;
  const grossRevenue = rate + fsc;
  const missingSetupWarnings: string[] = [];
  
  // Track if we're using business setup data
  const isBusinessSetupUsed = !!businessSetup;
  
  // Revenue Split Calculation
  const revenueSplitPercentage = businessSetup?.revenue_split_percentage || settings?.revenueSplitPercentage || 100;
  const revenueAfterSplit = grossRevenue * (revenueSplitPercentage / 100);
  
  // FSC Handling
  let fscAdjustment = 0;
  if (businessSetup?.fsc_handling) {
    switch (businessSetup.fsc_handling) {
      case 'driver_receives_fsc':
        fscAdjustment = fsc; // Driver gets full FSC
        break;
      case 'carrier_keeps_fsc':
        fscAdjustment = -fsc; // Remove FSC from driver revenue
        break;
      case 'fsc_in_margin':
        fscAdjustment = 0; // Already included in rate
        break;
    }
  } else if (fsc > 0) {
    missingSetupWarnings.push('FSC handling not configured - assuming driver receives FSC');
  }
  
  // Deadhead Compensation
  let deadheadPay = 0;
  if (deadheadMiles > 0 && businessSetup?.deadhead_compensation_type) {
    switch (businessSetup.deadhead_compensation_type) {
      case 'per_mile':
        deadheadPay = deadheadMiles * (businessSetup.deadhead_compensation_rate || 0);
        break;
      case 'percentage':
        deadheadPay = rate * ((businessSetup.deadhead_compensation_rate || 0) / 100);
        break;
      case 'flat_rate':
        deadheadPay = businessSetup.deadhead_compensation_rate || 0;
        break;
      case 'varies_by_load': {
        // Use average of low/high rates
        const avgRate = ((businessSetup.deadhead_rate_low || 0) + (businessSetup.deadhead_rate_high || 0)) / 2;
        deadheadPay = deadheadMiles * avgRate;
        break;
      }
      case 'tiered_by_distance':
        deadheadPay = calculateTieredDeadheadPay(deadheadMiles, businessSetup);
        break;
      case 'minimum_plus_variable': {
        const minimumPay = deadheadMiles * (businessSetup.deadhead_minimum_rate || 0);
        deadheadPay = Math.max(minimumPay, deadheadPay); // Add variable logic if needed
        break;
      }
      case 'none':
        deadheadPay = 0;
        break;
      default:
        deadheadPay = 0;
        break;
    }
  } else if (deadheadMiles > 0) {
    missingSetupWarnings.push('Deadhead compensation not configured - assuming no compensation');
  }
  
  // Weekly Fixed Costs
  const weeklyTruckPayment = businessSetup?.weekly_truck_payment || 0;
  const weeklyInsurancePayment = businessSetup?.weekly_insurance_payment || 0;
  const weeklyEscrowPayment = businessSetup?.weekly_escrow_payment || 0;
  const otherWeeklyDeductions = businessSetup?.other_weekly_deductions || 0;
  
  const totalWeeklyFixedCosts = weeklyTruckPayment + weeklyInsurancePayment + weeklyEscrowPayment + otherWeeklyDeductions;
  
  // Use business setup costs if available, otherwise fall back to settings
  const weeklyFixedCosts = totalWeeklyFixedCosts > 0 ? totalWeeklyFixedCosts : (settings?.weeklyFixedCosts || 0);
  
  // Calculate per-mile fixed cost (assuming 2500 miles per week industry average)
  const estimatedWeeklyMiles = 2500;
  const weeklyFixedCostPerMile = weeklyFixedCosts / estimatedWeeklyMiles;
  
  // Administrative Fees
  const adminFeePercentage = businessSetup?.admin_fee_percentage || 0;
  const adminFeeFlat = businessSetup?.admin_fee_flat || 0;
  const adminFees = (revenueAfterSplit * (adminFeePercentage / 100)) + adminFeeFlat;
  
  // Factoring Fees
  const factoringFeePercentage = businessSetup?.factoring_fee_percentage || 0;
  const factoringFees = revenueAfterSplit * (factoringFeePercentage / 100);
  
  // Detention Pay (if applicable)
  const detentionPay = 0; // This would need to be passed in as a parameter for specific loads
  
  // Fuel Cost Handling
  let adjustedFuelCosts = fuelCost;
  if (businessSetup?.fuel_responsibility === 'carrier_pays') {
    adjustedFuelCosts = 0; // Carrier pays, so no fuel cost to driver
  } else if (businessSetup?.fuel_responsibility === 'reimbursed' && businessSetup.fuel_reimbursement_rate) {
    // Calculate reimbursement and subtract from fuel cost
    const gallonsUsed = totalMiles / (settings?.mpg || 6.5);
    const reimbursement = gallonsUsed * businessSetup.fuel_reimbursement_rate;
    adjustedFuelCosts = Math.max(0, fuelCost - reimbursement);
  }
  
  // Toll Handling
  let adjustedTollCosts = tolls;
  if (businessSetup?.toll_responsibility === 'carrier_pays') {
    adjustedTollCosts = 0; // Carrier pays tolls
  } else if (businessSetup?.toll_responsibility === 'reimbursed') {
    adjustedTollCosts = 0; // Assuming full reimbursement
  }
  
  // Final Net Take-Home Calculation
  const totalRevenue = revenueAfterSplit + fscAdjustment + deadheadPay + detentionPay;
  const totalCosts = (weeklyFixedCostPerMile * totalMiles) + adminFees + factoringFees + adjustedFuelCosts + adjustedTollCosts;
  const netTakeHome = totalRevenue - totalCosts;
  
  // RPM Calculations
  const grossRpm = totalMiles > 0 ? grossRevenue / totalMiles : 0;
  const netRpm = totalMiles > 0 ? netTakeHome / totalMiles : 0;
  
  const businessCostBreakdown: BusinessCostBreakdown = {
    grossRevenue,
    revenueAfterSplit,
    fscAdjustment,
    deadheadPay,
    detentionPay,
    weeklyFixedCosts,
    weeklyFixedCostPerMile,
    adminFees,
    factoringFees,
    fuelCosts: adjustedFuelCosts,
    tollCosts: adjustedTollCosts,
    netTakeHome
  };
  
  return {
    rpm: netRpm,
    grossRpm,
    netRpm,
    profit: netTakeHome,
    totalMiles,
    netRate: netTakeHome,
    businessCostBreakdown,
    isBusinessSetupUsed,
    missingSetupWarnings
  };
}

/**
 * Calculate tiered deadhead pay based on distance tiers
 */
function calculateTieredDeadheadPay(deadheadMiles: number, businessSetup: BusinessSetup): number {
  let totalPay = 0;
  let remainingMiles = deadheadMiles;
  
  const tier1Distance = businessSetup.deadhead_tier_1_distance || 0;
  const tier1Rate = businessSetup.deadhead_tier_1_rate || 0;
  const tier2Distance = businessSetup.deadhead_tier_2_distance || 0;
  const tier2Rate = businessSetup.deadhead_tier_2_rate || 0;
  const tier3Rate = businessSetup.deadhead_tier_3_rate || 0;
  
  // Tier 1
  if (remainingMiles > 0 && tier1Distance > 0) {
    const tier1Miles = Math.min(remainingMiles, tier1Distance);
    totalPay += tier1Miles * tier1Rate;
    remainingMiles -= tier1Miles;
  }
  
  // Tier 2
  if (remainingMiles > 0 && tier2Distance > 0) {
    const tier2Miles = Math.min(remainingMiles, tier2Distance - tier1Distance);
    totalPay += tier2Miles * tier2Rate;
    remainingMiles -= tier2Miles;
  }
  
  // Tier 3 (remaining miles)
  if (remainingMiles > 0) {
    totalPay += remainingMiles * tier3Rate;
  }
  
  return totalPay;
}

/**
 * Check if business setup is complete enough for accurate calculations
 */
export function isBusinessSetupSufficient(businessSetup: BusinessSetup | null): boolean {
  if (!businessSetup) return false;
  
  const requiredFields = [
    'revenue_split_percentage',
    'fuel_responsibility',
    'deadhead_compensation_type',
    'fsc_handling'
  ];
  
  return requiredFields.every(field => businessSetup[field as keyof BusinessSetup] !== undefined);
}

/**
 * Get setup completeness warnings for UI display
 */
export function getSetupCompletenessWarnings(businessSetup: BusinessSetup | null): string[] {
  const warnings: string[] = [];
  
  if (!businessSetup) {
    warnings.push('Business setup not configured - calculations may be inaccurate');
    return warnings;
  }
  
  if (!businessSetup.revenue_split_percentage) {
    warnings.push('Revenue split percentage not set');
  }
  
  if (!businessSetup.fuel_responsibility) {
    warnings.push('Fuel responsibility not configured');
  }
  
  if (!businessSetup.deadhead_compensation_type) {
    warnings.push('Deadhead compensation not configured');
  }
  
  if (!businessSetup.fsc_handling) {
    warnings.push('FSC handling not configured');
  }
  
  return warnings;
}