import { CircleCheck, AlertTriangle, XCircle } from 'lucide-react';

export type GuidanceLevel = 'book' | 'counter' | 'pass';

interface GuidanceResult {
  level: GuidanceLevel;
  label: string;
  message: string;
  icon: typeof CircleCheck;
  colorClasses: {
    bg: string;
    text: string;
    border: string;
  };
}

interface GuidanceThresholds {
  goodRpm: number;
  fairRpm: number;
  goodProfit: number;
  fairProfit: number;
}

export function getLoadGuidance(netRpm: number, profit: number, thresholds: GuidanceThresholds): GuidanceResult {
  const isGoodRpm = netRpm >= thresholds.goodRpm;
  const isFairRpm = netRpm >= thresholds.fairRpm;
  const isGoodProfit = profit >= thresholds.goodProfit;
  const isFairProfit = profit >= thresholds.fairProfit;

  // Book it: Good RPM AND Good Profit
  if (isGoodRpm && isGoodProfit) {
    return {
      level: 'book',
      label: 'Book it',
      message: `Strong load — Net RPM is $${netRpm.toFixed(2)}/mi and profit is $${profit.toFixed(0)}`,
      icon: CircleCheck,
      colorClasses: {
        bg: 'bg-emerald-500/10',
        text: 'text-emerald-600',
        border: 'border-emerald-500/20',
      },
    };
  }

  // Pass: Poor RPM OR Poor Profit
  if (!isFairRpm || !isFairProfit) {
    return {
      level: 'pass',
      label: 'Pass',
      message: `Below target — Net RPM is $${netRpm.toFixed(2)}/mi. Better loads available.`,
      icon: XCircle,
      colorClasses: {
        bg: 'bg-rose-500/10',
        text: 'text-rose-600',
        border: 'border-rose-500/20',
      },
    };
  }

  // Counter: Everything else (marginal)
  return {
    level: 'counter',
    label: 'Consider countering',
    message: `Marginal — Net RPM is $${netRpm.toFixed(2)}/mi. Counter for a higher rate?`,
    icon: AlertTriangle,
    colorClasses: {
      bg: 'bg-amber-500/10',
      text: 'text-amber-600',
      border: 'border-amber-500/20',
    },
  };
}

interface GuidanceBadgeProps {
  netRpm: number;
  profit: number;
  thresholds: GuidanceThresholds;
}

export function GuidanceBadge({ netRpm, profit, thresholds }: GuidanceBadgeProps) {
  const guidance = getLoadGuidance(netRpm, profit, thresholds);
  const Icon = guidance.icon;

  return (
    <div className={`rounded-xl border p-4 ${guidance.colorClasses.bg} ${guidance.colorClasses.border}`}>
      <div className="flex items-center gap-3">
        <div className={`rounded-full p-2 ${guidance.colorClasses.text}`}>
          <Icon className="h-6 w-6" />
        </div>
        <div className="flex-1">
          <p className={`text-sm font-semibold ${guidance.colorClasses.text}`}>
            {guidance.label}
          </p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {guidance.message}
          </p>
        </div>
      </div>
    </div>
  );
}
