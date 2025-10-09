import { useEffect, useLayoutEffect, useRef, useState } from 'react';
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
  const [tooltipPosition, setTooltipPosition] = useState({
    top: 0,
    left: 0,
    finalPlacement: placement,
  });
  const [spotlightRect, setSpotlightRect] = useState<{
    top: number;
    left: number;
    width: number;
    height: number;
  } | null>(null);
  const tooltipRef = useRef<HTMLDivElement | null>(null);
  const isActive = currentStep === step;
  const isLastStep = step === 3;

  useEffect(() => {
    if (!isActive) {
      setTargetElement(null);
      setSpotlightRect(null);
      return;
    }

    const element = document.querySelector(selector) as HTMLElement | null;
    if (!element) {
      setTargetElement(null);
      setSpotlightRect(null);
      return;
    }

    setTargetElement(element);

    const rect = element.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    let top = rect.bottom + 16;
    let left = centerX;

    if (placement === 'top') {
      top = rect.top - 8;
    } else if (placement === 'left') {
      top = centerY;
      left = rect.left - 16;
    } else if (placement === 'right') {
      top = centerY;
      left = rect.right + 16;
    }

    setSpotlightRect({
      top: rect.top,
      left: rect.left,
      width: rect.width,
      height: rect.height,
    });

    setTooltipPosition({
      top,
      left,
      finalPlacement: placement,
    });
  }, [isActive, selector, placement]);

  useLayoutEffect(() => {
    if (!isActive || !targetElement || !tooltipRef.current) {
      return;
    }

    const tooltipElement = tooltipRef.current;

    const calculatePosition = () => {
      if (!tooltipElement) return;

      const rect = targetElement.getBoundingClientRect();
      const tooltipRect = tooltipElement.getBoundingClientRect();
      const viewportHeight = window.innerHeight;
      const viewportWidth = window.innerWidth;

      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;

      let top = rect.bottom + 16;
      let left = centerX;
      let finalPlacement: typeof placement = 'bottom';

      if (placement === 'top') {
        top = rect.top - 8;
        left = centerX;
        finalPlacement = 'top';

        if (top - tooltipRect.height < 16) {
          top = rect.bottom + 16;
          finalPlacement = 'bottom';
        }
      } else if (placement === 'left') {
        top = centerY;
        left = rect.left - 16;
        finalPlacement = 'left';

        if (left - tooltipRect.width < 16) {
          left = rect.right + 16;
          finalPlacement = 'right';
        }
      } else if (placement === 'right') {
        top = centerY;
        left = rect.right + 16;
        finalPlacement = 'right';

        if (left + tooltipRect.width > viewportWidth - 16) {
          left = rect.left - 16;
          finalPlacement = 'left';
        }
      } else {
        top = rect.bottom + 16;
        left = centerX;
        finalPlacement = 'bottom';

        if (top + tooltipRect.height > viewportHeight - 16) {
          top = rect.top - 8;
          finalPlacement = 'top';
        }
      }

      if (finalPlacement === 'top') {
        const predictedTop = top - tooltipRect.height;
        if (predictedTop < 16) {
          top = tooltipRect.height + 16;
        }
      } else if (finalPlacement === 'bottom') {
        if (top + tooltipRect.height > viewportHeight - 16) {
          top = Math.max(16, viewportHeight - tooltipRect.height - 16);
        }
      } else if (finalPlacement === 'left') {
        const halfHeight = tooltipRect.height / 2;
        if (top - halfHeight < 16) {
          top = halfHeight + 16;
        } else if (top + halfHeight > viewportHeight - 16) {
          top = viewportHeight - halfHeight - 16;
        }

        if (left - tooltipRect.width < 16) {
          left = tooltipRect.width + 16;
        }
      } else if (finalPlacement === 'right') {
        const halfHeight = tooltipRect.height / 2;
        if (top - halfHeight < 16) {
          top = halfHeight + 16;
        } else if (top + halfHeight > viewportHeight - 16) {
          top = viewportHeight - halfHeight - 16;
        }

        if (left + tooltipRect.width > viewportWidth - 16) {
          left = viewportWidth - tooltipRect.width - 16;
        }
      }

      if (finalPlacement === 'top' || finalPlacement === 'bottom') {
        const halfWidth = tooltipRect.width / 2;
        if (left - halfWidth < 16) {
          left = halfWidth + 16;
        } else if (left + halfWidth > viewportWidth - 16) {
          left = viewportWidth - halfWidth - 16;
        }
      }

      setSpotlightRect((prev) => {
        const nextRect = {
          top: rect.top,
          left: rect.left,
          width: rect.width,
          height: rect.height,
        };

        if (
          prev &&
          Math.abs(prev.top - nextRect.top) < 0.5 &&
          Math.abs(prev.left - nextRect.left) < 0.5 &&
          Math.abs(prev.width - nextRect.width) < 0.5 &&
          Math.abs(prev.height - nextRect.height) < 0.5
        ) {
          return prev;
        }

        return nextRect;
      });

      setTooltipPosition((prev) => {
        if (
          Math.abs(prev.top - top) < 0.5 &&
          Math.abs(prev.left - left) < 0.5 &&
          prev.finalPlacement === finalPlacement
        ) {
          return prev;
        }

        return { top, left, finalPlacement };
      });
    };

    let frameId: number | null = null;

    const schedulePositionUpdate = () => {
      if (frameId !== null && typeof window.cancelAnimationFrame === 'function') {
        window.cancelAnimationFrame(frameId);
      }

      if (typeof window.requestAnimationFrame === 'function') {
        frameId = window.requestAnimationFrame(() => {
          calculatePosition();
          frameId = null;
        });
      } else {
        calculatePosition();
      }
    };

    schedulePositionUpdate();

    const handleScroll = () => schedulePositionUpdate();
    const handleResize = () => schedulePositionUpdate();

    window.addEventListener('scroll', handleScroll, true);
    window.addEventListener('resize', handleResize);

    const observers: ResizeObserver[] = [];

    if (typeof ResizeObserver !== 'undefined') {
      const observer = new ResizeObserver(() => schedulePositionUpdate());
      observer.observe(targetElement);
      observer.observe(tooltipElement);
      observers.push(observer);
    }

    return () => {
      if (frameId !== null && typeof window.cancelAnimationFrame === 'function') {
        window.cancelAnimationFrame(frameId);
      }

      window.removeEventListener('scroll', handleScroll, true);
      window.removeEventListener('resize', handleResize);

      observers.forEach((observer) => observer.disconnect());
    };
  }, [isActive, targetElement, placement]);

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
        ref={tooltipRef}
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
