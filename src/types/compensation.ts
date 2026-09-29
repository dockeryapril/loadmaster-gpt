export type CompensationType = 'truck' | 'percentage' | 'per_mile' | 'flat';

export interface CompensationProfile {
  type: CompensationType;
  percentage: number;
  perLoadedMile: number;
  perDeadheadMile: number;
  flatRate: number;
  deadheadFlatPay: number;
  deadheadFsc: number;
  includeFscInPercentage: boolean;
}

export const defaultCompensationProfile: CompensationProfile = {
  type: 'truck',
  percentage: 100,
  perLoadedMile: 0,
  perDeadheadMile: 0,
  flatRate: 0,
  deadheadFlatPay: 0,
  deadheadFsc: 0,
  includeFscInPercentage: true,
};

export interface CompensationResult {
  pay: number;
  basePay: number;
  deadheadPay: number;
  deadheadFsc: number;
  payBase: number;
}

export function calculateCompensation(
  profile: CompensationProfile,
  linehaul: number,
  fsc: number,
  loadedMiles: number,
  deadheadMiles: number,
): CompensationResult {
  let basePay = 0;
  let payBase = 0;

  switch (profile.type) {
    case 'percentage':
      payBase = linehaul + (profile.includeFscInPercentage ? fsc : 0);
      basePay = payBase * (profile.percentage / 100);
      break;
    case 'per_mile':
      payBase = loadedMiles;
      basePay = loadedMiles * profile.perLoadedMile;
      break;
    case 'flat':
      payBase = profile.flatRate;
      basePay = profile.flatRate;
      break;
    case 'truck':
    default:
      payBase = linehaul + fsc;
      basePay = payBase;
      break;
  }

  const deadheadPay =
    profile.type === 'per_mile'
      ? deadheadMiles * profile.perDeadheadMile
      : profile.deadheadFlatPay;

  return {
    pay: basePay + deadheadPay + profile.deadheadFsc,
    basePay,
    deadheadPay,
    deadheadFsc: profile.deadheadFsc,
    payBase,
  };
}
