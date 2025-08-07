export interface Load {
  id: string;
  origin: string;
  destination: string;
  miles: number;
  rate: number;
  weight?: number;
  deadheadMiles?: number;
  fuelCost?: number;
  rpm: number;
  quality: 'excellent' | 'good' | 'fair' | 'poor';
  createdAt: Date;
  notes?: string;
}

export interface LoadCalculationResult {
  rpm: number;
  totalMiles: number;
  netRate: number;
  quality: 'excellent' | 'good' | 'fair' | 'poor';
  weightImpact: 'light' | 'medium' | 'heavy' | 'overweight';
}

export const calculateLoadQuality = (rpm: number): Load['quality'] => {
  if (rpm >= 2.5) return 'excellent';
  if (rpm >= 2.0) return 'good';
  if (rpm >= 1.5) return 'fair';
  return 'poor';
};

export const getWeightImpact = (weight?: number): LoadCalculationResult['weightImpact'] => {
  if (!weight) return 'light';
  if (weight <= 25000) return 'light';
  if (weight <= 45000) return 'medium';
  if (weight <= 80000) return 'heavy';
  return 'overweight';
};