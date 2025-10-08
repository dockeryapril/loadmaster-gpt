import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Button } from '@/components/ui/button';
import { X, ChevronRight } from 'lucide-react';

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
  const [tooltipPosition, setTooltipPosition] = useState({ top: 0, left: 0 });
  const isActive = currentStep === step;
  const isLastStep = step === 3;

  useEffect(() => {
    if (!isActive) return;

    const element = document.querySelector(selector) as HTMLElement;
    if (element) {
      setTargetElement(element);
      
      // Calculate tooltip position
      const rect = element.getBoundingClientRect();
      let top = 0;
      let left = rect.left + rect.width / 2;

      if (placement === 'bottom') {
        top = rect.bottom + 12;
      } else if (placement === 'top') {
        top = rect.top - 12;
      } else if (placement === 'left') {
        top = rect.top + rect.height / 2;
        left = rect.left - 12;
      } else if (placement === 'right') {
        top = rect.top + rect.height / 2;
        left = rect.right + 12;
      }

      setTooltipPosition({ top, left });
    }

    // Update position on scroll/resize
    const updatePosition = () => {
      if (element) {
        const rect = element.getBoundingClientRect();
        let top = 0;
        let left = rect.left + rect.width / 2;

        if (placement === 'bottom') {
          top = rect.bottom + 12;
        } else if (placement === 'top') {
          top = rect.top - 12;
        } else if (placement === 'left') {
          top = rect.top + rect.height / 2;
          left = rect.left - 12;
        } else if (placement === 'right') {
          top = rect.top + rect.height / 2;
          left = rect.right + 12;
        }

        setTooltipPosition({ top, left });
      }
    };

    window.addEventListener('scroll', updatePosition, true);
    window.addEventListener('resize', updatePosition);

    return () => {
      window.removeEventListener('scroll', updatePosition, true);
      window.removeEventListener('resize', updatePosition);
    };
  }, [isActive, selector, placement]);

  if (!isActive || !targetElement) {
    return null;
  }

  return createPortal(
    <>
      {/* Spotlight highlight */}
      <div
        className="fixed pointer-events-none z-[9998] ring-2 ring-primary rounded-lg animate-pulse"
        style={{
          top: targetElement.getBoundingClientRect().top - 4,
          left: targetElement.getBoundingClientRect().left - 4,
          width: targetElement.getBoundingClientRect().width + 8,
          height: targetElement.getBoundingClientRect().height + 8,
        }}
      />

      {/* Tooltip */}
      <div
        className="fixed z-[9999] max-w-[320px] rounded-lg border border-primary/20 bg-popover p-4 shadow-lg"
        style={{
          top: tooltipPosition.top,
          left: tooltipPosition.left,
          transform: 
            placement === 'bottom' ? 'translateX(-50%)' :
            placement === 'top' ? 'translate(-50%, -100%)' :
            placement === 'left' ? 'translate(-100%, -50%)' :
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
