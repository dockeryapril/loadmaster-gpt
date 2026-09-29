import { getLoadGuidance } from './GuidanceBadge';
import type { CalcResult } from '@/lib/negotiation/types';
import type { CostAssumptions } from '@/types/mvp';

function money(value: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(value);
}

interface DecisionCardProps {
  netRpm: number;
  profit: number;
  thresholds: CostAssumptions;
  offeredRate: number;
  deadheadMiles: number;
  truckGross?: number;
  driverPay?: number;
  economicsLabel?: string;
  negotiationUnavailableReason?: string;
  compensationCounter?: { label: string; current: number; target: number; message: string };
  profileDecision?: { level: 'book' | 'counter' | 'pass'; message: string } | null;
  negotiation?: CalcResult | null;
  onOpenNegotiation?: () => void;
}

export function DecisionCard({
  netRpm,
  profit,
  thresholds,
  offeredRate,
  deadheadMiles,
  truckGross,
  driverPay,
  economicsLabel = 'True RPM',
  negotiationUnavailableReason,
  compensationCounter,
  profileDecision,
  negotiation,
  onOpenNegotiation,
}: DecisionCardProps) {
  const fallbackGuidance = getLoadGuidance(netRpm, profit, thresholds);
  const guidance = profileDecision
    ? { ...fallbackGuidance, level: profileDecision.level, message: profileDecision.message,
        colorClasses: profileDecision.level === 'book' ? { bg:'bg-emerald-500/10', text:'text-emerald-600', border:'border-emerald-500/20' } : profileDecision.level === 'pass' ? { bg:'bg-rose-500/10', text:'text-rose-600', border:'border-rose-500/20' } : { bg:'bg-amber-500/10', text:'text-amber-600', border:'border-amber-500/20' } }
    : fallbackGuidance;
  const title =
    guidance.level === 'book' ? 'BOOK' : guidance.level === 'pass' ? 'PASS' : 'COUNTER';

  const why =
    deadheadMiles > 0
      ? `${deadheadMiles.toLocaleString()} deadhead miles are included in the all-in-mile economics. ${guidance.message}`
      : guidance.message;
  const showTruckNegotiation = Boolean(negotiation && !negotiationUnavailableReason);

  return (
    <section className={`rounded-xl border p-5 ${guidance.colorClasses.bg} ${guidance.colorClasses.border}`}>
      <p className={`text-xs font-semibold uppercase tracking-[0.18em] ${guidance.colorClasses.text}`}>
        LoadMaster decision
      </p>
      <h3 className={`mt-1 text-3xl font-bold ${guidance.colorClasses.text}`}>{title}</h3>

      {showTruckNegotiation && negotiation && (
        <div className="mt-4 grid grid-cols-3 gap-2">
          <div className="rounded-lg border border-border/60 bg-background/80 p-3">
            <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Ask</p>
            <p className="mt-1 font-semibold">{money(negotiation.negotiation.anchor)}</p>
          </div>
          <div className="rounded-lg border border-border/60 bg-background/80 p-3">
            <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Target</p>
            <p className="mt-1 font-semibold">{money(negotiation.negotiation.target)}</p>
          </div>
          <div className="rounded-lg border border-border/60 bg-background/80 p-3">
            <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Bottom line</p>
            <p className="mt-1 font-semibold">{money(negotiation.negotiation.floor)}</p>
          </div>
        </div>
      )}

      <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
        <div>
          <p className="text-xs text-muted-foreground">Current offer</p>
          <p className="font-semibold">{money(offeredRate)}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">{economicsLabel}</p>
          <p className="font-semibold">${netRpm.toFixed(2)}/mi</p>
        </div>
      </div>

      {(truckGross !== undefined || driverPay !== undefined) && (
        <div className="mt-4 grid grid-cols-2 gap-3 rounded-lg border border-border/60 bg-background/80 p-3 text-sm">
          <div><p className="text-xs text-muted-foreground">Truck gross</p><p className="font-semibold">{money(truckGross ?? offeredRate)}</p></div>
          <div><p className="text-xs text-muted-foreground">Your estimated pay</p><p className="font-semibold">{money(driverPay ?? offeredRate)}</p></div>
        </div>
      )}

      <div className="mt-4 rounded-lg bg-background/70 p-3">
        <p className="text-xs font-semibold text-foreground">Why</p>
        <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{why}</p>
      </div>

      {guidance.level === 'counter' && compensationCounter && (
        <div className="mt-4 rounded-lg border border-border/60 bg-background/80 p-3">
          <p className="text-[10px] uppercase tracking-wide text-muted-foreground">What to negotiate</p>
          <p className="mt-1 text-sm font-semibold">{compensationCounter.label}: {money(compensationCounter.current)} → {money(compensationCounter.target)}</p>
          <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{compensationCounter.message}</p>
        </div>
      )}

      {guidance.level === 'counter' && negotiationUnavailableReason && (
        <div className="mt-4 rounded-lg border border-border/60 bg-background/70 p-3">
          <p className="text-xs font-semibold">Counter math</p>
          <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{negotiationUnavailableReason}</p>
        </div>
      )}

      {guidance.level === 'counter' && negotiation && onOpenNegotiation && (
        <button
          type="button"
          onClick={onOpenNegotiation}
          className="mt-4 w-full rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground transition hover:bg-primary/90"
        >
          Build counter message
        </button>
      )}
    </section>
  );
}
