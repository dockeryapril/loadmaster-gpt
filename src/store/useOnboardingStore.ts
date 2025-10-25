import { create } from '@/lib/zustand';
import { persist } from '@/lib/zustand/middleware';

interface OnboardingState {
  welcomeCardDismissed: boolean;
  hasOpenedCostEditor: boolean;
  tourModalOpen: boolean;
  dismissWelcomeCard: () => void;
  markCostEditorOpened: () => void;
  openTourModal: () => void;
  closeTourModal: () => void;
  resetOnboarding: () => void;
}

export const useOnboardingStore = create<OnboardingState>()(
  persist(
    (set) => ({
      welcomeCardDismissed: false,
      hasOpenedCostEditor: false,
      tourModalOpen: false,

      dismissWelcomeCard: () => set({ welcomeCardDismissed: true }),
      
      markCostEditorOpened: () => set({ hasOpenedCostEditor: true }),
      
      openTourModal: () => set({ tourModalOpen: true }),
      
      closeTourModal: () => set({ tourModalOpen: false }),
      
      resetOnboarding: () => set({ 
        welcomeCardDismissed: false, 
        hasOpenedCostEditor: false,
        tourModalOpen: false 
      }),
    }),
    {
      name: 'lm:v2:onboarding',
      partialize: (state) => ({
        welcomeCardDismissed: state.welcomeCardDismissed,
        hasOpenedCostEditor: state.hasOpenedCostEditor,
      }),
    },
  ),
);
