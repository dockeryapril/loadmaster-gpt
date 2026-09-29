import type { CompensationProfile } from './compensation';
import { defaultCompensationProfile } from './compensation';
import type { CostAssumptions, Equipment } from './mvp';
import { defaultCostAssumptions } from './mvp';

export type OperationMode = 'solo' | 'team';

export interface DriverProfile {
  id: string;
  name: string;
  carrier?: string;
  operationMode: OperationMode;
  equipment: Equipment;
  compensation: CompensationProfile;
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
    costs: { ...defaultCostAssumptions },
    carrierPaysFuel: false,
    carrierPaysTolls: false,
  };
}
