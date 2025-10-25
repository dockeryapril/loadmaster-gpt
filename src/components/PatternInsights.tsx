import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { usePatternRecognition } from '@/hooks/usePatternRecognition';
import { TrendingUp, DollarSign, Route, BarChart3 } from 'lucide-react';

export function PatternInsights() {
  const { insights } = usePatternRecognition();

  if (insights.totalDecisions === 0) {
    return null;
  }

  // Show "need more data" message if less than 5 decisions
  if (insights.totalDecisions < 5) {
    return (
      <Card className="border-border">
        <CardContent className="pt-6">
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <BarChart3 className="h-12 w-12 text-muted-foreground/30 mb-3" />
            <p className="text-sm font-medium text-foreground">Need more data</p>
            <p className="text-xs text-muted-foreground mt-1">
              Log {5 - insights.totalDecisions} more load{5 - insights.totalDecisions > 1 ? 's' : ''} to see your performance patterns
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-primary/20">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <BarChart3 className="h-5 w-5 text-primary" />
          Your Decision Patterns
        </CardTitle>
        <CardDescription>
          Insights from {insights.totalDecisions} logged decisions
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Quick stats */}
        <div className="grid grid-cols-3 gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <TrendingUp className="h-3 w-3" />
              Best RPM
            </div>
            <div className="text-lg font-semibold">
              ${insights.bestRPM.toFixed(2)}
            </div>
          </div>
          
          <div className="space-y-1">
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <DollarSign className="h-3 w-3" />
              Avg Profit
            </div>
            <div className="text-lg font-semibold">
              ${insights.avgProfit.toFixed(0)}
            </div>
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Route className="h-3 w-3" />
              Book Rate
            </div>
            <div className="text-lg font-semibold">
              {insights.bookingRate.toFixed(0)}%
            </div>
          </div>
        </div>

        {/* Most common route */}
        {insights.mostCommonRoute && (
          <div className="rounded-lg bg-muted/50 p-3">
            <div className="text-xs text-muted-foreground mb-1">
              Most Common Route
            </div>
            <div className="font-medium">{insights.mostCommonRoute}</div>
          </div>
        )}

        {/* RPM range breakdown */}
        <div className="space-y-2">
          <div className="text-sm font-medium">Acceptance by RPM Range</div>
          {insights.rpmRanges
            .filter(range => range.totalLoads > 0)
            .map(range => (
              <div key={range.range} className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">{range.range}/mi</span>
                <div className="flex items-center gap-2">
                  <div className="w-24 h-2 bg-muted rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-primary"
                      style={{ width: `${range.acceptanceRate}%` }}
                    />
                  </div>
                  <span className="font-medium w-12 text-right">
                    {range.acceptanceRate.toFixed(0)}%
                  </span>
                  <span className="text-xs text-muted-foreground w-16 text-right">
                    ({range.bookedCount}/{range.totalLoads})
                  </span>
                </div>
              </div>
            ))}
        </div>
      </CardContent>
    </Card>
  );
}
