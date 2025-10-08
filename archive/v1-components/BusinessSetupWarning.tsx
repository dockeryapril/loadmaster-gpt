import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Settings, AlertTriangle } from 'lucide-react';
import { BusinessSetup } from '@/types/businessSetup';
import { getSetupCompletenessWarnings, isBusinessSetupSufficient } from '@/utils/businessSetupCalculations';

interface BusinessSetupWarningProps {
  businessSetup: BusinessSetup | null;
  onOpenSetup: () => void;
  className?: string;
}

export function BusinessSetupWarning({ businessSetup, onOpenSetup, className }: BusinessSetupWarningProps) {
  const warnings = getSetupCompletenessWarnings(businessSetup);
  const isSetupSufficient = isBusinessSetupSufficient(businessSetup);
  
  if (isSetupSufficient) {
    return null;
  }

  return (
    <Alert className={className} variant="default">
      <AlertTriangle className="h-4 w-4" />
      <AlertDescription className="flex items-center justify-between w-full">
        <div className="flex-1">
          <div className="font-medium">Business setup incomplete</div>
          <div className="text-sm text-muted-foreground mt-1">
            Complete your business setup for more accurate net take-home calculations.
            {warnings.length > 0 && (
              <div className="mt-2 text-xs">
                Missing: {warnings.slice(0, 2).join(', ')}
                {warnings.length > 2 && ` and ${warnings.length - 2} more`}
              </div>
            )}
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={onOpenSetup}
          className="ml-4 flex-shrink-0"
        >
          <Settings className="h-4 w-4 mr-2" />
          Complete Setup
        </Button>
      </AlertDescription>
    </Alert>
  );
}