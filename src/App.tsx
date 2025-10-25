import React, { useState, useEffect, useMemo } from 'react';
import { MessageSquare, InfoIcon, Truck, LogOut, User as UserIcon, Activity } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { Analytics } from '@vercel/analytics/react';
import { calculateDetailedProfit } from '@/types/load';
import { OCRDropzone } from '@/components/OCRDropzone';
import { decisionLabels, useDecisionStore, useCostProfile } from '@/store/useDecisionStore';
import { 
  trackCalculationSubmitted, 
  trackDecisionLogged, 
  trackFeedbackClicked,
  trackSessionStart,
  trackFuelTypeChanged,
  trackScreenshotUploaded
} from '@/utils/analytics';
import { CostProfileEditor } from '@/components/CostProfileEditor';
import { ProfitBreakdown } from '@/components/ProfitBreakdown';
import { GuidanceBadge } from '@/components/GuidanceBadge';
import { HistoryPanel } from '@/components/HistoryPanel';
import { PatternInsights } from '@/components/PatternInsights';
import { SimilarLoadIndicator } from '@/components/SimilarLoadIndicator';
// import { WelcomeCard } from '@/components/onboarding/WelcomeCard';
// import { OptionalTour } from '@/components/onboarding/OptionalTour';
import { AuthProvider, useAuth } from '@/hooks/useAuth';
import { SyncStatus } from '@/components/SyncStatus';
import { useCloudSync } from '@/hooks/useCloudSync';
import { useNegotiationEngine } from '@/hooks/useNegotiationEngine';
import { NegotiationMessageSheet } from '@/components/NegotiationMessageSheet';
import { features } from '@/utils/featureFlags';
import { toast } from '@/components/ui/use-toast';
import Auth from '@/pages/Auth';
import AdminAnalytics from '@/pages/AdminAnalytics';
import type { DecisionOutcome, LoadFormInput, Equipment, FuelType } from '@/types/mvp';
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

