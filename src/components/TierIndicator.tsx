import { Badge } from '@/components/ui/badge';
import { useTierDetection } from '@/hooks/useTierDetection';
import { Crown, Zap } from 'lucide-react';

interface TierIndicatorProps {
  className?: string;
}

export function TierIndicator({ className }: TierIndicatorProps) {
  const { tier, isPro, loading } = useTierDetection();

  if (loading) {
    return (
      <Badge variant="outline" className={className}>
        <div className="animate-pulse bg-muted rounded w-12 h-3" />
      </Badge>
    );
  }

  return (
    <Badge 
      variant={isPro ? "default" : "outline"} 
      className={`gap-1 ${className}`}
    >
      {isPro ? (
        <>
          <Crown className="h-3 w-3" />
          PRO
        </>
      ) : (
        <>
          <Zap className="h-3 w-3" />
          LITE
        </>
      )}
    </Badge>
  );
}