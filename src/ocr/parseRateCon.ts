import type { LoadOpportunity } from '../types';

export async function parseRateCon(_file: File): Promise<LoadOpportunity> {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        origin: 'Dallas, TX',
        destination: 'Chicago, IL',
        miles: 950,
        rateAllIn: 2100,
        fuelSurcharge: 100,
        accessorials: 50,
      });
    }, 1000);
  });
}
