export type DecisionOutcome = 'book' | 'pass' | 'counter';

export type Equipment = 'hotshot' | 'cargo_van' | 'straight_truck';

export type FuelType = 'gas' | 'diesel';

export interface LoadFormInput {
  equipment: Equipment;
  origin: string;
  destination: string;
  miles: string;
  rate: string;
  fsc: string;
  tolls: string;
  fuelCost: string;
  notes: string;
  splitPercent: string;
}

export interface LoadEntrySnapshot {
  id: string;
  createdAt: string;
  outcome: DecisionOutcome;
  origin: string;
  destination: string;
  miles: number;
  rate: number;
  fsc: number;
  tolls: number;
  fuelCost: number;
  profit: number;
  rpm: number;
  notes?: string;
  splitPercent?: number;
  fuelType?: FuelType;
}

// Cost assumptions for calculator
export interface CostAssumptions {
  fuelPricePerGallon: number;
  averageMPG: number;
  dailyFixedCosts: number;
  variableCostPerMile: number;
  goodRpm: number;
  fairRpm: number;
  goodProfit: number;
  fairProfit: number;
  useSmartHopPresets?: boolean;
  fuelType?: FuelType;
}

export const defaultCostAssumptions: CostAssumptions = {
  fuelPricePerGallon: 3.89,
  averageMPG: 6.5,
  dailyFixedCosts: 250,
  variableCostPerMile: 0.35,
  goodRpm: 0.8,
  fairRpm: 0.7,
  goodProfit: 900,
  fairProfit: 450,
  fuelType: 'diesel',
};

export const emptyLoadForm: LoadFormInput = {
  equipment: 'hotshot',
  origin: '',
  destination: '',
  miles: '',
  rate: '',
  fsc: '',
  tolls: '',
  fuelCost: '',
  notes: '',
  splitPercent: '100',
};
