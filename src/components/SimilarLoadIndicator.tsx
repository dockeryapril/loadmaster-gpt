import { useSimilarLoads } from '@/hooks/usePatternRecognition';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Sparkles } from 'lucide-react';

interface SimilarLoadIndicatorProps {
  currentLoad: { rpm: number; origin: string; destination: string } | null;
}

export function SimilarLoadIndicator({ currentLoad }: SimilarLoadIndicatorProps) {
  const { similarLoad } = useSimilarLoads(currentLoad);

  if (!similarLoad || similarLoad.count < 2) {
    return null;
  }

  const bookingAdvice = similarLoad.bookingRate >= 75 
    ? "You usually book loads like this"
    : similarLoad.bookingRate >= 50
    ? "You sometimes book loads like this"
    : "You rarely book loads like this";

  return (
    <Alert className="border-primary/30 bg-primary/5">
      <Sparkles className="h-4 w-4 text-primary" />
      <AlertDescription>
        <span className="font-medium">{bookingAdvice}</span> at{' '}
        <span className="font-semibold">${similarLoad.avgRPM.toFixed(2)}/mi</span>
        {' '}(avg profit ${similarLoad.avgProfit.toFixed(0)}, {similarLoad.bookingRate.toFixed(0)}% booked, {similarLoad.count} similar loads)
      </AlertDescription>
    </Alert>
  );
}
