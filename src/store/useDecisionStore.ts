import { create } from '@/lib/zustand';
import { persist } from '@/lib/zustand/middleware';
import { supabase } from '@/integrations/supabase/client';
import type { DecisionOutcome, LoadEntrySnapshot, CostAssumptions } from '@/types/mvp';

interface DecisionState {
  history: LoadEntrySnapshot[];
  costProfile: CostAssumptions;
  addDecision: (entry: Omit<LoadEntrySnapshot, 'id' | 'createdAt'>) => void;
  clearHistory: () => void;
  updateCostProfile: (profile: CostAssumptions) => void;
  loadFromCloud: () => Promise<void>;
}

const generateId = () =>
  typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2, 10);

export const useDecisionStore = create<DecisionState>()(
  persist(
    (set) => ({
      history: [],
      costProfile: {
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
      updateCostProfile: (profile) => set({ costProfile: { ...profile } }),
      loadFromCloud: async () => {
        try {
          const { data: { user } } = await supabase.auth.getUser();
          if (!user) return;

          const { data, error } = await supabase
            .from('loads')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false });

          if (error) throw error;

          const cloudHistory: LoadEntrySnapshot[] = (data || []).map(load => ({
            id: load.id,
            createdAt: load.created_at,
            outcome: 'book' as DecisionOutcome, // Default for existing data
            origin: load.origin,
            destination: load.destination,
            miles: Number(load.miles),
            rate: Number(load.rate),
            fsc: Number(load.fsc),
            tolls: Number(load.tolls),
            fuelCost: Number(load.fuel_cost),
            profit: Number(load.profit),
            rpm: Number(load.rpm),
            notes: load.notes || undefined,
          }));

          set({ history: cloudHistory });
        } catch (error) {
          console.error('Failed to load from cloud:', error);
        }
      },
    }),
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
