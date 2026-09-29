import type { DriverProfile } from '@/types/driverProfile';
import type { LoadFormInput } from '@/types/mvp';

export function applyProfileToOffer(
  form: LoadFormInput,
  profile: DriverProfile,
): LoadFormInput {
  return {
    ...form,
    equipment: profile.equipment,
    splitPercent: String(profile.compensation.percentage),
  };
}
