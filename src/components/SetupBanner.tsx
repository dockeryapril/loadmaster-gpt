import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { X, TrendingUp, AlertCircle, Zap } from 'lucide-react';
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
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
        <BusinessSetupWizard
          mode="modal"
          onClose={() => setShowWizard(false)}
          onComplete={handleCompleteSetup}
        />
      </div>
    );
  }

  const getUrgencyVariant = () => {
    if (completionPercentage === 0) return 'high';
    if (completionPercentage < 50) return 'medium';
    return 'low';
  };

  const urgency = getUrgencyVariant();

  return (
    <Card className={`border-l-4 ${
      urgency === 'high' ? 'border-l-red-500 bg-red-50' :
      urgency === 'medium' ? 'border-l-amber-500 bg-amber-50' :
      'border-l-blue-500 bg-blue-50'
    }`}>
      <CardContent className="pt-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              {urgency === 'high' ? (
                <AlertCircle className="h-5 w-5 text-red-600" />
              ) : urgency === 'medium' ? (
                <TrendingUp className="h-5 w-5 text-amber-600" />
              ) : (
                <Zap className="h-5 w-5 text-blue-600" />
              )}
              
              <h3 className={`font-semibold ${
                urgency === 'high' ? 'text-red-900' :
                urgency === 'medium' ? 'text-amber-900' :
                'text-blue-900'
              }`}>
                {urgency === 'high' ? 'Setup Required for Accurate Calculations' :
                 urgency === 'medium' ? 'Complete Your Business Setup' :
                 'Finish Your Setup for Maximum Accuracy'}
              </h3>
            </div>

            <p className={`text-sm mb-4 ${
              urgency === 'high' ? 'text-red-700' :
              urgency === 'medium' ? 'text-amber-700' :
              'text-blue-700'
            }`}>
              {urgency === 'high' ? (
                'Your load calculations may be inaccurate without your business arrangement details. This could cost you hundreds per month in missed opportunities.'
              ) : urgency === 'medium' ? (
                'You\'re halfway there! Complete your setup to get personalized RPM calculations and better load recommendations.'
              ) : (
                'Almost done! Finish your setup to unlock the full power of personalized trucking calculations.'
              )}
            </p>

            {completionPercentage > 0 && (
              <div className="space-y-2 mb-4">
                <div className="flex justify-between text-sm">
                  <span className={urgency === 'high' ? 'text-red-700' : urgency === 'medium' ? 'text-amber-700' : 'text-blue-700'}>
                    Progress: {completionPercentage}% complete
                  </span>
                  <span className={urgency === 'high' ? 'text-red-600' : urgency === 'medium' ? 'text-amber-600' : 'text-blue-600'}>
                    ~{Math.ceil((100 - completionPercentage) / 20)} minutes remaining
                  </span>
                </div>
                <Progress 
                  value={completionPercentage} 
                  className={`h-2 ${
                    urgency === 'high' ? 'bg-red-100' :
                    urgency === 'medium' ? 'bg-amber-100' :
                    'bg-blue-100'
                  }`}
                />
              </div>
            )}

            <div className="flex gap-3">
              <Button
                onClick={handleStartSetup}
                className={
                  urgency === 'high' ? 'bg-red-600 hover:bg-red-700' :
                  urgency === 'medium' ? 'bg-amber-600 hover:bg-amber-700' :
                  'bg-blue-600 hover:bg-blue-700'
                }
              >
                {completionPercentage === 0 ? 'Start Setup' : 'Continue Setup'}
              </Button>
              
              <Button variant="outline" onClick={handleDismiss} size="sm">
                Remind Me Later
              </Button>
            </div>
          </div>

          <Button variant="ghost" size="sm" onClick={handleDismiss}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};