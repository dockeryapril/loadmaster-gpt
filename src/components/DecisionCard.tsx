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
  negotiation?: CalcResult | null;
  onOpenNegotiation?: () => void;
}

export function DecisionCard({
  netRpm,
  profit,
  thresholds,
  offeredRate,
  deadheadMiles,
  negotiation,
  onOpenNegotiation,
}: DecisionCardProps) {
  const guidance = getLoadGuidance(netRpm, profit, thresholds);
  const title =
    guidance.level === 'book' ? 'BOOK' : guidance.level === 'pass' ? 'PASS' : 'COUNTER';

  const why =
    deadheadMiles > 0
      ? `${deadheadMiles.toLocaleString()} deadhead miles are included in your true RPM. ${guidance.message}`
      : guidance.message;

  return (
    <section className={`rounded-xl border p-5 ${guidance.colorClasses.bg} ${guidance.colorClasses.border}`}>
      <p className={`text-xs font-semibold uppercase tracking-[0.18em] ${guidance.colorClasses.text}`}>
        LoadMaster decision
      </p>
      <h3 className={`mt-1 text-3xl font-bold ${guidance.colorClasses.text}`}>{title}</h3>

      {negotiation && (
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
          <p className="text-xs text-muted-foreground">True RPM</p>
          <p className="font-semibold">${netRpm.toFixed(2)}/mi</p>
        </div>
      </div>

      <div className="mt-4 rounded-lg bg-background/70 p-3">
        <p className="text-xs font-semibold text-foreground">Why</p>
        <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{why}</p>
      </div>

      {negotiation && onOpenNegotiation && (
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
