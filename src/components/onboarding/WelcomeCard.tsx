import { useOnboardingStore } from '@/store/useOnboardingStore';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Camera, DollarSign, TrendingUp, X } from 'lucide-react';
import { trackWelcomeCardDismissed } from '@/utils/analytics';

export function WelcomeCard() {
  const welcomeCardDismissed = useOnboardingStore((state) => state.welcomeCardDismissed);
  const dismissWelcomeCard = useOnboardingStore((state) => state.dismissWelcomeCard);

  if (welcomeCardDismissed) {
    return null;
  }

  const handleDismiss = () => {
    dismissWelcomeCard();
    trackWelcomeCardDismissed();
  };

  return (
    <Card className="border-primary/30 bg-primary/5 mb-6 relative">
      <button
        onClick={handleDismiss}
        className="absolute top-3 right-3 p-1 rounded-lg hover:bg-background/50 transition-colors"
        aria-label="Dismiss welcome message"
      >
        <X className="h-4 w-4 text-muted-foreground" />
      </button>
      
      <CardContent className="pt-6 pb-5 pr-12">
        <h3 className="text-lg font-semibold mb-3 text-foreground">
          Welcome to LoadMaster! Here's how to get started:
        </h3>
        
        <div className="space-y-2.5">
          <div className="flex items-start gap-3">
            <Camera className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
            <p className="text-sm text-foreground">
              <span className="font-medium">Upload a rate confirmation screenshot</span> to auto-fill load details instantly
            </p>
          </div>
          
          <div className="flex items-start gap-3">
            <DollarSign className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
            <p className="text-sm text-foreground">
              <span className="font-medium">See instant profit calculations</span> based on YOUR actual operating costs
            </p>
          </div>
          
          <div className="flex items-start gap-3">
            <TrendingUp className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
            <p className="text-sm text-foreground">
              <span className="font-medium">Track all loads</span> to spot your best-paying lanes and booking patterns
            </p>
          </div>
        </div>

        <Button 
          onClick={handleDismiss}
          variant="default"
          size="sm"
          className="mt-4"
        >
          Got it, let's start
        </Button>
      </CardContent>
    </Card>
  );
}
