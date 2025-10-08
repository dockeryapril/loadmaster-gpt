import { create } from '@/lib/zustand';
import { persist } from '@/lib/zustand/middleware';
import type { DecisionOutcome, LoadEntrySnapshot, CostAssumptions } from '@/types/mvp';
import { defaultCostAssumptions } from '@/types/mvp';

interface DecisionState {
  history: LoadEntrySnapshot[];
  costProfile: CostAssumptions;
  addDecision: (entry: Omit<LoadEntrySnapshot, 'id' | 'createdAt'>) => void;
  clearHistory: () => void;
  updateCostProfile: (profile: CostAssumptions) => void;
}

const generateId = () =>
  typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2, 10);

export const useDecisionStore = create<DecisionState>()(
  persist(
    (set) => ({
      history: [],
      costProfile: defaultCostAssumptions,
      addDecision: (entry) =>
        set((state) => ({
          history: [
            {
              id: generateId(),
              createdAt: new Date().toISOString(),
              ...entry,
            },
            ...state.history,
          ].slice(0, 100),
        })),
      clearHistory: () => set({ history: [] }),
      updateCostProfile: (profile) => set({ costProfile: profile }),
    }),
    {
      name: 'loadmaster-decisions',
      partialize: (state) => ({ 
        history: state.history,
        costProfile: state.costProfile,
      }),
    },
  ),
);

// Custom hook to access cost profile
export const useCostProfile = () => {
  const costProfile = useDecisionStore((state) => state.costProfile);
  const updateCostProfile = useDecisionStore((state) => state.updateCostProfile);
  return { costProfile, updateCostProfile };
};

export const decisionLabels: Record<DecisionOutcome, string> = {
  book: 'Book it',
  pass: 'Pass',
  counter: 'Counter offer',
};
