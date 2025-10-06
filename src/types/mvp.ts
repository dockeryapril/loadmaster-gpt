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
}

export const emptyLoadForm: LoadFormInput = {
  origin: '',
  destination: '',
  miles: '',
  rate: '',
  fsc: '',
  tolls: '',
  fuelCost: '',
  notes: '',
};
