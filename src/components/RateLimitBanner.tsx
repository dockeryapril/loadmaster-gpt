import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface RateLimitBannerProps {
  show: boolean;
  onDismiss: () => void;
}

export function RateLimitBanner({ show, onDismiss }: RateLimitBannerProps) {
  const navigate = useNavigate();

  if (!show) return null;

  return (
    <Alert className="mb-4 border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950">
      <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
      <AlertDescription className="flex items-center justify-between">
        <span className="text-amber-800 dark:text-amber-200">
          Free limit reached today. Come back tomorrow or upgrade to Pro for more checks.
        </span>
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