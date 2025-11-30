import { create } from '@/lib/zustand';
import { persist } from '@/lib/zustand/middleware';
import { supabase } from '@/integrations/supabase/client';
import type { DecisionOutcome, LoadEntrySnapshot, CostAssumptions, CounterResult } from '@/types/mvp';
import { defaultCostAssumptions } from '@/types/mvp';

interface DecisionState {
  history: LoadEntrySnapshot[];
  costProfile: CostAssumptions;
  historyClearedAt: string | null;
  addDecision: (entry: Omit<LoadEntrySnapshot, 'id' | 'createdAt'>) => void;
  updateDecision: (id: string, updates: Partial<Omit<LoadEntrySnapshot, 'id' | 'createdAt'>>) => void;
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
      historyClearedAt: null,
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
          historyClearedAt: state.historyClearedAt,
        })),
      updateDecision: (id, updates) =>
        set((state) => ({
          history: state.history.map((entry) =>
            entry.id === id ? { ...entry, ...updates } : entry
          ),
        })),
      clearHistory: () =>
        set({
          history: [],
          historyClearedAt: new Date().toISOString(),
        }),
      updateCostProfile: (profile) => set({ costProfile: { ...defaultCostAssumptions, ...profile } }),
      loadFromCloud: async () => {
        try {
          const { historyClearedAt } = useDecisionStore.getState();
          const { data: { user } } = await supabase.auth.getUser();
          if (!user) return;

          // Only load recent 100 records to reduce egress
          const { data, error } = await supabase
            .from('loads')
            .select('id, origin, destination, miles, rate, fsc, tolls, fuel_cost, rpm, profit, notes, outcome, counter_result, final_rate, created_at')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false })
            .limit(100);

          if (error) throw error;

          const cloudHistory: LoadEntrySnapshot[] = (data || [])
            .map(load => ({
            id: load.id,
            createdAt: load.created_at,
            outcome: (load.outcome as DecisionOutcome) || 'book', // Default for existing data
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
            counterResult: load.counter_result as CounterResult | undefined,
            finalRate: load.final_rate ? Number(load.final_rate) : undefined,
          }))
            .filter((entry) => {
              if (!historyClearedAt) return true;
              return new Date(entry.createdAt).getTime() > new Date(historyClearedAt).getTime();
            });

          set({
            history: cloudHistory,
            historyClearedAt,
          });
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
        historyClearedAt: state.historyClearedAt,
      }),
    },
  ),
);

// Validate cost profile after store creation to ensure all fields exist
const validateCostProfile = () => {
  const state = useDecisionStore.getState();
  const { costProfile, updateCostProfile } = state;

  const requiredFields: (keyof CostAssumptions)[] = [
    'fuelPricePerGallon',
    'averageMPG',
    'dailyFixedCosts',
    'variableCostPerMile',
    'goodRpm',
    'fairRpm',
    'goodProfit',
    'fairProfit',
    'fuelType',
  ];

  // Check if any required field is missing or undefined
  const hasAllFields = Boolean(costProfile) &&
    requiredFields.every((field) => {
      const value = costProfile?.[field];
      if (field === 'fuelType') {
        return value === 'gas' || value === 'diesel';
      }
      return typeof value === 'number' && Number.isFinite(value);
    });

  if (!hasAllFields) {
    console.log('[store] Restoring missing cost profile fields from defaults');
    updateCostProfile({
      ...defaultCostAssumptions,
      ...(costProfile || {}),
    });
  }
};

// Run validation on store initialization
validateCostProfile();

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
