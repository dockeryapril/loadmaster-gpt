import type { CompensationProfile } from './compensation';
import { defaultCompensationProfile } from './compensation';
import type { CostAssumptions, Equipment } from './mvp';
import { defaultCostAssumptions } from './mvp';

export type OperationMode = 'solo' | 'team';

export interface CompensationTargets {
  targetLoadedMileRate: number;
  minimumLoadedMileRate: number;
  targetDeadheadRate: number;
  minimumDeadheadRate: number;
  targetFlatPay: number;
  minimumFlatPay: number;
  targetPercentage: number;
  minimumPercentage: number;
}

export interface DriverProfile {
  id: string;
  name: string;
  carrier?: string;
  operationMode: OperationMode;
  equipment: Equipment;
  compensation: CompensationProfile;
  compensationTargets: CompensationTargets;
  costs: CostAssumptions;
  carrierPaysFuel: boolean;
  carrierPaysTolls: boolean;
}

export function createDriverProfile(
  id: string,
  name = 'My driving profile',
): DriverProfile {
  return {
    id,
    name,
    carrier: '',
    operationMode: 'solo',
    equipment: 'straight_truck',
    compensation: { ...defaultCompensationProfile },
    compensationTargets: {
      targetLoadedMileRate: 0,
      minimumLoadedMileRate: 0,
      targetDeadheadRate: 0,
      minimumDeadheadRate: 0,
      targetFlatPay: 0,
      minimumFlatPay: 0,
      targetPercentage: 0,
      minimumPercentage: 0,
    },
    costs: { ...defaultCostAssumptions },
    carrierPaysFuel: false,
    carrierPaysTolls: false,
  };
}
