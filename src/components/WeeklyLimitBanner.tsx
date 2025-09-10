import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Calendar } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useWeeklyUploads } from "@/hooks/useWeeklyUploads";

interface WeeklyLimitBannerProps {
  show: boolean;
  onDismiss: () => void;
}

export function WeeklyLimitBanner({ show, onDismiss }: WeeklyLimitBannerProps) {
  const navigate = useNavigate();
  const { weeklyCount, weeklyLimit, remaining, resetDate, isPro } = useWeeklyUploads();

  if (!show) return null;

  // Show warning when user has 1 upload remaining
  const isWarning = remaining === 1;
  const isLimitReached = remaining === 0;

  // Format reset date
  const formatResetDate = (date: Date): string => {
    return date.toLocaleDateString('en-US', { 
      weekday: 'long', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  if (isLimitReached) {
    return (
      <Alert className="mb-4 border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950">
        <AlertTriangle className="h-4 w-4 text-red-600 dark:text-red-400" />
        <AlertDescription className="flex items-center justify-between">
          <div className="flex-1">
            <div className="text-red-800 dark:text-red-200 font-medium">
              Weekly limit reached ({weeklyCount}/{weeklyLimit})
            </div>
            <div className="text-sm text-red-700 dark:text-red-300 mt-1 flex items-center gap-2">
              <Calendar className="h-3 w-3" />
              Resets {formatResetDate(resetDate)}
            </div>
          </div>
          <div className="flex gap-2 ml-4">
            <Button 
              size="sm" 
              variant="outline"
              onClick={() => navigate('/weekly-limit-reached')}
              className="border-red-300 text-red-700 hover:bg-red-100 dark:border-red-700 dark:text-red-300 dark:hover:bg-red-900"
            >
              View Options
            </Button>
            <Button 
              size="sm" 
              variant="ghost"
              onClick={onDismiss}
              className="text-red-700 hover:bg-red-100 dark:text-red-300 dark:hover:bg-red-900"
            >
              Dismiss
            </Button>
          </div>
        </AlertDescription>
      </Alert>
    );
  }

  if (isWarning) {
    return (
      <Alert className="mb-4 border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950">
        <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
        <AlertDescription className="flex items-center justify-between">
          <div className="flex-1">
            <div className="text-amber-800 dark:text-amber-200 font-medium">
              Last upload remaining ({weeklyCount}/{weeklyLimit})
            </div>
            <div className="text-sm text-amber-700 dark:text-amber-300 mt-1">
              Upgrade to PRO for 100 uploads per week
            </div>
          </div>
          <div className="flex gap-2 ml-4">
            <Button 
              size="sm" 
              variant="outline"
              onClick={() => navigate('/upgrade')}
              className="border-amber-300 text-amber-700 hover:bg-amber-100 dark:border-amber-700 dark:text-amber-300 dark:hover:bg-amber-900"
            >
              Upgrade
            </Button>
            <Button 
              size="sm" 
              variant="ghost"
              onClick={onDismiss}
              className="text-amber-700 hover:bg-amber-100 dark:text-amber-300 dark:hover:bg-amber-900"
            >
              Dismiss
            </Button>
          </div>
        </AlertDescription>
      </Alert>
    );
  }

  return null;
}