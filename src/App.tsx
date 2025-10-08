import { useMemo, useState } from 'react';
import { calculateDetailedProfit } from '@/types/load';
import { OCRDropzone } from '@/components/OCRDropzone';
import { decisionLabels, useDecisionStore, useCostProfile } from '@/store/useDecisionStore';
import { CostProfileEditor } from '@/components/CostProfileEditor';
import { ProfitBreakdown } from '@/components/ProfitBreakdown';
import { GuidanceBadge } from '@/components/GuidanceBadge';
import type { DecisionOutcome, LoadFormInput } from '@/types/mvp';
import { emptyLoadForm } from '@/types/mvp';

const numberOrZero = (value: string) => {
  const parsed = parseFloat(value.replace(/[^\d.-]/g, ''));
  return Number.isFinite(parsed) ? parsed : 0;
};

function formatCurrency(value: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 2,
  }).format(value);
}

function formatNumber(value: number) {
  return new Intl.NumberFormat('en-US', {
    maximumFractionDigits: 2,
  }).format(value);
}

const outcomeOptions: DecisionOutcome[] = ['book', 'counter', 'pass'];

function App() {
  const [form, setForm] = useState<LoadFormInput>(() => ({ ...emptyLoadForm }));
  const [outcome, setOutcome] = useState<DecisionOutcome>('book');
  const history = useDecisionStore((state) => state.history);
  const addDecision = useDecisionStore((state) => state.addDecision);
  const clearHistory = useDecisionStore((state) => state.clearHistory);
  const { costProfile } = useCostProfile();

  const miles = numberOrZero(form.miles);
  const rate = numberOrZero(form.rate);
  const fsc = numberOrZero(form.fsc);
  const tolls = numberOrZero(form.tolls);

  // Calculate detailed profit using cost profile
  const detailedCalculation = useMemo(
    () => calculateDetailedProfit(rate, fsc, tolls, miles, costProfile),
    [rate, fsc, tolls, miles, costProfile],
  );

  const profit = detailedCalculation.profit;
  const gross = rate + fsc;

  const rpm = useMemo(() => (miles > 0 ? gross / miles : 0), [gross, miles]);
  const netRpm = useMemo(() => (miles > 0 ? profit / miles : 0), [profit, miles]);

  const canLog =
    Boolean(form.origin && form.destination) &&
    rate > 0 &&
    miles > 0;

  const updateForm = (field: keyof typeof form, value: string) => {
    setForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const applyOcr = (data: Partial<LoadFormInput>) => {
    setForm((prev) => {
      const next = { ...prev };
      Object.entries(data).forEach(([key, value]) => {
        if (value === undefined || value === null) return;
        next[key as keyof typeof next] = typeof value === 'string' ? value : String(value);
      });
      return next;
    });
  };

  const handleLogDecision = () => {
    if (!canLog) return;

    addDecision({
      outcome,
      origin: form.origin.trim(),
      destination: form.destination.trim(),
      miles,
      rate,
      fsc,
      tolls,
      fuelCost: detailedCalculation.breakdown.fuelCost,
      profit,
      rpm: netRpm,
      notes: form.notes.trim() || undefined,
    });

    setForm({ ...emptyLoadForm });
    setOutcome('book');
  };

  return (
    <div className="min-h-screen bg-muted/30">
      <main className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-8 md:flex-row">
        <section className="flex-1 space-y-6">
          <header className="space-y-1">
            <p className="text-sm font-medium uppercase tracking-wide text-primary">Load Worth Calculator</p>
            <h1 className="text-3xl font-semibold leading-tight text-foreground md:text-4xl">
              Fast profit snapshots before you book the load
            </h1>
            <p className="text-sm text-muted-foreground md:text-base">
              Enter the load details or drop in a rate confirmation. We will pre-fill the form, show instant profit, and let you log
              your decision for future reference.
            </p>
          </header>

          <div className="rounded-2xl border border-border bg-background/80 p-6 shadow-sm backdrop-blur">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Origin</label>
                  <input
                    className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none"
                    placeholder="City, ST"
                    value={form.origin}
                    onChange={(event) => updateForm('origin', event.target.value)}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Destination</label>
                  <input
                    className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none"
                    placeholder="City, ST"
                    value={form.destination}
                    onChange={(event) => updateForm('destination', event.target.value)}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Loaded miles</label>
                    <input
                      className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none"
                      placeholder="0"
                      inputMode="numeric"
                      value={form.miles}
                      onChange={(event) => updateForm('miles', event.target.value)}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Linehaul rate</label>
                    <input
                      className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none"
                      placeholder="$0"
                      inputMode="decimal"
                      value={form.rate}
                      onChange={(event) => updateForm('rate', event.target.value)}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">FSC</label>
                    <input
                      className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none"
                      placeholder="$0"
                      inputMode="decimal"
                      value={form.fsc}
                      onChange={(event) => updateForm('fsc', event.target.value)}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Tolls</label>
                    <input
                      className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none"
                      placeholder="$0"
                      inputMode="decimal"
                      value={form.tolls}
                      onChange={(event) => updateForm('tolls', event.target.value)}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Auto-calculated fuel</label>
                    <div className="mt-1 rounded-lg border border-input bg-muted/50 px-3 py-2 text-sm text-muted-foreground">
                      {formatCurrency(detailedCalculation.breakdown.fuelCost)}
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Based on your cost profile
                    </p>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Notes</label>
                  <textarea
                    className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none"
                    rows={3}
                    placeholder="Equipment, broker, must-knows"
                    value={form.notes}
                    onChange={(event) => updateForm('notes', event.target.value)}
                  />
                </div>
              </div>
              <div className="space-y-4">
                <div className="rounded-xl bg-primary/5 p-4">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-medium uppercase tracking-wide text-primary">Instant result</p>
                    <CostProfileEditor />
                  </div>
                  <h2 className="mt-2 text-3xl font-semibold text-foreground">{formatCurrency(profit)}</h2>
                  <p className="text-sm text-muted-foreground">Net profit after all costs</p>
                  
                  <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                    <div className="rounded-lg border border-border bg-background p-3">
                      <p className="text-xs uppercase tracking-wide text-muted-foreground">Gross RPM</p>
                      <p className="mt-1 font-semibold">{formatNumber(rpm)} /mi</p>
                    </div>
                    <div className="rounded-lg border border-border bg-background p-3">
                      <p className="text-xs uppercase tracking-wide text-muted-foreground">Net RPM</p>
                      <p className="mt-1 font-semibold">{formatNumber(netRpm)} /mi</p>
                    </div>
                  </div>

                  <div className="mt-4">
                    <ProfitBreakdown calculation={detailedCalculation} />
                  </div>
                </div>

                <GuidanceBadge netRpm={netRpm} profit={profit} />

                <div className="rounded-xl border border-border bg-background p-4">
                  <p className="text-sm font-semibold">Decision</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {outcomeOptions.map((value) => (
                      <button
                        key={value}
                        type="button"
                        onClick={() => setOutcome(value)}
                        className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
                          outcome === value
                            ? 'bg-primary text-primary-foreground shadow'
                            : 'border border-border text-muted-foreground hover:border-primary hover:text-primary'
                        }`}
                      >
                        {decisionLabels[value]}
                      </button>
                    ))}
                  </div>
                  <button
                    type="button"
                    onClick={handleLogDecision}
                    disabled={!canLog}
                    className="mt-4 w-full rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:bg-muted disabled:text-muted-foreground"
                  >
                    Log decision
                  </button>
                </div>

                <div className="rounded-xl border border-border bg-background p-4">
                  <h3 className="text-sm font-semibold">Rate confirmation assist</h3>
                  <p className="mt-1 text-xs text-muted-foreground">
                    OCR is optional. Drop a clear screenshot or paste text to auto-fill the fields.
                  </p>
                  <div className="mt-4">
                    <OCRDropzone onParse={applyOcr} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <aside className="w-full max-w-xl space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Decision history</h2>
            <button
              type="button"
              onClick={clearHistory}
              className="text-sm font-medium text-muted-foreground hover:text-destructive"
            >
              Clear
            </button>
          </div>
          <div className="space-y-3">
            {history.length === 0 ? (
              <p className="rounded-xl border border-dashed border-border bg-background/70 p-4 text-sm text-muted-foreground">
                No decisions logged yet. Book or pass a load to start tracking.
              </p>
            ) : (
              history.map((entry) => (
                <div key={entry.id} className="rounded-xl border border-border bg-background p-4 shadow-sm">
                  <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
                    <div className="font-semibold text-foreground">
                      {entry.origin} → {entry.destination}
                    </div>
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-medium uppercase tracking-wide ${
                        entry.outcome === 'book'
                          ? 'bg-emerald-500/10 text-emerald-600'
                          : entry.outcome === 'counter'
                            ? 'bg-amber-500/10 text-amber-600'
                            : 'bg-rose-500/10 text-rose-600'
                      }`}
                    >
                      {decisionLabels[entry.outcome]}
                    </span>
                  </div>
                  <div className="mt-3 grid grid-cols-2 gap-3 text-xs text-muted-foreground">
                    <div>
                      <p>Miles</p>
                      <p className="font-medium text-foreground">{formatNumber(entry.miles)}</p>
                    </div>
                    <div>
                      <p>Net profit</p>
                      <p className="font-medium text-foreground">{formatCurrency(entry.profit)}</p>
                    </div>
                    <div>
                      <p>Net RPM</p>
                      <p className="font-medium text-foreground">{formatNumber(entry.rpm)} /mi</p>
                    </div>
                    <div>
                      <p>Logged</p>
                      <p className="font-medium text-foreground">
                        {new Date(entry.createdAt).toLocaleString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                          month: 'short',
                          day: 'numeric',
                        })}
                      </p>
                    </div>
                  </div>
                  {entry.notes && <p className="mt-3 text-xs text-muted-foreground">{entry.notes}</p>}
                </div>
              ))
            )}
          </div>
        </aside>
      </main>
    </div>
  );
}

export default App;
