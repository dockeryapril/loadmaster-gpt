import React, { useState, useEffect, useMemo } from 'react';
import { MessageSquare, InfoIcon, Truck, LogOut, User as UserIcon, Activity } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip';
import { BrowserRouter, Routes, Route, Navigate, Link } from 'react-router-dom';
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
  trackSessionStart } from
'@/utils/analytics';
import { CostProfileEditor } from '@/components/CostProfileEditor';
import { ProfitBreakdown } from '@/components/ProfitBreakdown';
import { DecisionCard } from '@/components/DecisionCard';
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
import type { DecisionOutcome, LoadFormInput, Equipment, CounterResult } from '@/types/mvp';
import { emptyLoadForm } from '@/types/mvp';
import { Toaster } from '@/components/ui/toaster';
import { Switch } from '@/components/ui/switch';
import { parseOfferText } from '@/utils/parseOfferText';
import { calculateCompensation, defaultCompensationProfile, type CompensationType } from '@/types/compensation';
import { reconcileOfferSources, type UnifiedOffer } from '@/utils/reconcileOfferSources';
import { OfferReview } from '@/components/OfferReview';
import { DriverProfileManager } from '@/components/DriverProfileManager';
import { useDriverProfileStore } from '@/store/useDriverProfileStore';
import { applyProfileToOffer } from '@/utils/applyDriverProfile';
import { calculateDriverDecisionEconomics } from '@/utils/driverDecisionEconomics';
import { calculateDriverNegotiationTargets } from '@/utils/driverNegotiationEconomics';
import { buildCompensationCounter } from '@/utils/compensationCounter';
import { getProfileCompensationDecision } from '@/utils/profileDecision';

const numberOrZero = (value: string) => {
  const parsed = parseFloat(value.replace(/[^\d.-]/g, ""));
  return Number.isFinite(parsed) ? parsed : 0;
};

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  }).format(value);
}

function formatNumber(value: number) {
  return new Intl.NumberFormat("en-US", {
    maximumFractionDigits: 2,
  }).format(value);
}

const outcomeOptions: DecisionOutcome[] = ["book", "counter", "pass"];

