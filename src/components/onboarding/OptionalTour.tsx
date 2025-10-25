import { useState } from 'react';
import { useOnboardingStore } from '@/store/useOnboardingStore';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Camera, DollarSign, Settings, TrendingUp } from 'lucide-react';
import { trackOptionalTourStarted, trackOptionalTourCompleted, trackOptionalTourSkipped } from '@/utils/analytics';

const tourSteps = [
  {
    title: 'Welcome to LoadMaster',
    description: 'Let\'s take a quick tour of how to use the calculator to maximize your profits.',
    icon: TrendingUp,
    content: 'LoadMaster helps you make data-driven decisions on every load offer. We\'ll show you the key features in just 4 steps.',
  },
  {
    title: 'Upload Rate Confirmations',
    description: 'Save time by auto-filling load details from screenshots.',
    icon: Camera,
    content: 'Click the camera icon to upload a screenshot of your rate confirmation. Our OCR technology will extract miles, rate, pickup/delivery locations, and more - no manual typing needed.',
  },
  {
    title: 'Instant Profit Calculations',
    description: 'See your real profit in seconds, not guesses.',
    icon: DollarSign,
    content: 'We calculate your Net RPM and total profit based on YOUR actual costs. The color-coded guidance shows you at a glance if a load is worth booking, worth countering, or should be passed.',
  },
  {
    title: 'Customize Your Cost Assumptions',
    description: 'Match calculations to your specific truck and operating costs.',
    icon: Settings,
    content: 'Click "Edit Cost Assumptions" to set your actual MPG, fuel price, daily fixed costs, and variable costs per mile. You can also use industry presets for quick setup based on your equipment type and fuel type.',
  },
  {
    title: 'Track Your Patterns',
    description: 'Learn from your booking history to make better decisions.',
    icon: TrendingUp,
    content: 'Every load you log builds your decision history. After 5+ loads, you\'ll see Pattern Insights showing your best RPM, average profit, most common routes, and acceptance rates by RPM range.',
  },
];

export function OptionalTour() {
  const tourModalOpen = useOnboardingStore((state) => state.tourModalOpen);
  const closeTourModal = useOnboardingStore((state) => state.closeTourModal);
  const [currentStep, setCurrentStep] = useState(0);
  const [hasStarted, setHasStarted] = useState(false);

  const step = tourSteps[currentStep];
  const progress = ((currentStep + 1) / tourSteps.length) * 100;
  const Icon = step.icon;

  const handleNext = () => {
    if (currentStep === tourSteps.length - 1) {
      trackOptionalTourCompleted();
      handleClose();
    } else {
      setCurrentStep((prev) => prev + 1);
    }
  };

  const handlePrevious = () => {
    setCurrentStep((prev) => Math.max(0, prev - 1));
  };

  const handleSkip = () => {
    trackOptionalTourSkipped(currentStep + 1);
    handleClose();
  };

  const handleClose = () => {
    closeTourModal();
    setCurrentStep(0);
    setHasStarted(false);
  };

  const handleOpen = (open: boolean) => {
    if (open && !hasStarted) {
      setHasStarted(true);
      trackOptionalTourStarted();
    }
    if (!open) {
      handleClose();
    }
  };

  return (
    <Dialog open={tourModalOpen} onOpenChange={handleOpen}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg bg-primary/10">
              <Icon className="h-6 w-6 text-primary" />
            </div>
            <div className="flex-1">
              <DialogTitle>{step.title}</DialogTitle>
              <DialogDescription>{step.description}</DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="py-4">
          <p className="text-sm text-muted-foreground leading-relaxed">
            {step.content}
          </p>
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Step {currentStep + 1} of {tourSteps.length}</span>
              <span>{Math.round(progress)}%</span>
            </div>
            <Progress value={progress} className="h-1.5" />
          </div>

          <div className="flex items-center justify-between gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleSkip}
            >
              Skip tour
            </Button>

            <div className="flex items-center gap-2">
              {currentStep > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handlePrevious}
                >
                  Previous
                </Button>
              )}
              <Button
                variant="default"
                size="sm"
                onClick={handleNext}
              >
                {currentStep === tourSteps.length - 1 ? 'Finish' : 'Next'}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
