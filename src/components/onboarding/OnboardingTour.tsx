import { ReactNode, useEffect } from 'react';
import { useOnboardingStore } from '@/store/useOnboardingStore';
import { OnboardingTooltip } from './OnboardingTooltip';

interface OnboardingTourProps {
  children: ReactNode;
}

const tourSteps = [
  {
    step: 1,
    selector: '[data-onboarding="step-1"]',
    title: 'Enter load details',
    description: 'Enter your load details here (or upload a screenshot later)',
    placement: 'bottom' as const,
  },
  {
    step: 2,
    selector: '[data-onboarding="step-2"]',
    title: 'Instant profit calculation',
    description: 'See instant profit analysis and guidance',
    placement: 'bottom' as const,
  },
  {
    step: 3,
    selector: '[data-onboarding="step-3"]',
    title: 'Track your decisions',
    description: 'Log decisions to track patterns and insights over time',
    placement: 'top' as const,
  },
];

export function OnboardingTour({ children }: OnboardingTourProps) {
  const { currentStep, isCompleted, startTour, nextStep, skipTour } = useOnboardingStore();

  // Auto-start tour on first visit
  useEffect(() => {
    if (currentStep === 0 && !isCompleted) {
      startTour();
    }
  }, [currentStep, isCompleted, startTour]);

  // Scroll to active step element
  useEffect(() => {
    if (currentStep > 0 && currentStep <= 3) {
      const currentStepConfig = tourSteps.find((s) => s.step === currentStep);
      if (currentStepConfig) {
        const element = document.querySelector(currentStepConfig.selector);
        if (element) {
          // Use 'start' for step 1 to keep bottom tooltip visible, 'center' for others
          const scrollBlock = currentStep === 1 ? 'start' : 'center';
          
          element.scrollIntoView({
            behavior: 'smooth',
            block: scrollBlock,
          });
        }
      }
    }
  }, [currentStep]);

  // If tour is not active, render children without wrappers
  if (currentStep === 0 || currentStep >= 4 || isCompleted) {
    return <>{children}</>;
  }

  const activeStep = tourSteps.find((s) => s.step === currentStep);

  return (
    <>
      {children}
      {activeStep && (
        <OnboardingTooltip
          step={activeStep.step}
          currentStep={currentStep}
          title={activeStep.title}
          description={activeStep.description}
          placement={activeStep.placement}
          selector={activeStep.selector}
          onNext={nextStep}
          onSkip={skipTour}
        />
      )}
    </>
  );
}
