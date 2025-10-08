import { useMemo } from 'react';
import type { LoadEntrySnapshot } from '@/types/mvp';

interface HistorySummaryCardProps {
  history: LoadEntrySnapshot[];
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(value);
}

function formatNumber(value: number) {
  return new Intl.NumberFormat('en-US', {
    maximumFractionDigits: 2,
  }).format(value);
}

export function HistorySummaryCard({ history }: HistorySummaryCardProps) {
  const weeklyStats = useMemo(() => {
    const now = new Date();
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const thisWeek = history.filter((entry) => {
      const entryDate = new Date(entry.createdAt);
      return entryDate >= oneWeekAgo && entryDate <= now;
    });

    const booked = thisWeek.filter((e) => e.outcome === 'book').length;
    const countered = thisWeek.filter((e) => e.outcome === 'counter').length;
    const passed = thisWeek.filter((e) => e.outcome === 'pass').length;

    const bookedEntries = thisWeek.filter((e) => e.outcome === 'book');
    const avgProfit =
      bookedEntries.length > 0
        ? bookedEntries.reduce((sum, e) => sum + e.profit, 0) / bookedEntries.length
        : 0;

    const bestRpm = thisWeek.length > 0 ? Math.max(...thisWeek.map((e) => e.rpm)) : 0;

    return {
      booked,
      countered,
      passed,
      avgProfit,
      bestRpm,
      total: thisWeek.length,
    };
  }, [history]);

  if (weeklyStats.total === 0) {
    return null;
  }

  return (
    <div className="rounded-xl border border-border bg-primary/5 p-4">
      <h3 className="text-xs font-medium uppercase tracking-wide text-primary">Last 7 days</h3>
      <div className="mt-3 grid grid-cols-3 gap-3">
        <div>
          <p className="text-xs text-muted-foreground">Booked</p>
          <p className="text-lg font-semibold text-emerald-600">{weeklyStats.booked}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Countered</p>
          <p className="text-lg font-semibold text-amber-600">{weeklyStats.countered}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Passed</p>
          <p className="text-lg font-semibold text-rose-600">{weeklyStats.passed}</p>
        </div>
      </div>
      <div className="mt-4 grid grid-cols-2 gap-3 border-t border-border pt-3 text-sm">
        <div>
          <p className="text-xs text-muted-foreground">Avg profit</p>
          <p className="font-semibold text-foreground">{formatCurrency(weeklyStats.avgProfit)}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Best RPM</p>
          <p className="font-semibold text-foreground">{formatNumber(weeklyStats.bestRpm)} /mi</p>
        </div>
      </div>
    </div>
  );
}
