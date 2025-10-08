import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Button } from '@/components/ui/button';
import { X, ChevronRight } from 'lucide-react';
import { OnboardingBackdrop } from './OnboardingBackdrop';

interface OnboardingTooltipProps {
  step: number;
  currentStep: number;
  title: string;
  description: string;
  placement?: 'top' | 'bottom' | 'left' | 'right';
  selector: string;
  onNext: () => void;
  onSkip: () => void;
}

export function OnboardingTooltip({
  step,
  currentStep,
  title,
  description,
  placement = 'bottom',
  selector,
  onNext,
  onSkip,
}: OnboardingTooltipProps) {
  const [targetElement, setTargetElement] = useState<HTMLElement | null>(null);
  const [tooltipPosition, setTooltipPosition] = useState({ top: 0, left: 0, finalPlacement: placement });
  const [spotlightRect, setSpotlightRect] = useState<DOMRect | null>(null);
  const isActive = currentStep === step;
  const isLastStep = step === 3;

  useEffect(() => {
    if (!isActive) return;

    const element = document.querySelector(selector) as HTMLElement;
    if (!element) return;

    setTargetElement(element);

    const calculatePosition = () => {
      const rect = element.getBoundingClientRect();
      const viewportHeight = window.innerHeight;
      const viewportWidth = window.innerWidth;
      
      // Store spotlight rect (only update on resize, not scroll)
      setSpotlightRect(rect);
      
      const tooltipWidth = 320;
      const tooltipHeight = 200; // Approximate
      let top = rect.bottom + 16;
      let left = rect.left + rect.width / 2;
      let finalPlacement = placement;

      // Smart positioning: flip if tooltip would go off-screen
      if (placement === 'bottom' && top + tooltipHeight > viewportHeight) {
        top = rect.top - tooltipHeight - 16;
        finalPlacement = 'top';
      } else if (placement === 'top' && top - tooltipHeight < 0) {
        top = rect.bottom + 16;
        finalPlacement = 'bottom';
      } else if (placement === 'bottom') {
        top = rect.bottom + 16;
      } else if (placement === 'top') {
        top = rect.top - 16;
      }

      // Ensure tooltip doesn't go off-screen horizontally
      if (left + tooltipWidth / 2 > viewportWidth - 16) {
        left = viewportWidth - tooltipWidth / 2 - 16;
      }
      if (left - tooltipWidth / 2 < 16) {
        left = tooltipWidth / 2 + 16;
      }

      setTooltipPosition({ top, left, finalPlacement });
    };

    calculatePosition();

    // Only update on resize, not scroll (prevents jitter)
    window.addEventListener('resize', calculatePosition);

    return () => {
      window.removeEventListener('resize', calculatePosition);
    };
  }, [isActive, selector, placement]);

  if (!isActive || !targetElement || !spotlightRect) {
    return null;
  }

  return createPortal(
    <>
      {/* Backdrop with cut-out */}
      <OnboardingBackdrop targetElement={targetElement} />

      {/* Spotlight highlight */}
      <div
        className="fixed pointer-events-none z-[9998] ring-2 ring-primary rounded-lg animate-pulse transition-all duration-300 ease-out"
        style={{
          top: spotlightRect.top - 4,
          left: spotlightRect.left - 4,
          width: spotlightRect.width + 8,
          height: spotlightRect.height + 8,
        }}
      />

      {/* Tooltip */}
      <div
        className="fixed z-[9999] max-w-[320px] w-[90vw] md:w-[320px] rounded-lg border border-primary/20 bg-popover p-4 shadow-lg transition-all duration-300 ease-out"
        style={{
          top: tooltipPosition.top,
          left: tooltipPosition.left,
          transform: 
            tooltipPosition.finalPlacement === 'bottom' ? 'translateX(-50%)' :
            tooltipPosition.finalPlacement === 'top' ? 'translate(-50%, -100%)' :
            tooltipPosition.finalPlacement === 'left' ? 'translate(-100%, -50%)' :
            'translate(0, -50%)',
        }}
      >
        <div className="space-y-3">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1">
              <p className="text-sm font-semibold text-foreground">{title}</p>
              <p className="text-xs text-muted-foreground mt-1">{description}</p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0 -mt-1"
              onClick={onSkip}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          
          <div className="flex items-center justify-between gap-2 pt-2 border-t border-border">
            <span className="text-xs text-muted-foreground">
              Step {step} of 3
            </span>
            
            <Button
              size="sm"
              onClick={onNext}
              className="h-8 px-3 gap-1"
            >
              {isLastStep ? 'Done' : 'Next'}
              {!isLastStep && <ChevronRight className="h-3 w-3" />}
            </Button>
          </div>
        </div>
      </div>
    </>,
    document.body
  );
}
