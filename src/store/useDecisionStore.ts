import { create } from '@/lib/zustand';
import { persist } from '@/lib/zustand/middleware';
import type { DecisionOutcome, LoadEntrySnapshot } from '@/types/mvp';

interface DecisionState {
  history: LoadEntrySnapshot[];
  addDecision: (entry: Omit<LoadEntrySnapshot, 'id' | 'createdAt'>) => void;
  clearHistory: () => void;
}

const generateId = () =>
  typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2, 10);

export const useDecisionStore = create<DecisionState>()(
  persist(
    (set) => ({
      history: [],
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
    }),
    {
      name: 'loadmaster-decisions',
      partialize: (state) => ({ history: state.history }),
    },
  ),
);

export const decisionLabels: Record<DecisionOutcome, string> = {
  book: 'Book it',
  pass: 'Pass',
  counter: 'Counter offer',
};
