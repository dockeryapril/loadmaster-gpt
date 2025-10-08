import { create } from '@/lib/zustand';
import { persist } from '@/lib/zustand/middleware';

interface OnboardingState {
  currentStep: number; // 0 = not started, 1-3 = active steps, 4 = completed
  isCompleted: boolean;
  startTour: () => void;
  nextStep: () => void;
  skipTour: () => void;
  resetTour: () => void;
}

export const useOnboardingStore = create<OnboardingState>()(
  persist(
    (set) => ({
      currentStep: 0,
      isCompleted: false,

      startTour: () => set({ currentStep: 1, isCompleted: false }),
      
      nextStep: () =>
        set((state) => {
          const nextStep = state.currentStep + 1;
          if (nextStep > 3) {
            return { currentStep: 4, isCompleted: true };
          }
          return { currentStep: nextStep };
        }),

      skipTour: () => set({ currentStep: 4, isCompleted: true }),
      
      resetTour: () => set({ currentStep: 0, isCompleted: false }),
    }),
    {
      name: 'lm:v2:onboarding',
      partialize: (state) => ({
        currentStep: state.currentStep,
        isCompleted: state.isCompleted,
      }),
    },
  ),
);
