import { ReactNode } from 'react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Button } from '@/components/ui/button';
import { X, ChevronRight } from 'lucide-react';

interface OnboardingTooltipProps {
  step: number;
  currentStep: number;
  title: string;
  description: string;
  placement?: 'top' | 'bottom' | 'left' | 'right';
  children: ReactNode;
  onNext: () => void;
  onSkip: () => void;
}

export function OnboardingTooltip({
  step,
  currentStep,
  title,
  description,
  placement = 'bottom',
  children,
  onNext,
  onSkip,
}: OnboardingTooltipProps) {
  const isActive = currentStep === step;
  const isLastStep = step === 3;

  if (!isActive) {
    return <>{children}</>;
  }

  return (
    <TooltipProvider delayDuration={0}>
      <Tooltip open={isActive}>
        <TooltipTrigger asChild>
          <div className="relative">
            {children}
            {isActive && (
              <div className="absolute inset-0 ring-2 ring-primary rounded-lg pointer-events-none animate-pulse" />
            )}
          </div>
        </TooltipTrigger>
        <TooltipContent
          side={placement}
          className="max-w-[320px] p-4 bg-popover border-primary/20 shadow-lg"
          sideOffset={8}
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
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
