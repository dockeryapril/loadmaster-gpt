export type LoadOpportunity = {
  origin: string;
  destination: string;
  miles: number;
  rateAllIn: number;
  fuelSurcharge?: number;
  accessorials?: number;
};

export type CostProfile = {
  fixedCostsPerDay: number;
  variableCostsPerMile: number;
  fuelEfficiency: number; // in MPG
  dieselPricePerGallon: number;
  targetMargin: number; // in dollars
};

export type LoadDecision = {
  load: LoadOpportunity;
  decision: 'accepted' | 'declined' | 'countered';
  targetRate?: number;
  notes?: string;
  timestamp: string;
};
