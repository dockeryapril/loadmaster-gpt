export type DecisionOutcome = 'book' | 'pass' | 'counter';

export interface LoadFormInput {
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
}

// Cost assumptions for future Phase 2 calculator enhancement
export interface CostAssumptions {
  fuelPricePerGallon: number;
  averageMPG: number;
  dailyFixedCosts: number;
  variableCostPerMile: number;
}

export const defaultCostAssumptions: CostAssumptions = {
  fuelPricePerGallon: 3.89,
  averageMPG: 6.5,
  dailyFixedCosts: 250,
  variableCostPerMile: 0.35,
};

export const emptyLoadForm: LoadFormInput = {
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
