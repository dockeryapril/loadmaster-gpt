import { create } from '@/lib/zustand';
import { persist } from '@/lib/zustand/middleware';
import type { DecisionOutcome, LoadEntrySnapshot, CostAssumptions } from '@/types/mvp';

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

// Migration helper: read old data and clean up
const migrateFromLegacy = () => {
  if (typeof window === 'undefined') return null;
  
  try {
    const oldKey = 'loadmaster-decisions';
    const oldData = window.localStorage.getItem(oldKey);
    
    if (!oldData) return null;
    
    const parsed = JSON.parse(oldData);
    
    // If it's an array, it's legacy decision history only
    if (Array.isArray(parsed)) {
      window.localStorage.removeItem(oldKey);
      return { history: parsed, costProfile: undefined };
    }
    
    // If it's an object with our structure, migrate it
    if (parsed && typeof parsed === 'object' && ('history' in parsed || 'costProfile' in parsed)) {
      window.localStorage.removeItem(oldKey);
      return {
        history: Array.isArray(parsed.history) ? parsed.history : [],
        costProfile: parsed.costProfile || undefined,
      };
    }
    
    // Unknown format, remove it
    window.localStorage.removeItem(oldKey);
    return null;
  } catch (error) {
    console.warn('[migration] Failed to migrate legacy data', error);
    return null;
  }
};

export const useDecisionStore = create<DecisionState>()(
  persist(
    (set) => {
      const migrated = migrateFromLegacy();
      
      return {
        history: migrated?.history || [],
        costProfile: migrated?.costProfile || {
          fuelPricePerGallon: 3.89,
          averageMPG: 6.5,
          dailyFixedCosts: 250,
          variableCostPerMile: 0.35,
        },
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
      };
    },
    {
      name: 'lm:v2:state',
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