function UserMenu({ user }: { user: User }) {
  const { signOut } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const checkAdmin = async () => {
      const { data } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .eq("role", "admin")
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
          <span className="hidden sm:inline">{user.email?.split("@")[0]}</span>
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
  if (typeof window === "undefined") return emptyLoadForm.splitPercent;
  const stored = window.localStorage.getItem("lm:splitPercent");
  return stored ?? emptyLoadForm.splitPercent;
};

const getInitialEquipment = (): Equipment => {
  if (typeof window === "undefined") return "hotshot";
  try {
    const stored = window.localStorage.getItem("lm:equipment");
    if (stored && ["hotshot", "cargo_van", "straight_truck"].includes(stored)) {
      return stored as Equipment;
    }
  } catch (error) {
    console.error("Failed to load equipment from localStorage", error);
  }
  return "hotshot";
};

const getInitialUseSplit = () => {
  if (typeof window === "undefined") return false;
  const stored = window.localStorage.getItem("lm:useSplit");
  return stored ? JSON.parse(stored) : false;
};

const getInitialToggleState = (key: string, defaultValue: boolean) => {
  if (typeof window === "undefined") return defaultValue;
  const stored = window.localStorage.getItem(key);
  if (stored === null) return defaultValue;
  return stored === "true";
};

function MainApp() {
  const [persistedSplitPercent, setPersistedSplitPercent] = useState<string>(
    () => getInitialSplitPercent(),
  );
  const [form, setForm] = useState<LoadFormInput>(() => ({
    ...emptyLoadForm,
    splitPercent: getInitialSplitPercent(),
    equipment: getInitialEquipment(),
  }));
  const [outcome, setOutcome] = useState<DecisionOutcome>("book");
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [useSplit, setUseSplit] = useState(() => getInitialUseSplit());
  const [includeFsc, setIncludeFsc] = useState(() =>
    getInitialToggleState("lm:includeFsc", true),
  );
  const [includeTolls, setIncludeTolls] = useState(() =>
    getInitialToggleState("lm:includeTolls", true),
  );
  const [includeFuel, setIncludeFuel] = useState(() =>
    getInitialToggleState("lm:includeFuel", true),
  );
  const [includeFscInSplit, setIncludeFscInSplit] = useState(() =>
    getInitialToggleState("lm:includeFscInSplit", true),
  );
  const [compensationType, setCompensationType] = useState<CompensationType>('truck');
  const [perLoadedMile, setPerLoadedMile] = useState('');
  const [perDeadheadMile, setPerDeadheadMile] = useState('');
  const [flatPay, setFlatPay] = useState('');
  const [deadheadFlatPay, setDeadheadFlatPay] = useState('');
  const [deadheadFsc, setDeadheadFsc] = useState('');
  const addDecision = useDecisionStore((state) => state.addDecision);
  const history = useDecisionStore((state) => state.history);
  const loadFromCloud = useDecisionStore((state) => state.loadFromCloud);
  const { costProfile, updateCostProfile } = useCostProfile();
  const profiles = useDriverProfileStore((state) => state.profiles);
  const activeProfileId = useDriverProfileStore((state) => state.activeProfileId);
  const activeDriverProfile = profiles.find((profile) => profile.id === activeProfileId) ?? null;
  const { user } = useAuth();
  const { isSyncing, syncToCloud } = useCloudSync();
  const [isSynced, setIsSynced] = useState(false);
  const [negotiationSheetOpen, setNegotiationSheetOpen] = useState(false);
  const [negotiationOutcome, setNegotiationOutcome] = useState<{
    counterResult?: CounterResult;
    finalRate?: number;
  }>({});
  const isAuthUIEnabled = features.authEnabled;
  const isOCRVisible = features.ocrEnabled;

  // Track session start on mount
  useEffect(() => {
    trackSessionStart();
  }, []);

  // A driver profile controls operating assumptions, not the current load offer.
  useEffect(() => {
    if (!activeDriverProfile) return;
    const compensation = activeDriverProfile.compensation;

    setForm((prev) => applyProfileToOffer(prev, activeDriverProfile));
    setCompensationType(compensation.type);
    setUseSplit(compensation.type === 'percentage');
    setPersistedSplitPercent(String(compensation.percentage));
    setIncludeFscInSplit(compensation.includeFscInPercentage);
    setPerLoadedMile(compensation.perLoadedMile ? String(compensation.perLoadedMile) : '');
    setPerDeadheadMile(compensation.perDeadheadMile ? String(compensation.perDeadheadMile) : '');
    setFlatPay(compensation.flatRate ? String(compensation.flatRate) : '');
    setDeadheadFlatPay(compensation.deadheadFlatPay ? String(compensation.deadheadFlatPay) : '');
    setDeadheadFsc(compensation.deadheadFsc ? String(compensation.deadheadFsc) : '');
    setIncludeFuel(!activeDriverProfile.carrierPaysFuel);
    setIncludeTolls(!activeDriverProfile.carrierPaysTolls);
    updateCostProfile(activeDriverProfile.costs);
  }, [activeProfileId]);


  const miles = numberOrZero(form.miles);
  const deadheadMiles = numberOrZero(form.deadheadMiles);
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
        { includeFsc, includeTolls, includeFuel, includeFscInSplit },
        deadheadMiles,
      ),
    [
      rate,
      rawFsc,
      rawTolls,
      miles,
      deadheadMiles,
      costProfile,
      useSplit,
      splitPercent,
      includeFsc,
      includeTolls,
      includeFuel,
      includeFscInSplit,
    ],
  );

  const profit = detailedCalculation.profit;
  const gross = detailedCalculation.breakdown.grossRevenue;
  const yourShare = detailedCalculation.breakdown.yourShare;

  // Use RPM values from the breakdown
  const { loadedRpm, trueRpm } = detailedCalculation.breakdown;
  const rpm = useMemo(() => (miles > 0 ? gross / miles : 0), [gross, miles]);
  const yourShareRpm = useMemo(
    () => (miles > 0 ? yourShare / miles : 0),
    [yourShare, miles],
  );
  const displayedFuelCost = includeFuel
    ? detailedCalculation.breakdown.fuelCost
    : detailedCalculation.adjustments.originalFuelCost;

  const compensation = useMemo(() => calculateCompensation({
    ...defaultCompensationProfile,
    type: compensationType,
    percentage: splitPercent,
    perLoadedMile: numberOrZero(perLoadedMile),
    perDeadheadMile: numberOrZero(perDeadheadMile),
    flatRate: numberOrZero(flatPay),
    deadheadFlatPay: numberOrZero(deadheadFlatPay),
    deadheadFsc: numberOrZero(deadheadFsc),
    includeFscInPercentage: includeFscInSplit,
  }, rate, includeFsc ? rawFsc : 0, miles, deadheadMiles), [
    compensationType, splitPercent, perLoadedMile, perDeadheadMile, flatPay,
    deadheadFlatPay, deadheadFsc, includeFscInSplit, rate, includeFsc, rawFsc, miles, deadheadMiles,
  ]);

  const driverExpenses = compensationType === 'truck'
    ? 0
    : (includeFuel ? detailedCalculation.breakdown.fuelCost : 0) +
      (includeTolls ? detailedCalculation.breakdown.tollsCost : 0);
  const decisionEconomics = useMemo(
    () => calculateDriverDecisionEconomics(
      compensationType,
      compensation,
      profit,
      miles,
      deadheadMiles,
      driverExpenses,
    ),
    [compensationType, compensation, profit, miles, deadheadMiles, driverExpenses],
  );

  const activeCompensationProfile = useMemo(() => ({
    ...defaultCompensationProfile,
    type: compensationType,
    percentage: splitPercent,
    perLoadedMile: numberOrZero(perLoadedMile),
    perDeadheadMile: numberOrZero(perDeadheadMile),
    flatRate: numberOrZero(flatPay),
    deadheadFlatPay: numberOrZero(deadheadFlatPay),
    deadheadFsc: numberOrZero(deadheadFsc),
    includeFscInPercentage: includeFscInSplit,
  }), [compensationType, splitPercent, perLoadedMile, perDeadheadMile, flatPay, deadheadFlatPay, deadheadFsc, includeFscInSplit]);

  const driverNegotiation = useMemo(
    () => calculateDriverNegotiationTargets(
      activeCompensationProfile,
      decisionEconomics.net,
      driverExpenses,
      rate,
      includeFsc ? rawFsc : 0,
    ),
    [activeCompensationProfile, decisionEconomics.net, driverExpenses, rate, includeFsc, rawFsc],
  );

  const compensationCounter = useMemo(
    () => buildCompensationCounter(
      activeCompensationProfile,
      miles,
      deadheadMiles,
      rate,
      driverNegotiation.negotiable ? driverNegotiation.target : rate,
      activeDriverProfile?.compensationTargets,
    ),
    [activeCompensationProfile, miles, deadheadMiles, rate, driverNegotiation, activeDriverProfile?.compensationTargets],
  );

  const profileDecision = useMemo(
    () => getProfileCompensationDecision(activeCompensationProfile, activeDriverProfile?.compensationTargets),
    [activeCompensationProfile, activeDriverProfile?.compensationTargets],
  );

  // Negotiation engine (only when feature enabled)
  const negotiation = features.advancedNegotiation
    ? useNegotiationEngine(form, profit)
    : { calculation: null, templates: [], isReady: false };

  const canLog =
    Boolean(form.origin && form.destination) && rate > 0 && miles > 0;

  const isInvalid = (field: keyof LoadFormInput) => {
    const requiredFields: (keyof LoadFormInput)[] = [
      "origin",
      "destination",
      "miles",
      "rate",
    ];
    return requiredFields.includes(field) && touched[field] && !form[field];
  };

  const updateForm = (field: keyof typeof form, value: string) => {
    if (field === "splitPercent") {
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
  const [offerText, setOfferText] = useState("");
  const [pastedOfferData, setPastedOfferData] = useState<Partial<LoadFormInput> | null>(null);
  const [ocrOfferData, setOcrOfferData] = useState<Partial<LoadFormInput> | null>(null);
  const [ocrOfferSources, setOcrOfferSources] = useState<Record<string, number[]>>({});
  const [offerReview, setOfferReview] = useState<UnifiedOffer | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem("lm:useSplit", JSON.stringify(useSplit));
  }, [useSplit]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem("lm:splitPercent", persistedSplitPercent);
  }, [persistedSplitPercent]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem("lm:includeFsc", includeFsc ? "true" : "false");
  }, [includeFsc]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(
      "lm:includeTolls",
      includeTolls ? "true" : "false",
    );
  }, [includeTolls]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(
      "lm:includeFuel",
      includeFuel ? "true" : "false",
    );
  }, [includeFuel]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(
      "lm:includeFscInSplit",
      includeFscInSplit ? "true" : "false",
    );
  }, [includeFscInSplit]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      window.localStorage.setItem("lm:equipment", form.equipment);
    } catch (error) {
      console.error("Failed to save equipment to localStorage", error);
    }
  }, [form.equipment]);

  // Load decisions from cloud when user signs in
  useEffect(() => {
    if (features.supabaseSync && user) {
      loadFromCloud();
    }
  }, [user, loadFromCloud]);

  // Sync to cloud when decisions change (if authenticated)
  useEffect(() => {
    if (features.supabaseSync && user && history.length > 0) {
      syncToCloud(history).then(() => setIsSynced(true));
    }
  }, [history, user, syncToCloud]);

  const applyOcr = (data: Partial<LoadFormInput>) => {
    setForm((prev) => {
      const next = { ...prev };
      Object.entries(data).forEach(([key, value]) => {
        if (value === undefined || value === null) return;
        const stringValue = typeof value === "string" ? value : String(value);
        // Validate and assign equipment type
        if (key === "equipment") {
          const validEquipment: Equipment[] = [
            "hotshot",
            "cargo_van",
            "straight_truck",
          ];
          if (validEquipment.includes(stringValue as Equipment)) {
            next.equipment = stringValue as Equipment;
          }
        } else if (key in next) {
          (next as any)[key] = stringValue;
        }
        if (key === "splitPercent") {
          setPersistedSplitPercent(stringValue);
        }
      });
      return next;
    });
    setShowAutoFillBadge(true);
    setTimeout(() => setShowAutoFillBadge(false), 5000);

    // Show toast notification
    toast({
      title: "✅ Fields auto-filled!",
      description: "Review and adjust the values before calculating",
    });
  };

  const buildOfferReview = (pasteData: Partial<LoadFormInput> | null, imageData: Partial<LoadFormInput> | null, imageSources: Record<string, number[]> = {}) => {
    const sources: Array<{ label: string; data: Record<string, string | undefined> }> = [];
    if (pasteData) sources.push({ label: "Pasted text", data: pasteData });
    if (imageData) {
      const fields = ["origin", "destination", "miles", "deadheadMiles", "rate", "fsc", "tolls"] as const;
      for (const field of fields) {
        const value = imageData[field];
        if (!value) continue;
        const nums = imageSources[field] || [];
        sources.push({ label: nums.length ? nums.map((n) => `Image ${n}`).join(" + ") : "Uploaded image", data: { [field]: value } });
      }
    }
    setOfferReview(reconcileOfferSources(sources as Parameters<typeof reconcileOfferSources>[0]));
  };

  const applyPastedOffer = () => {
    const parsed = parseOfferText(offerText);
    const data: Partial<LoadFormInput> = {
      ...(parsed.origin ? { origin: parsed.origin } : {}),
      ...(parsed.destination ? { destination: parsed.destination } : {}),
      ...(parsed.miles ? { miles: parsed.miles } : {}),
      ...(parsed.deadheadMiles ? { deadheadMiles: parsed.deadheadMiles } : {}),
      ...(parsed.rate ? { rate: parsed.rate } : {}),
      ...(parsed.fsc ? { fsc: parsed.fsc } : {}),
    };
    if (Object.keys(data).length < 2) {
      toast({ title: "Couldn’t confidently read that offer", description: "Try including pickup, delivery, loaded miles and rate." });
      return;
    }
    setPastedOfferData(data);
    buildOfferReview(data, ocrOfferData, ocrOfferSources);
  };

  const handleOcrExtract = (data: Partial<LoadFormInput>, sources: Record<string, number[]>) => {
    setOcrOfferData(data);
    setOcrOfferSources(sources);
    buildOfferReview(pastedOfferData, data, sources);
  };

  const applyReviewedOffer = (data: Partial<LoadFormInput>) => {
    setForm((prev) => ({ ...prev, ...data, ...(offerText.trim() ? { notes: offerText.trim() } : {}) }));
    setOfferReview(null);
    setShowAutoFillBadge(true);
    setTimeout(() => setShowAutoFillBadge(false), 5000);
    toast({ title: "Offer applied", description: "Verified fields are ready for calculation." });
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
        title: "🎉 Milestone!",
        description: "Check your Pattern Insights to see booking trends",
      });
    }

    const hasAcceptedCounter =
      outcome === "counter" &&
      negotiationOutcome.counterResult === "accepted" &&
      typeof negotiationOutcome.finalRate === "number";

    const effectiveRate = hasAcceptedCounter ? negotiationOutcome.finalRate : rate;
    const effectiveCalculation =
      effectiveRate !== rate
        ? calculateDetailedProfit(
            effectiveRate,
            rawFsc,
            rawTolls,
            miles,
            costProfile,
            useSplit ? splitPercent : 100,
            { includeFsc, includeTolls, includeFuel, includeFscInSplit },
            deadheadMiles,
          )
        : detailedCalculation;
    const effectiveShareRpm =
      effectiveCalculation.breakdown.loadedMiles > 0
        ? effectiveCalculation.breakdown.yourShare /
          effectiveCalculation.breakdown.loadedMiles
        : 0;

    addDecision({
      outcome,
      origin: form.origin.trim(),
      destination: form.destination.trim(),
      miles,
      deadheadMiles: deadheadMiles > 0 ? deadheadMiles : undefined,
      rate,
      fsc: effectiveCalculation.adjustments.appliedFsc,
      tolls: effectiveCalculation.adjustments.appliedTolls,
      fuelCost: effectiveCalculation.breakdown.fuelCost,
      profit: effectiveCalculation.profit,
      rpm: effectiveCalculation.breakdown.trueRpm, // Use true RPM for decisions
      notes: form.notes.trim() || undefined,
      splitPercent: useSplit ? splitPercent : undefined,
      fuelType: costProfile.fuelType,
      counterResult: outcome === "counter" ? negotiationOutcome.counterResult : undefined,
      finalRate:
        outcome === "counter" && negotiationOutcome.counterResult === "accepted"
          ? negotiationOutcome.finalRate
          : undefined,
    });

    // Track calculation submitted and decision logged
    trackCalculationSubmitted({
      miles,
      rate: effectiveRate,
      profit: effectiveCalculation.profit,
      netRPM: effectiveCalculation.breakdown.trueRpm, // Use true RPM for analytics
      shareRPM: effectiveShareRpm,
    });
    trackDecisionLogged(outcome);

    setForm({
      ...emptyLoadForm,
      splitPercent: persistedSplitPercent,
      equipment: form.equipment, // Keep equipment selection
    });
    setOutcome("book");
    setNegotiationOutcome({});
    setTouched({});
  };

  const handleApplyNegotiationOutcome = ({
    counterResult,
    finalRate,
  }: {
    counterResult: CounterResult;
    finalRate?: number;
  }) => {
    setNegotiationOutcome({ counterResult, finalRate });

    if (counterResult === "accepted" && typeof finalRate === "number") {
      setOutcome("counter");
    }
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
              <p className="text-xs text-muted-foreground">
                By Waypoint Labs LLC
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {/* Mobile: Icon-only button */}
            <a
              href="https://public.tableau.com/views/WeeklyNationalRPMbyDivisionFinal/1_MapRPMbyModeandEquipNEWDash2"
              target="_blank"
              rel="noopener noreferrer"
              className="flex sm:hidden items-center justify-center rounded-lg border border-border bg-background p-2 text-foreground transition-colors hover:bg-muted"
              title="Market Rates"
            >
              📊
            </a>
            {/* Desktop: Full button with text */}
            <a
              href="https://public.tableau.com/views/WeeklyNationalRPMbyDivisionFinal/1_MapRPMbyModeandEquipNEWDash2"
              target="_blank"
              rel="noopener noreferrer"
              className="hidden sm:flex items-center gap-2 rounded-lg border border-border bg-background px-3 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted">
              
                📊 Market Rates
              </a>
              {isAuthUIEnabled &&
              <>
                  <SyncStatus
                isSynced={isSynced}
                isSyncing={isSyncing}
                isAuthenticated={!!user} />
              
                  {user ?
                <UserMenu user={user} /> :

                <a
                  href="/auth"
                  className="rounded-lg border border-border bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted">
                  
                      Sign In
                    </a>
                }
                </>
              }
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
                Run the numbers before you run the miles
              </h2>
              <p className="text-sm text-muted-foreground md:text-base">
                {isOCRVisible ?
                'Enter the load details or sign in to unlock OCR auto-fill from screenshots.' :
                'Enter the load details to get instant profit guidance and decision support.'}
              </p>
              {showAutoFillBadge &&
            <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
                  ✨ Auto-filled from image
                </div>
            }
            </header>

          <div className="rounded-2xl border border-border bg-background/80 p-6 shadow-sm backdrop-blur">
            <div className="mb-6 rounded-lg border border-border bg-muted/30 p-4">
              <label className="text-sm font-medium text-foreground">How are you paid?</label>
              <p className="mt-0.5 text-xs text-muted-foreground">Keep Truck economics for owner-operator profit, or calculate your personal driver/contractor pay.</p>
              <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
                {([
                  ['truck', 'Truck economics'],
                  ['percentage', 'Percentage'],
                  ['per_mile', 'Per mile'],
                  ['flat', 'Flat rate'],
                ] as const).map(([value, label]) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => {
                      setCompensationType(value);
                      setUseSplit(value === 'percentage');
                    }}
                    className={`rounded-lg border px-3 py-2 text-xs font-medium transition ${
                      compensationType === value
                        ? 'border-primary bg-primary text-primary-foreground'
                        : 'border-border bg-background text-muted-foreground hover:border-primary'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>

              {compensationType === 'per_mile' && (
                <div className="mt-4 grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-muted-foreground">Loaded $/mile</label>
                    <input className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm" inputMode="decimal" placeholder="$0.00" value={perLoadedMile} onChange={(e) => setPerLoadedMile(e.target.value)} />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground">Deadhead $/mile</label>
                    <input className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm" inputMode="decimal" placeholder="$0.00" value={perDeadheadMile} onChange={(e) => setPerDeadheadMile(e.target.value)} />
                  </div>
                </div>
              )}

              {compensationType === 'flat' && (
                <div className="mt-4">
                  <label className="text-xs text-muted-foreground">Your flat pay</label>
                  <input className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm" inputMode="decimal" placeholder="$0.00" value={flatPay} onChange={(e) => setFlatPay(e.target.value)} />
                </div>
              )}

              {compensationType !== 'truck' && deadheadMiles > 0 && compensationType !== 'per_mile' && (
                <div className="mt-4 grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-muted-foreground">Deadhead pay</label>
                    <input className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm" inputMode="decimal" placeholder="$0.00" value={deadheadFlatPay} onChange={(e) => setDeadheadFlatPay(e.target.value)} />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground">Deadhead FSC</label>
                    <input className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm" inputMode="decimal" placeholder="$0.00" value={deadheadFsc} onChange={(e) => setDeadheadFsc(e.target.value)} />
                  </div>
                </div>
              )}

              {compensationType !== 'truck' && (
                <div className="mt-4 rounded-lg border border-primary/20 bg-primary/5 p-3">
                  <p className="text-xs uppercase tracking-wide text-primary">Estimated personal pay</p>
                  <p className="mt-1 text-xl font-semibold text-foreground">{formatCurrency(compensation.pay)}</p>
                  {deadheadMiles > 0 && compensation.deadheadPay + compensation.deadheadFsc > 0 && (
                    <p className="text-xs text-muted-foreground">
                      Includes {formatCurrency(compensation.deadheadPay + compensation.deadheadFsc)} in deadhead compensation.
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Revenue Split Toggle */}
            <div className={`mb-6 rounded-lg border border-border bg-muted/30 p-4 ${compensationType === 'percentage' ? '' : 'hidden'}`}>
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <label className="text-sm font-medium text-foreground">
                    Working with carrier split?
                  </label>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Enable if you split revenue with a carrier/company
                  </p>
                </div>
                <Switch checked={useSplit} onCheckedChange={setUseSplit} />
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
                    onChange={(e) => updateForm("splitPercent", e.target.value)}
                    className="w-full accent-primary"
                  />

                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>0%</span>
                    <span>50%</span>
                    <span>100%</span>
                  </div>
                  <div className="mt-4 flex items-center justify-between rounded-lg border border-border bg-background p-3">
                    <div className="pr-4">
                      <p className="text-sm font-medium text-foreground">FSC is part of the percentage split</p>
                      <p className="text-xs text-muted-foreground">
                        Turn this off when your percentage is calculated on linehaul only.
                      </p>
                    </div>
                    <Switch
                      checked={includeFscInSplit}
                      onCheckedChange={setIncludeFscInSplit}
                      aria-label="Include FSC in percentage split"
                    />
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
                              <li>
                                <strong>Negotiation rates:</strong>{" "}
                                Market-appropriate RPM thresholds for your
                                equipment type
                              </li>
                              <li>
                                <strong>Surcharge amounts:</strong> Contextual
                                fees (tarping, liftgate, etc.) in negotiation
                                messages
                              </li>
                            </ul>

                            <p className="font-semibold pt-2">
                              What this does NOT affect:
                            </p>
                            <ul className="list-disc pl-4 space-y-1">
                              <li>
                                <strong>Your actual profit:</strong> Calculated
                                using YOUR custom cost profile (fuel price, MPG,
                                fixed costs)
                              </li>
                            </ul>

                            <p className="pt-2 text-muted-foreground italic">
                              Why? This separation ensures you negotiate using
                              industry-standard rates while calculating profit
                              based on YOUR real operating costs.
                            </p>

                            <p className="pt-2 text-muted-foreground">
                              ✓ Your selection is saved and persists between
                              sessions
                            </p>
                          </div>
                        </TooltipContent>
                      </Tooltip>
                    </label>
                    <select
                      className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none"
                      value={form.equipment}
                      onChange={(event) =>
                        updateForm("equipment", event.target.value)
                      }
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

                <div className="rounded-xl border border-border bg-background p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <h4 className="text-sm font-semibold">Paste dispatch offer</h4>
                      <p className="mt-1 text-xs text-muted-foreground">
                        Paste broker or dispatch text and LoadMaster will fill the fields it can identify.
                      </p>
                    </div>
                  </div>
                  <textarea
                    className="mt-3 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none"
                    rows={4}
                    placeholder={"PU Gainesville, GA\nDEL Laredo, TX\n1048 loaded / 42 DH\n$1750 + FSC $300"}
                    value={offerText}
                    onChange={(event) => setOfferText(event.target.value)}
                  />
                  <button
                    type="button"
                    onClick={applyPastedOffer}
                    disabled={!offerText.trim()}
                    className="mt-3 w-full rounded-lg border border-primary/30 bg-primary/5 px-3 py-2 text-sm font-medium text-primary transition hover:bg-primary/10 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Parse & Fill Offer
                  </button>
                </div>

                {/* Rate confirmation assist - OCR */}
                {isOCRVisible &&
                <div className={`rounded-xl border p-4 ${user ? 'border-border bg-background' : 'border-dashed border-primary/40 bg-primary/5'}`}>
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-semibold">Rate confirmation assist</h4>
                      {!user &&
                    <span className="rounded-full bg-primary/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-primary">
                          Sign-in required
                        </span>
                    }
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {user ?
                    'Upload up to 5 screenshots/photos from the same offer. LoadMaster will combine what it finds and flag conflicting values.' :
                    'Sign in to use OCR auto-fill.'}
                    </p>
                    <div className="mt-4">
                      <OCRDropzone onExtract={handleOcrExtract} disabled={!user} />
                    </div>
                    {!user &&
                  <Link
                    to="/auth"
                    className="mt-3 inline-flex items-center rounded-full border border-primary px-3 py-1 text-xs font-medium text-primary hover:bg-primary/10">
                    
                        Sign in to use OCR
                      </Link>
                  }
                  </div>
                }

                {offerReview && (
                  <OfferReview
                    offer={offerReview}
                    onApply={applyReviewedOffer}
                    onCancel={() => setOfferReview(null)}
                  />
                )}

                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    Origin <span className="text-rose-500">*</span>
                  </label>
                  <input
                    className={`mt-1 w-full rounded-lg border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none ${
                      isInvalid("origin") ? "border-rose-500" : "border-input"
                    }`}
                    placeholder="City, ST"
                    value={form.origin}
                    onChange={(event) =>
                      updateForm("origin", event.target.value)
                    }
                    onBlur={() => handleBlur("origin")}
                  />

                  {isInvalid("origin") && (
                    <p className="mt-1 text-xs text-rose-500">Required</p>
                  )}
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    Destination <span className="text-rose-500">*</span>
                  </label>
                  <input
                    className={`mt-1 w-full rounded-lg border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none ${
                      isInvalid("destination")
                        ? "border-rose-500"
                        : "border-input"
                    }`}
                    placeholder="City, ST"
                    value={form.destination}
                    onChange={(event) =>
                      updateForm("destination", event.target.value)
                    }
                    onBlur={() => handleBlur("destination")}
                  />

                  {isInvalid("destination") && (
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
                        isInvalid("miles") ? "border-rose-500" : "border-input"
                      }`}
                      placeholder="0"
                      inputMode="numeric"
                      value={form.miles}
                      onChange={(event) =>
                        updateForm("miles", event.target.value)
                      }
                      onBlur={() => handleBlur("miles")}
                    />

                    {isInvalid("miles") && (
                      <p className="mt-1 text-xs text-rose-500">Required</p>
                    )}
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">
                      Deadhead
                    </label>
                    <input
                      className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none"
                      placeholder="Empty mi"
                      inputMode="numeric"
                      value={form.deadheadMiles}
                      onChange={(event) =>
                        updateForm("deadheadMiles", event.target.value)
                      }
                    />

                    <p className="mt-1 text-xs text-muted-foreground">
                      Miles to pickup
                    </p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">
                      Linehaul rate <span className="text-rose-500">*</span>
                    </label>
                    <input
                      className={`mt-1 w-full rounded-lg border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none ${
                        isInvalid("rate") ? "border-rose-500" : "border-input"
                      }`}
                      placeholder="$0"
                      inputMode="decimal"
                      value={form.rate}
                      onChange={(event) =>
                        updateForm("rate", event.target.value)
                      }
                      onBlur={() => handleBlur("rate")}
                    />

                    {isInvalid("rate") && (
                      <p className="mt-1 text-xs text-rose-500">Required</p>
                    )}
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <TooltipProvider>
                    <div>
                      <div className="flex items-center justify-between">
                        <label
                          className="text-sm font-medium text-muted-foreground flex items-center gap-1.5"
                          htmlFor="fsc-input"
                        >
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
                        <Switch
                          checked={includeFsc}
                          onCheckedChange={setIncludeFsc}
                          aria-label={
                            includeFsc
                              ? "Exclude FSC from your revenue"
                              : "Include FSC in your revenue"
                          }
                        />
                      </div>
                      <input
                        id="fsc-input"
                        className={`mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none ${
                          includeFsc
                            ? ""
                            : "border-dashed text-muted-foreground"
                        }`}
                        placeholder="$0"
                        inputMode="decimal"
                        value={form.fsc}
                        onChange={(event) =>
                          updateForm("fsc", event.target.value)
                        }
                      />

                      <p className="mt-1 text-xs text-muted-foreground">
                        {includeFsc
                          ? "Included in your revenue calculations."
                          : "Excluded from your share (carrier keeps FSC)."}
                      </p>
                    </div>
                  </TooltipProvider>
                  <TooltipProvider>
                    <div>
                      <div className="flex items-center justify-between">
                        <label
                          className="text-sm font-medium text-muted-foreground flex items-center gap-1.5"
                          htmlFor="tolls-input"
                        >
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
                        <Switch
                          checked={includeTolls}
                          onCheckedChange={setIncludeTolls}
                          aria-label={
                            includeTolls
                              ? "Exclude tolls from your costs"
                              : "Include tolls in your costs"
                          }
                        />
                      </div>
                      <input
                        id="tolls-input"
                        className={`mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none ${
                          includeTolls
                            ? ""
                            : "border-dashed text-muted-foreground"
                        }`}
                        placeholder="$0"
                        inputMode="decimal"
                        value={form.tolls}
                        onChange={(event) =>
                          updateForm("tolls", event.target.value)
                        }
                      />

                      <p className="mt-1 text-xs text-muted-foreground">
                        {includeTolls
                          ? "Subtracted as part of your costs."
                          : "Covered by carrier (not subtracted)."}
                      </p>
                    </div>
                  </TooltipProvider>
                  <div>
                    <div className="flex items-center justify-between">
                      <label className="text-sm font-medium text-muted-foreground">
                        Fuel
                      </label>
                      <Switch
                        checked={includeFuel}
                        onCheckedChange={setIncludeFuel}
                        aria-label={
                          includeFuel
                            ? "Exclude fuel from your costs"
                            : "Include fuel in your costs"
                        }
                      />
                    </div>
                    <div
                      className={`mt-1 rounded-lg border border-input px-3 py-2 text-sm text-muted-foreground ${
                        includeFuel
                          ? "bg-muted/50"
                          : "border-dashed bg-muted/30"
                      }`}
                    >
                      {formatCurrency(displayedFuelCost)}
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {includeFuel
                        ? "Fuel is auto-calculated using your MPG and fuel price settings and subtracted from your costs."
                        : "Fuel is auto-calculated using your MPG and fuel price settings, but your carrier covers it, so $0.00 is taken out."}
                    </p>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    Notes
                  </label>
                  <textarea
                    className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none"
                    rows={3}
                    placeholder="Equipment, broker, must-knows"
                    value={form.notes}
                    onChange={(event) =>
                      updateForm("notes", event.target.value)
                    }
                  />
                </div>
              </div>
              <div className="space-y-4">
                <DriverProfileManager />
                <div
                  className="rounded-xl bg-primary/5 p-4"
                  data-onboarding="step-2"
                >
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-medium uppercase tracking-wide text-primary">
                      Instant result
                    </p>
                    <CostProfileEditor currentEquipment={form.equipment} />
                  </div>
                  <h3 className="mt-2 text-3xl font-semibold text-foreground">
                    {formatCurrency(profit)}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {useSplit
                      ? `Your share (${splitPercent}%) after all costs`
                      : "Net profit after all costs"}
                  </p>

                  <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                    <div className="rounded-lg border border-border bg-background p-3">
                      <p className="text-xs uppercase tracking-wide text-muted-foreground">
                        {useSplit
                          ? deadheadMiles > 0
                            ? "Your Share RPM (Loaded)"
                            : "Your Share RPM"
                          : "Gross RPM"}
                      </p>
                      <p className="mt-1 font-semibold">
                        {formatNumber(useSplit ? yourShareRpm : rpm)} /mi
                      </p>
                    </div>
                    <div className="rounded-lg border border-border bg-background p-3">
                      <p className="text-xs uppercase tracking-wide text-muted-foreground">
                        {deadheadMiles > 0
                          ? "Net RPM (True)"
                          : "Net RPM"}
                      </p>
                      <p className="mt-1 font-semibold">
                        {formatNumber(trueRpm)} /mi
                      </p>
                      {deadheadMiles > 0 && (
                        <p className="text-[10px] text-muted-foreground mt-0.5">
                          Loaded: {formatNumber(loadedRpm)} /mi
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="mt-4">
                    <ProfitBreakdown calculation={detailedCalculation} />
                  </div>
                </div>

                <SimilarLoadIndicator
                  currentLoad={
                    form.origin && form.destination && miles > 0
                      ? {
                          rpm: trueRpm,
                          origin: form.origin,
                          destination: form.destination,
                        }
                      : null
                  }
                />

                <DecisionCard
                  netRpm={decisionEconomics.effectiveRpm}
                  profit={decisionEconomics.net}
                  thresholds={costProfile}
                  offeredRate={rate}
                  deadheadMiles={deadheadMiles}
                  truckGross={gross}
                  driverPay={compensation.pay}
                  economicsLabel={decisionEconomics.basis === 'driver' ? 'Your effective pay / all-in mile' : 'True RPM'}
                  negotiation={negotiation.calculation ? {
                    ...negotiation.calculation,
                    negotiation: driverNegotiation.negotiable
                      ? { anchor: driverNegotiation.anchor, target: driverNegotiation.target, floor: driverNegotiation.floor }
                      : negotiation.calculation.negotiation,
                  } : null}
                  negotiationUnavailableReason={!driverNegotiation.negotiable ? driverNegotiation.reason : undefined}
                  compensationCounter={compensationCounter}
                  profileDecision={profileDecision}
                  onOpenNegotiation={
                    features.advancedNegotiation && canLog && driverNegotiation.negotiable
                      ? () => setNegotiationSheetOpen(true)
                      : undefined
                  }
                />

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
                            ? "bg-primary text-primary-foreground shadow"
                            : "border border-border text-muted-foreground hover:border-primary hover:text-primary"
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
                    title={
                      !canLog
                        ? "Complete required fields (origin, destination, miles, rate)"
                        : ""
                    }
                    className="mt-4 w-full rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:bg-muted disabled:text-muted-foreground"
                  >
                    {!canLog
                      ? "Complete required fields to log"
                      : "Log decision"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>

        <aside
          className="w-full space-y-6 lg:w-2/5 lg:max-w-none"
          data-onboarding="step-3"
        >
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
          onApplyOutcome={handleApplyNegotiationOutcome}
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
    </BrowserRouter>);

}
