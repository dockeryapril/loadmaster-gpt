import { create } from '../lib/zustand';
import type { LoadOpportunity, LoadDecision, CostProfile } from '../types';

type StoreState = {
  currentLoad: LoadOpportunity | null;
  costProfile: CostProfile;
  decisions: LoadDecision[];
  setCurrentLoad: (load: LoadOpportunity) => void;
  logDecision: (decision: LoadDecision) => void;
};

const defaultCostProfile: CostProfile = {
  fixedCostsPerDay: 250,
  variableCostsPerMile: 0.35,
  fuelEfficiency: 6.5,
  dieselPricePerGallon: 4.5,
  targetMargin: 200,
};

export const useStore = create<StoreState>((set) => ({
  currentLoad: null,
  costProfile: defaultCostProfile,
  decisions: loadDecisions(),
  setCurrentLoad: (load) => set({ currentLoad: load }),
  logDecision: (decision) =>
    set((state) => {
      const updatedDecisions = [...state.decisions, decision];
      persistDecisions(updatedDecisions);
      return {
        decisions: updatedDecisions,
        currentLoad: null,
      };
    }),
}));

function loadDecisions(): LoadDecision[] {
  if (typeof window === 'undefined') {
    return [];
  }

  try {
    const stored = window.localStorage.getItem('lm:legacy:decisions');
    if (!stored) {
      return [];
    }
    const parsed = JSON.parse(stored);
    return Array.isArray(parsed) ? (parsed as LoadDecision[]) : [];
  } catch (error) {
    console.error('Failed to load saved decisions', error);
    return [];
  }
}

function persistDecisions(decisions: LoadDecision[]) {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    window.localStorage.setItem('lm:legacy:decisions', JSON.stringify(decisions));
  } catch (error) {
    console.error('Failed to persist decisions', error);
  }
}
