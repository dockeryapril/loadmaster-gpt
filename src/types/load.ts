import type { Equipment } from './equipment';

export interface Load {
  id: string;
  origin: string;
  destination: string;
  miles: number;
  rate: number;
  fsc?: number; // Fuel Surcharge
  tolls?: number;
  weight?: number;
  widthFt?: number;
  heightFt?: number;
  stops?: number;
  equipment?: Equipment;
  accessorials?: {
    tarp?: boolean;
    jobsite?: boolean;
    itemType?: string;
    weekend?: boolean;
    afterHours?: boolean;
    inside?: boolean;
    residential?: boolean;
    liftgate?: boolean;
    palletJack?: boolean;
    detentionHours?: number;
  };
  pickupAt?: string;
  deadheadMiles?: number;
  fuelCost?: number;
  rpm: number;
  profit: number;
  quality: 'excellent' | 'good' | 'fair' | 'poor';
  tags: string[];
  createdAt: Date;
  notes?: string;
}

export interface UserSettings {
  fuelPrice: number; // per gallon
  mpg: number; // miles per gallon
  rpmThresholds: {
    excellent: number;
    good: number;
    fair: number;
  };
  weightLimit: number; // in pounds
  preferredLanes: string[];
  enableFuelCostTracking: boolean;
  businessSetupCompleted?: boolean;
  businessSetupCompletedAt?: string;
  showSetupReminders?: boolean;
  setupCompletionPercentage?: number;
}

export interface LoadCalculationResult {
  rpm: number;
  profit: number;
  totalMiles: number;
  netRate: number;
  quality: 'excellent' | 'good' | 'fair' | 'poor';
  weightImpact: 'light' | 'medium' | 'heavy' | 'overweight';
  tags: string[];
}

export const calculateLoadQuality = (rpm: number, settings?: UserSettings): Load['quality'] => {
  const thresholds = settings?.rpmThresholds || {
    excellent: 2.5,
    good: 2.0,
    fair: 1.5
  };
  
  if (rpm >= thresholds.excellent) return 'excellent';
  if (rpm >= thresholds.good) return 'good';
  if (rpm >= thresholds.fair) return 'fair';
  return 'poor';
};

export const getWeightImpact = (weight?: number, settings?: UserSettings): LoadCalculationResult['weightImpact'] => {
  if (!weight) return 'light';
  const weightLimit = settings?.weightLimit || 80000;
  
  if (weight <= 25000) return 'light';
  if (weight <= 45000) return 'medium';
  if (weight <= weightLimit) return 'heavy';
  return 'overweight';
};

export const generateSmartTags = (load: Partial<Load>, settings?: UserSettings): string[] => {
  const tags: string[] = [];
  
  if (load.weight && load.weight > (settings?.weightLimit || 80000)) {
    tags.push('Heavy Load');
  }
  
  if (load.rpm && load.rpm >= (settings?.rpmThresholds?.excellent || 2.5)) {
    tags.push('High Paying');
  }
  
  if (load.deadheadMiles && load.deadheadMiles > 50) {
    tags.push('Long Deadhead');
  }
  
  if (load.miles && load.miles > 1000) {
    tags.push('Long Haul');
  } else if (load.miles && load.miles < 250) {
    tags.push('Short Haul');
  }
  
  if (load.fsc && load.fsc > 0.3) {
    tags.push('Good FSC');
  }
  
  return tags;
};

export const calculateProfit = (
  rate: number,
  fsc: number = 0,
  tolls: number = 0,
  fuelCost: number = 0
): number => {
  return rate + fsc - tolls - fuelCost;
};

export const defaultUserSettings: UserSettings = {
  fuelPrice: 3.50,
  mpg: 6.5,
  rpmThresholds: {
    excellent: 2.5,
    good: 2.0,
    fair: 1.5
  },
  weightLimit: 80000,
  preferredLanes: [],
  enableFuelCostTracking: false,
  businessSetupCompleted: false,
  showSetupReminders: true,
  setupCompletionPercentage: 0
};