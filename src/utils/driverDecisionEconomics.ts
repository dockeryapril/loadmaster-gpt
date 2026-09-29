import type { CompensationType, CompensationResult } from '@/types/compensation';

export interface DriverDecisionEconomics {
  basis: 'truck' | 'driver';
  pay: number;
  expenses: number;
  net: number;
  allInMiles: number;
  effectiveRpm: number;
}

export function calculateDriverDecisionEconomics(
  compensationType: CompensationType,
  compensation: CompensationResult,
  truckProfit: number,
  loadedMiles: number,
  deadheadMiles: number,
  driverExpenses = 0,
): DriverDecisionEconomics {
  const allInMiles = loadedMiles + deadheadMiles;

  if (compensationType === 'truck') {
    return {
      basis: 'truck',
      pay: compensation.pay,
      expenses: Math.max(0, compensation.pay - truckProfit),
      net: truckProfit,
      allInMiles,
      effectiveRpm: allInMiles > 0 ? truckProfit / allInMiles : 0,
    };
  }

  const net = compensation.pay - driverExpenses;
  return {
    basis: 'driver',
    pay: compensation.pay,
    expenses: driverExpenses,
    net,
    allInMiles,
    effectiveRpm: allInMiles > 0 ? net / allInMiles : 0,
  };
}
