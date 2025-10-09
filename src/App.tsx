import { useMemo, useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { calculateDetailedProfit } from '@/types/load';
import { OCRDropzone } from '@/components/OCRDropzone';
import { decisionLabels, useDecisionStore, useCostProfile } from '@/store/useDecisionStore';
import { CostProfileEditor } from '@/components/CostProfileEditor';
import { ProfitBreakdown } from '@/components/ProfitBreakdown';
import { GuidanceBadge } from '@/components/GuidanceBadge';
import { HistoryPanel } from '@/components/HistoryPanel';
import { PatternInsights } from '@/components/PatternInsights';
import { SimilarLoadIndicator } from '@/components/SimilarLoadIndicator';
import { OnboardingTour } from '@/components/onboarding/OnboardingTour';
import { AuthProvider, useAuth } from '@/hooks/useAuth';
import { SyncStatus } from '@/components/SyncStatus';
import { useCloudSync } from '@/hooks/useCloudSync';
import Auth from '@/pages/Auth';
import type { DecisionOutcome, LoadFormInput } from '@/types/mvp';
import { emptyLoadForm } from '@/types/mvp';
import { Toaster } from '@/components/ui/toaster';

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

const getInitialSplitPercent = () => {
  if (typeof window === 'undefined') return emptyLoadForm.splitPercent;
  const stored = window.localStorage.getItem('lm:splitPercent');
  return stored ?? emptyLoadForm.splitPercent;
};

const getInitialUseSplit = () => {
  if (typeof window === 'undefined') return false;
  const stored = window.localStorage.getItem('lm:useSplit');
  return stored ? JSON.parse(stored) : false;
};

const getInitialToggleState = (key: string, defaultValue: boolean) => {
  if (typeof window === 'undefined') return defaultValue;
  const stored = window.localStorage.getItem(key);
  if (stored === null) return defaultValue;
  return stored === 'true';
};

function MainApp() {
  const [persistedSplitPercent, setPersistedSplitPercent] = useState<string>(() => getInitialSplitPercent());
  const [form, setForm] = useState<LoadFormInput>(() => ({
    ...emptyLoadForm,
    splitPercent: getInitialSplitPercent(),
  }));
  const [outcome, setOutcome] = useState<DecisionOutcome>('book');
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [useSplit, setUseSplit] = useState(() => getInitialUseSplit());
  const [includeFsc, setIncludeFsc] = useState(() => getInitialToggleState('lm:includeFsc', true));
  const [includeTolls, setIncludeTolls] = useState(() => getInitialToggleState('lm:includeTolls', true));
  const addDecision = useDecisionStore((state) => state.addDecision);
  const history = useDecisionStore((state) => state.history);
  const loadFromCloud = useDecisionStore((state) => state.loadFromCloud);
  const { costProfile } = useCostProfile();
  const { user } = useAuth();
  const { isSyncing, syncToCloud } = useCloudSync();
  const [isSynced, setIsSynced] = useState(false);

  const miles = numberOrZero(form.miles);
  const rate = numberOrZero(form.rate);
  const rawFsc = numberOrZero(form.fsc);
  const rawTolls = numberOrZero(form.tolls);
  const splitPercent = numberOrZero(form.splitPercent) || 100;

  // Calculate detailed profit using cost profile
  const detailedCalculation = useMemo(
    () =>
      calculateDetailedProfit(
        rate,
        rawFsc,
        rawTolls,
        miles,
        costProfile,
        useSplit ? splitPercent : 100,
        { includeFsc, includeTolls },
      ),
    [rate, rawFsc, rawTolls, miles, costProfile, useSplit, splitPercent, includeFsc, includeTolls],
  );

  const profit = detailedCalculation.profit;
  const gross = detailedCalculation.breakdown.grossRevenue;
  const yourShare = detailedCalculation.breakdown.yourShare;

  const rpm = useMemo(() => (miles > 0 ? gross / miles : 0), [gross, miles]);
  const netRpm = useMemo(() => (miles > 0 ? profit / miles : 0), [profit, miles]);
  const yourShareRpm = useMemo(() => (miles > 0 ? yourShare / miles : 0), [yourShare, miles]);

  const canLog =
    Boolean(form.origin && form.destination) &&
    rate > 0 &&
    miles > 0;

  const isInvalid = (field: keyof LoadFormInput) => {
    const requiredFields: (keyof LoadFormInput)[] = ['origin', 'destination', 'miles', 'rate'];
    return requiredFields.includes(field) && touched[field] && !form[field];
  };

  const updateForm = (field: keyof typeof form, value: string) => {
    if (field === 'splitPercent') {
      setPersistedSplitPercent(value);
    }

    setForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleBlur = (field: keyof LoadFormInput) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
  };

  const [showAutoFillBadge, setShowAutoFillBadge] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem('lm:useSplit', JSON.stringify(useSplit));
  }, [useSplit]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem('lm:splitPercent', persistedSplitPercent);
  }, [persistedSplitPercent]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem('lm:includeFsc', includeFsc ? 'true' : 'false');
  }, [includeFsc]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem('lm:includeTolls', includeTolls ? 'true' : 'false');
  }, [includeTolls]);

  // Load decisions from cloud when user signs in
  useEffect(() => {
    if (user) {
      loadFromCloud();
    }
  }, [user, loadFromCloud]);

  // Sync to cloud when decisions change (if authenticated)
  useEffect(() => {
    if (user && history.length > 0) {
      syncToCloud(history).then(() => setIsSynced(true));
    }
  }, [history, user, syncToCloud]);

  const applyOcr = (data: Partial<LoadFormInput>) => {
    setForm((prev) => {
      const next = { ...prev };
      Object.entries(data).forEach(([key, value]) => {
        if (value === undefined || value === null) return;
        const stringValue = typeof value === 'string' ? value : String(value);
        next[key as keyof typeof next] = stringValue;
        if (key === 'splitPercent') {
          setPersistedSplitPercent(stringValue);
        }
      });
      return next;
    });
    setShowAutoFillBadge(true);
    setTimeout(() => setShowAutoFillBadge(false), 5000);
  };

  const handleLogDecision = () => {
    if (!canLog) {
      // Mark all required fields as touched to show validation
      setTouched({
        origin: true,
        destination: true,
        miles: true,
        rate: true,
      });
      return;
    }

    addDecision({
      outcome,
      origin: form.origin.trim(),
      destination: form.destination.trim(),
      miles,
      rate,
      fsc: detailedCalculation.adjustments.appliedFsc,
      tolls: detailedCalculation.adjustments.appliedTolls,
      fuelCost: detailedCalculation.breakdown.fuelCost,
      profit,
      rpm: netRpm,
      notes: form.notes.trim() || undefined,
      splitPercent: useSplit ? splitPercent : undefined,
    });

    setForm({
      ...emptyLoadForm,
      splitPercent: persistedSplitPercent,
    });
    setOutcome('book');
    setTouched({});
  };

  return (
    <OnboardingTour>
      <div className="min-h-screen bg-muted/30">
        {/* Sync Status Header */}
        <header className="border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
            <div>
              <h1 className="text-lg font-semibold">LoadMaster</h1>
              <p className="text-xs text-muted-foreground">Quick Profitability Calculator</p>
            </div>
            <SyncStatus 
              isSynced={isSynced} 
              isSyncing={isSyncing} 
              isAuthenticated={!!user}
            />
          </div>
        </header>

        <main className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-8 md:flex-row">
          <section className="flex-1 space-y-6">
            <header className="space-y-1">
              <p className="text-sm font-medium uppercase tracking-wide text-primary">Load Worth Calculator</p>
              <h2 className="text-3xl font-semibold leading-tight text-foreground md:text-4xl">
                Fast profit snapshots before you book the load
              </h2>
              <p className="text-sm text-muted-foreground md:text-base">
                Enter the load details or drop in a rate confirmation. We will pre-fill the form, show instant profit, and let you log
                your decision for future reference.
              </p>
              {showAutoFillBadge && (
                <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
                  ✨ Auto-filled from image
                </div>
              )}
            </header>

            <div className="rounded-2xl border border-border bg-background/80 p-6 shadow-sm backdrop-blur">
            {/* Revenue Split Toggle */}
            <div className="mb-6 rounded-lg border border-border bg-muted/30 p-4">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <label className="text-sm font-medium text-foreground">Working with carrier split?</label>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Enable if you split revenue with a carrier/company
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setUseSplit(!useSplit)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    useSplit ? 'bg-primary' : 'bg-muted-foreground/30'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      useSplit ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
              {useSplit && (
                <div className="mt-4 space-y-2">
                  <label className="text-sm font-medium text-foreground">
                    Your percentage: {splitPercent}%
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    step="5"
                    value={form.splitPercent}
                    onChange={(e) => updateForm('splitPercent', e.target.value)}
                    className="w-full accent-primary"
                  />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>0%</span>
                    <span>50%</span>
                    <span>100%</span>
                  </div>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-4" data-onboarding="step-1">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    Origin <span className="text-rose-500">*</span>
                  </label>
                  <input
                    className={`mt-1 w-full rounded-lg border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none ${
                      isInvalid('origin') ? 'border-rose-500' : 'border-input'
                    }`}
                    placeholder="City, ST"
                    value={form.origin}
                    onChange={(event) => updateForm('origin', event.target.value)}
                    onBlur={() => handleBlur('origin')}
                  />
                  {isInvalid('origin') && (
                    <p className="mt-1 text-xs text-rose-500">Required</p>
                  )}
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    Destination <span className="text-rose-500">*</span>
                  </label>
                  <input
                    className={`mt-1 w-full rounded-lg border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none ${
                      isInvalid('destination') ? 'border-rose-500' : 'border-input'
                    }`}
                    placeholder="City, ST"
                    value={form.destination}
                    onChange={(event) => updateForm('destination', event.target.value)}
                    onBlur={() => handleBlur('destination')}
                  />
                  {isInvalid('destination') && (
                    <p className="mt-1 text-xs text-rose-500">Required</p>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">
                      Loaded miles <span className="text-rose-500">*</span>
                    </label>
                    <input
                      className={`mt-1 w-full rounded-lg border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none ${
                        isInvalid('miles') ? 'border-rose-500' : 'border-input'
                      }`}
                      placeholder="0"
                      inputMode="numeric"
                      value={form.miles}
                      onChange={(event) => updateForm('miles', event.target.value)}
                      onBlur={() => handleBlur('miles')}
                    />
                    {isInvalid('miles') && (
                      <p className="mt-1 text-xs text-rose-500">Required</p>
                    )}
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">
                      Linehaul rate <span className="text-rose-500">*</span>
                    </label>
                    <input
                      className={`mt-1 w-full rounded-lg border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none ${
                        isInvalid('rate') ? 'border-rose-500' : 'border-input'
                      }`}
                      placeholder="$0"
                      inputMode="decimal"
                      value={form.rate}
                      onChange={(event) => updateForm('rate', event.target.value)}
                      onBlur={() => handleBlur('rate')}
                    />
                    {isInvalid('rate') && (
                      <p className="mt-1 text-xs text-rose-500">Required</p>
                    )}
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <div className="flex items-center justify-between">
                      <label className="text-sm font-medium text-muted-foreground" htmlFor="fsc-input">
                        FSC
                      </label>
                      <button
                        type="button"
                        onClick={() => setIncludeFsc((prev) => !prev)}
                        aria-pressed={includeFsc}
                        aria-label={includeFsc ? 'Exclude FSC from your revenue' : 'Include FSC in your revenue'}
                        className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                          includeFsc ? 'bg-primary' : 'bg-muted-foreground/30'
                        }`}
                      >
                        <span
                          className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${
                            includeFsc ? 'translate-x-5' : 'translate-x-1'
                          }`}
                        />
                      </button>
                    </div>
                    <input
                      id="fsc-input"
                      className={`mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none ${
                        includeFsc ? '' : 'border-dashed text-muted-foreground'
                      }`}
                      placeholder="$0"
                      inputMode="decimal"
                      value={form.fsc}
                      onChange={(event) => updateForm('fsc', event.target.value)}
                    />
                    <p className="mt-1 text-xs text-muted-foreground">
                      {includeFsc
                        ? 'Included in your revenue calculations.'
                        : 'Excluded from your share (carrier keeps FSC).'}
                    </p>
                  </div>
                  <div>
                    <div className="flex items-center justify-between">
                      <label className="text-sm font-medium text-muted-foreground" htmlFor="tolls-input">
                        Tolls
                      </label>
                      <button
                        type="button"
                        onClick={() => setIncludeTolls((prev) => !prev)}
                        aria-pressed={includeTolls}
                        aria-label={includeTolls ? 'Exclude tolls from your costs' : 'Include tolls in your costs'}
                        className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                          includeTolls ? 'bg-primary' : 'bg-muted-foreground/30'
                        }`}
                      >
                        <span
                          className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${
                            includeTolls ? 'translate-x-5' : 'translate-x-1'
                          }`}
                        />
                      </button>
                    </div>
                    <input
                      id="tolls-input"
                      className={`mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none ${
                        includeTolls ? '' : 'border-dashed text-muted-foreground'
                      }`}
                      placeholder="$0"
                      inputMode="decimal"
                      value={form.tolls}
                      onChange={(event) => updateForm('tolls', event.target.value)}
                    />
                    <p className="mt-1 text-xs text-muted-foreground">
                      {includeTolls
                        ? 'Subtracted as part of your costs.'
                        : 'Covered by carrier (not subtracted).'}
                    </p>
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
                <div className="rounded-xl bg-primary/5 p-4" data-onboarding="step-2">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-medium uppercase tracking-wide text-primary">Instant result</p>
                    <CostProfileEditor />
                  </div>
                  <h3 className="mt-2 text-3xl font-semibold text-foreground">{formatCurrency(profit)}</h3>
                  <p className="text-sm text-muted-foreground">
                    {useSplit ? `Your share (${splitPercent}%) after all costs` : 'Net profit after all costs'}
                  </p>
                  
                  <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                    <div className="rounded-lg border border-border bg-background p-3">
                      <p className="text-xs uppercase tracking-wide text-muted-foreground">
                        {useSplit ? 'Your Share RPM' : 'Gross RPM'}
                      </p>
                      <p className="mt-1 font-semibold">
                        {formatNumber(useSplit ? yourShareRpm : rpm)} /mi
                      </p>
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

                <SimilarLoadIndicator 
                  currentLoad={form.origin && form.destination && miles > 0 ? { 
                    rpm: netRpm, 
                    origin: form.origin, 
                    destination: form.destination 
                  } : null} 
                />

                <GuidanceBadge netRpm={netRpm} profit={profit} thresholds={costProfile} />

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
                    title={!canLog ? 'Complete required fields (origin, destination, miles, rate)' : ''}
                    className="mt-4 w-full rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:bg-muted disabled:text-muted-foreground"
                  >
                    {!canLog ? 'Complete required fields to log' : 'Log decision'}
                  </button>
                </div>

                <div className="rounded-xl border border-border bg-background p-4">
                  <h4 className="text-sm font-semibold">Rate confirmation assist</h4>
                  <p className="mt-1 text-xs text-muted-foreground">
                    OCR is optional. Drop a clear screenshot to auto-fill the fields.
                  </p>
                  <div className="mt-4">
                    <OCRDropzone onParse={applyOcr} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <aside className="w-full max-w-xl space-y-6" data-onboarding="step-3">
          <PatternInsights />
          <HistoryPanel />
        </aside>
      </main>
    </div>
    </OnboardingTour>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/auth" element={<Auth />} />
          <Route path="/" element={<MainApp />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        <Toaster />
      </AuthProvider>
    </BrowserRouter>
  );
}
