import { ReactNode, useEffect } from 'react';
import { useOnboardingStore } from '@/store/useOnboardingStore';
import { OnboardingTooltip } from './OnboardingTooltip';

interface OnboardingTourProps {
  children: ReactNode;
}

export function OnboardingTour({ children }: OnboardingTourProps) {
  const { currentStep, isCompleted, startTour, nextStep, skipTour } = useOnboardingStore();

  // Auto-start tour on first visit
  useEffect(() => {
    if (currentStep === 0 && !isCompleted) {
      startTour();
    }
  }, [currentStep, isCompleted, startTour]);

  // If tour is not active, render children without wrappers
  if (currentStep === 0 || currentStep >= 4 || isCompleted) {
    return <>{children}</>;
  }

  return (
    <>
      <OnboardingTooltip
        step={1}
        currentStep={currentStep}
        title="Enter load details"
        description="Enter your load details here (or upload a screenshot later)"
        placement="bottom"
        onNext={nextStep}
        onSkip={skipTour}
      >
        <div data-onboarding="step-1" />
      </OnboardingTooltip>

      <OnboardingTooltip
        step={2}
        currentStep={currentStep}
        title="Instant profit calculation"
        description="See instant profit analysis and guidance"
        placement="top"
        onNext={nextStep}
        onSkip={skipTour}
      >
        <div data-onboarding="step-2" />
      </OnboardingTooltip>

      <OnboardingTooltip
        step={3}
        currentStep={currentStep}
        title="Track your decisions"
        description="Log decisions to track patterns and insights over time"
        placement="left"
        onNext={nextStep}
        onSkip={skipTour}
      >
        <div data-onboarding="step-3" />
      </OnboardingTooltip>

      {children}
    </>
  );
}
