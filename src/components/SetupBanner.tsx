import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Settings, X } from 'lucide-react';
import { BusinessSetupWizard } from './BusinessSetupWizard';
import { useSupabaseSettings } from '@/hooks/useSupabaseSettings';
import { useBusinessSetup } from '@/hooks/useBusinessSetup';

export const SetupBanner = () => {
  const { settings, updateSettings } = useSupabaseSettings();
  const { getCompletionPercentage, isSetupComplete } = useBusinessSetup();
  const [showWizard, setShowWizard] = useState(false);
  
  const completionPercentage = getCompletionPercentage();
  const setupComplete = isSetupComplete();

  // Don't show banner if setup is complete or user has dismissed reminders
  if (setupComplete || !settings?.showSetupReminders) {
    return null;
  }

  const handleDismiss = () => {
    updateSettings({ showSetupReminders: false });
  };

  const handleStartSetup = () => {
    setShowWizard(true);
  };

  const handleCompleteSetup = () => {
    setShowWizard(false);
    // Banner will automatically disappear when setup is complete
  };

  if (showWizard) {
    return (
      <div 
        className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
        onClick={(e) => {
          // Close on overlay click (but not on modal content click)
          if (e.target === e.currentTarget) {
            setShowWizard(false);
          }
        }}
        onKeyDown={(e) => {
          // Close on escape key
          if (e.key === 'Escape') {
            setShowWizard(false);
          }
        }}
        tabIndex={-1}
      >
        <div className="max-h-[90vh] overflow-y-auto w-full max-w-4xl">
          <BusinessSetupWizard
            mode="modal"
            onClose={() => setShowWizard(false)}
            onComplete={handleCompleteSetup}
          />
        </div>
      </div>
    );
  }

  return (
    <Card className="border border-border/50 bg-muted/30">
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3 flex-1">
            <div className="p-2 rounded-md bg-muted flex-shrink-0">
              <Settings className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-medium text-foreground mb-1">
                Business Setup Required
              </h3>
              <p className="text-sm text-muted-foreground mb-3">
                Configure your business details for accurate cost calculations and RPM analysis.
              </p>
              
              {completionPercentage > 0 && (
                <div className="space-y-2 mb-3">
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">
                      Setup progress: {completionPercentage}%
                    </span>
                  </div>
                  <Progress 
                    value={completionPercentage} 
                    className="h-1.5"
                  />
                </div>
              )}

              <Button
                onClick={handleStartSetup}
                size="sm"
                variant="secondary"
                className="mr-2"
              >
                {completionPercentage === 0 ? 'Configure Setup' : 'Continue Setup'}
              </Button>
            </div>
          </div>

          <Button variant="ghost" size="sm" onClick={handleDismiss} className="flex-shrink-0">
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};