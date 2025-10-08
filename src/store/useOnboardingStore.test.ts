import { describe, it, expect, beforeEach } from 'vitest';
import { useOnboardingStore } from './useOnboardingStore';

describe('useOnboardingStore', () => {
  beforeEach(() => {
    // Reset store before each test
    useOnboardingStore.getState().resetTour();
  });

  it('should initialize with step 0 and not completed', () => {
    const state = useOnboardingStore.getState();
    expect(state.currentStep).toBe(0);
    expect(state.isCompleted).toBe(false);
  });

  it('should start tour when startTour is called', () => {
    const { startTour } = useOnboardingStore.getState();
    startTour();
    
    const state = useOnboardingStore.getState();
    expect(state.currentStep).toBe(1);
    expect(state.isCompleted).toBe(false);
  });

  it('should advance through steps when nextStep is called', () => {
    const { startTour, nextStep } = useOnboardingStore.getState();
    
    startTour();
    expect(useOnboardingStore.getState().currentStep).toBe(1);
    
    nextStep();
    expect(useOnboardingStore.getState().currentStep).toBe(2);
    
    nextStep();
    expect(useOnboardingStore.getState().currentStep).toBe(3);
  });

  it('should mark as completed when advancing past step 3', () => {
    const { startTour, nextStep } = useOnboardingStore.getState();
    
    startTour();
    nextStep(); // step 2
    nextStep(); // step 3
    nextStep(); // complete
    
    const state = useOnboardingStore.getState();
    expect(state.currentStep).toBe(4);
    expect(state.isCompleted).toBe(true);
  });

  it('should skip tour and mark as completed when skipTour is called', () => {
    const { startTour, skipTour } = useOnboardingStore.getState();
    
    startTour();
    expect(useOnboardingStore.getState().currentStep).toBe(1);
    
    skipTour();
    
    const state = useOnboardingStore.getState();
    expect(state.currentStep).toBe(4);
    expect(state.isCompleted).toBe(true);
  });

  it('should reset tour when resetTour is called', () => {
    const { startTour, nextStep, resetTour } = useOnboardingStore.getState();
    
    startTour();
    nextStep();
    nextStep();
    
    resetTour();
    
    const state = useOnboardingStore.getState();
    expect(state.currentStep).toBe(0);
    expect(state.isCompleted).toBe(false);
  });

  it('should persist state across store instances', () => {
    const { startTour, nextStep } = useOnboardingStore.getState();
    
    startTour();
    nextStep();
    
    // Get a fresh instance of the state
    const newState = useOnboardingStore.getState();
    expect(newState.currentStep).toBe(2);
  });
});