function UserMenu({ user }: { user: User }) {
  const { signOut } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  
  useEffect(() => {
    const checkAdmin = async () => {
      const { data } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .eq('role', 'admin')
        .maybeSingle();
      setIsAdmin(!!data);
    };
    checkAdmin();
  }, [user.id]);
  
  const handleSignOut = async () => {
    await signOut();
  };
  
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="flex items-center gap-2 rounded-lg border border-border bg-background px-3 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted">
          <UserIcon className="h-4 w-4" />
          <span className="hidden sm:inline">{user.email?.split('@')[0]}</span>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>My Account</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <div className="px-2 py-1.5 text-xs text-muted-foreground">
          {user.email}
        </div>
        <DropdownMenuSeparator />
        {isAdmin && (
          <>
            <DropdownMenuItem asChild className="cursor-pointer">
              <a href="/admin/analytics">
                <Activity className="mr-2 h-4 w-4" />
                Analytics Dashboard
              </a>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
          </>
        )}
        <DropdownMenuItem onClick={handleSignOut} className="cursor-pointer">
          <LogOut className="mr-2 h-4 w-4" />
          Sign Out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

const getInitialSplitPercent = () => {
  if (typeof window === 'undefined') return emptyLoadForm.splitPercent;
  const stored = window.localStorage.getItem('lm:splitPercent');
  return stored ?? emptyLoadForm.splitPercent;
};

const getInitialEquipment = (): Equipment => {
  if (typeof window === 'undefined') return 'hotshot';
  try {
    const stored = window.localStorage.getItem('lm:equipment');
    if (stored && ['hotshot', 'cargo_van', 'straight_truck'].includes(stored)) {
      return stored as Equipment;
    }
  } catch (error) {
    console.error('Failed to load equipment from localStorage', error);
  }
  return 'hotshot';
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
    equipment: getInitialEquipment(),
  }));
  const [outcome, setOutcome] = useState<DecisionOutcome>('book');
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [useSplit, setUseSplit] = useState(() => getInitialUseSplit());
  const [includeFsc, setIncludeFsc] = useState(() => getInitialToggleState('lm:includeFsc', true));
  const [includeTolls, setIncludeTolls] = useState(() => getInitialToggleState('lm:includeTolls', true));
  const [includeFuel, setIncludeFuel] = useState(() => getInitialToggleState('lm:includeFuel', true));
  const addDecision = useDecisionStore((state) => state.addDecision);
  const history = useDecisionStore((state) => state.history);
  const loadFromCloud = useDecisionStore((state) => state.loadFromCloud);
  const { costProfile } = useCostProfile();
  const { user } = useAuth();
  const { isSyncing, syncToCloud } = useCloudSync();
  const [isSynced, setIsSynced] = useState(false);
  const [negotiationSheetOpen, setNegotiationSheetOpen] = useState(false);

  // Track session start on mount
  useEffect(() => {
    trackSessionStart();
  }, []);

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
        { includeFsc, includeTolls, includeFuel },
      ),
    [rate, rawFsc, rawTolls, miles, costProfile, useSplit, splitPercent, includeFsc, includeTolls, includeFuel],
  );

  const profit = detailedCalculation.profit;
  const gross = detailedCalculation.breakdown.grossRevenue;
  const yourShare = detailedCalculation.breakdown.yourShare;

  const rpm = useMemo(() => (miles > 0 ? gross / miles : 0), [gross, miles]);
  const netRpm = useMemo(() => (miles > 0 ? profit / miles : 0), [profit, miles]);
  const yourShareRpm = useMemo(() => (miles > 0 ? yourShare / miles : 0), [yourShare, miles]);
  const displayedFuelCost = includeFuel
    ? detailedCalculation.breakdown.fuelCost
    : detailedCalculation.adjustments.originalFuelCost;

  // Negotiation engine (only when feature enabled)
  const negotiation = features.advancedNegotiation
    ? useNegotiationEngine(form, profit)
    : { calculation: null, templates: [], isReady: false };

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

  useEffect(() => {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem('lm:includeFuel', includeFuel ? 'true' : 'false');
  }, [includeFuel]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      window.localStorage.setItem('lm:equipment', form.equipment);
    } catch (error) {
      console.error('Failed to save equipment to localStorage', error);
    }
  }, [form.equipment]);

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
    // Track the screenshot upload
    trackScreenshotUploaded();
    
    setForm((prev) => {
      const next = { ...prev };
      Object.entries(data).forEach(([key, value]) => {
        if (value === undefined || value === null) return;
        const stringValue = typeof value === 'string' ? value : String(value);
        // Validate and assign equipment type
        if (key === 'equipment') {
          const validEquipment: Equipment[] = ['hotshot', 'cargo_van', 'straight_truck'];
          if (validEquipment.includes(stringValue as Equipment)) {
            next.equipment = stringValue as Equipment;
          }
        } else if (key in next) {
          (next as any)[key] = stringValue;
        }
        if (key === 'splitPercent') {
          setPersistedSplitPercent(stringValue);
        }
      });
      return next;
    });
    setShowAutoFillBadge(true);
    setTimeout(() => setShowAutoFillBadge(false), 5000);
    
    // Show toast notification
    toast({
      title: '✅ Fields auto-filled!',
      description: 'Review and adjust the values before calculating',
    });
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

    // Track milestone for 5th load
    if (history.length === 4) {
      toast({
        title: '🎉 Milestone!',
        description: 'Check your Pattern Insights to see booking trends',
      });
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
      fuelType: costProfile.fuelType,
    });

    // Track calculation submitted and decision logged
    trackCalculationSubmitted({
      miles,
      rate,
      profit,
      netRPM: netRpm,
      shareRPM: yourShareRpm,
    });
    trackDecisionLogged(outcome);

    setForm({
      ...emptyLoadForm,
      splitPercent: persistedSplitPercent,
      equipment: form.equipment, // Keep equipment selection
    });
    setOutcome('book');
    setTouched({});
  };

  return (
    <div className="min-h-screen bg-muted/30">
      {/* Sync Status Header */}
      <header className="border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <Truck className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h1 className="text-lg font-semibold">LoadMasterGPT</h1>
                <p className="text-xs text-muted-foreground">By Waypoint Labs LLC</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <SyncStatus 
                isSynced={isSynced} 
                isSyncing={isSyncing} 
                isAuthenticated={!!user}
              />
              {user ? (
                <UserMenu user={user} />
              ) : (
                <a
                  href="/auth"
                  className="rounded-lg border border-border bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted"
                >
                  Sign In
                </a>
              )}
            </div>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-8 lg:flex-row">
        <section className="flex-1 space-y-6 lg:w-3/5">
          {/* Welcome Card for first-time users - temporarily disabled for debugging */}
          {/* <WelcomeCard /> */}
          
          <header className="space-y-1">
              <p className="text-sm font-medium uppercase tracking-wide text-primary">True RPM Calculator</p>
              <h2 className="text-3xl font-semibold leading-tight text-foreground md:text-4xl">
                Fast profit snapshots before you book the load
              </h2>
              <p className="text-sm text-muted-foreground md:text-base">
                Drop a screenshote or enter the load details. We will pre-fill the form, show instant profit, and let you log
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
                <TooltipProvider>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground flex items-center gap-1.5">
                      Equipment Type
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <InfoIcon className="h-4 w-4 text-muted-foreground cursor-help" />
                        </TooltipTrigger>
                        <TooltipContent side="right" className="max-w-sm p-4">
                          <div className="space-y-2 text-xs">
                            <p className="font-semibold">What this affects:</p>
                            <ul className="list-disc pl-4 space-y-1">
                              <li><strong>Negotiation rates:</strong> Market-appropriate RPM thresholds for your equipment type</li>
                              <li><strong>Surcharge amounts:</strong> Contextual fees (tarping, liftgate, etc.) in negotiation messages</li>
                            </ul>
                            
                            <p className="font-semibold pt-2">What this does NOT affect:</p>
                            <ul className="list-disc pl-4 space-y-1">
                              <li><strong>Your actual profit:</strong> Calculated using YOUR custom cost profile (fuel price, MPG, fixed costs)</li>
                            </ul>
                            
                            <p className="pt-2 text-muted-foreground italic">
                              Why? This separation ensures you negotiate using industry-standard rates while calculating profit based on YOUR real operating costs.
                            </p>
                            
                            <p className="pt-2 text-muted-foreground">
                              ✓ Your selection is saved and persists between sessions
                            </p>
                          </div>
                        </TooltipContent>
                      </Tooltip>
                    </label>
                    <select
                      className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none"
                      value={form.equipment}
                      onChange={(event) => updateForm('equipment', event.target.value)}
                    >
                      <option value="hotshot">Hotshot</option>
                      <option value="cargo_van">Cargo Van</option>
                      <option value="straight_truck">Straight Truck</option>
                    </select>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Sets market-appropriate negotiation rates
                    </p>
                  </div>
                </TooltipProvider>


                {/* Rate confirmation assist - OCR */}
                <div className="rounded-xl border border-border bg-background p-4">
                  <h4 className="text-sm font-semibold">Rate confirmation assist</h4>
                  <p className="mt-1 text-xs text-muted-foreground">
                    OCR is optional. Drop a clear screenshot to auto-fill the fields.
                  </p>
                  <div className="mt-4">
                    <OCRDropzone onParse={applyOcr} />
                  </div>
                </div>

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
                  <TooltipProvider>
                    <div>
                      <div className="flex items-center justify-between">
                        <label className="text-sm font-medium text-muted-foreground flex items-center gap-1.5" htmlFor="fsc-input">
                          FSC
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <InfoIcon className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                            </TooltipTrigger>
                            <TooltipContent side="top">
                              <p>Include fuel surcharge in your net profit?</p>
                            </TooltipContent>
                          </Tooltip>
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
                </TooltipProvider>
                <TooltipProvider>
                  <div>
                    <div className="flex items-center justify-between">
                      <label className="text-sm font-medium text-muted-foreground flex items-center gap-1.5" htmlFor="tolls-input">
                        Tolls
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <InfoIcon className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                          </TooltipTrigger>
                          <TooltipContent side="top">
                            <p>Include toll costs in your expenses?</p>
                          </TooltipContent>
                        </Tooltip>
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
                </TooltipProvider>
                  <div>
                    <div className="flex items-center justify-between">
                      <label className="text-sm font-medium text-muted-foreground">Fuel</label>
                      <button
                        type="button"
                        onClick={() => setIncludeFuel((prev) => !prev)}
                        aria-pressed={includeFuel}
                        aria-label={includeFuel ? 'Exclude fuel from your costs' : 'Include fuel in your costs'}
                        className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                          includeFuel ? 'bg-primary' : 'bg-muted-foreground/30'
                        }`}
                      >
                        <span
                          className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${
                            includeFuel ? 'translate-x-5' : 'translate-x-1'
                          }`}
                        />
                      </button>
                    </div>
                    <div
                      className={`mt-1 rounded-lg border border-input px-3 py-2 text-sm text-muted-foreground ${
                        includeFuel ? 'bg-muted/50' : 'border-dashed bg-muted/30'
                      }`}
                    >
                      {formatCurrency(displayedFuelCost)}
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {includeFuel
                        ? 'Fuel is auto-calculated using your MPG and fuel price settings and subtracted from your costs.'
                        : 'Fuel is auto-calculated using your MPG and fuel price settings, but your carrier covers it, so $0.00 is taken out.'}
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
                    <CostProfileEditor 
                      currentEquipment={form.equipment}
                    />
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

                {features.advancedNegotiation && canLog && (
                  <button
                    type="button"
                    onClick={() => setNegotiationSheetOpen(true)}
                    className="w-full rounded-lg border-2 border-primary/20 bg-primary/5 px-4 py-3 text-sm font-medium text-primary transition hover:bg-primary/10 hover:border-primary/30"
                  >
                    <MessageSquare className="inline-block mr-2 h-4 w-4" />
                    Generate Negotiation Message
                  </button>
                )}

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
              </div>
            </div>
          </div>
        </section>

        <aside className="w-full space-y-6 lg:w-2/5 lg:max-w-none" data-onboarding="step-3">
          <PatternInsights />
          <HistoryPanel />
        </aside>
      </main>

      {/* Negotiation Message Sheet */}
      {features.advancedNegotiation && negotiation.calculation && (
        <NegotiationMessageSheet
          open={negotiationSheetOpen}
          onOpenChange={setNegotiationSheetOpen}
          calculation={negotiation.calculation}
          templates={negotiation.templates}
        />
      )}
      
      {/* Optional Tour Modal - temporarily disabled for debugging */}
      {/* <OptionalTour /> */}
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/auth" element={<Auth />} />
          <Route path="/admin/analytics" element={<AdminAnalytics />} />
          <Route path="/" element={<MainApp />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        <Toaster />
        <Analytics />
      </AuthProvider>
    </BrowserRouter>
  );
}
