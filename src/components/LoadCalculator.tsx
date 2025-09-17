import { useState, useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';

import { Label } from '@/components/ui/label';
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from '@/components/ui/form';
import { Calculator, Save, X, Camera, TrendingUp, Loader2 } from 'lucide-react';
import { Load, LoadCalculationResult, calculateLoadQuality, getWeightImpact, generateSmartTags, calculateProfit } from '@/types/load';
import { useSupabaseSettings } from '@/hooks/useSupabaseSettings';
import { LoadEntryMethod } from './LoadEntryMethod';
import { NegotiationSheet } from './NegotiationSheet';
import { NegotiationPanel } from '@/features/negotiation/NegotiationPanel';
import { NegotiationHelpCard } from './NegotiationHelpCard';
import type { Channel, Tone } from '@/features/negotiation/templates';
import { FieldDetectionResult } from '@/utils/SmartFieldDetector';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { computeCalc, suggestTemplates } from '../../packages/engine/src/index';
import { useEquipment } from '@/hooks/useEquipment';
import { useAuth } from '@/contexts/AuthContext';
import { getFeatureFlags } from '@/utils/featureFlags';
import { usePlan } from '@/hooks/usePlan';
import { useTierDetection } from '@/hooks/useTierDetection';
import { isPro, isFree, getTier } from '@/utils/tier';
import { UpgradeCard } from './UpgradeCard';
import { RateLimitExceededError } from '@/utils/apiWrapper';
import { UpgradeModal } from './UpgradeModal';
import { 
  validateLoadForm, 
  sanitizeText, 
  sanitizeLocation 
} from '@/utils/inputValidation';
import { useBusinessSetup } from '@/hooks/useBusinessSetup';
import { calculateNetTakeHome, isBusinessSetupSufficient, getSetupCompletenessWarnings } from '@/utils/businessSetupCalculations';
import { BusinessSetupWarning } from './BusinessSetupWarning';
import { BusinessCostBreakdown } from './BusinessCostBreakdown';

interface LoadCalculatorProps {
  onSaveLoad?: (load: Omit<Load, 'id' | 'createdAt'>) => void;
  initialData?: Load;
  ocrData?: Partial<Load>;
  onClose?: () => void;
  isPro?: boolean; // Add isPro prop to control upgrade card visibility
  onOpenBusinessSetup?: () => void; // Callback to open business setup
}

interface LoadFormValues {
  origin: string;
  destination: string;
  miles: string;
  rate: string;
  fsc: string;
  tolls: string;
  weight: string;
  deadheadMiles: string;
  fuelCost: string;
  notes: string;
}

export function LoadCalculator({ onSaveLoad, initialData, ocrData, onClose, isPro: propIsPro, onOpenBusinessSetup }: LoadCalculatorProps) {
  // Use prop isPro if provided, otherwise fall back to tier detection for backward compatibility
  const { isPro: isProTier, tier, loading: tierLoading } = useTierDetection();
  const { plan, isPro: isPlanPro, loading: planLoading } = usePlan(); // Keep for transition
  const { user } = useAuth();
  
  // Use prop first, then tier detection as fallback
  const isPro = propIsPro !== undefined ? propIsPro : isProTier;
  
  // Feature flags
  const SHOW_FULL_NEGOTIATION = true; // Full Negotiation Workspace enabled for Pro users
  
  const { advancedTemplates, ocrExtraction } = getFeatureFlags(user);
  
  // DEBUG: Enhanced tier detection logging
  console.log('🔍 TIER DEBUG - LoadCalculator unified:', {
    tier,
    isProTier,
    tierLoading,
    plan,
    isPlanPro,
    planLoading,
    userHasAuth: !!user,
    advancedTemplates,
    localStorage_tier: typeof window !== 'undefined' ? localStorage.getItem('lm_tier') : 'undefined',
    url_tier: typeof window !== 'undefined' ? new URLSearchParams(window.location.search).get('tier') : 'undefined'
  });

  const { settings, loading: settingsLoading } = useSupabaseSettings();
  const { setup: businessSetup, loading: businessSetupLoading } = useBusinessSetup();
  const { toast } = useToast();
  const [showLoadEntry, setShowLoadEntry] = useState(false);
  const [showNegotiationSheet, setShowNegotiationSheet] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  const form = useForm<LoadFormValues>({
    defaultValues: {
      origin: initialData?.origin || ocrData?.origin || '',
      destination: initialData?.destination || ocrData?.destination || '',
      miles: initialData?.miles?.toString() || ocrData?.miles?.toString() || '',
      rate: initialData?.rate?.toString() || ocrData?.rate?.toString() || '',
      fsc: initialData?.fsc?.toString() || ocrData?.fsc?.toString() || '',
      tolls: initialData?.tolls?.toString() || ocrData?.tolls?.toString() || '',
      weight: initialData?.weight?.toString() || ocrData?.weight?.toString() || '',
      deadheadMiles: initialData?.deadheadMiles?.toString() || ocrData?.deadheadMiles?.toString() || '',
      fuelCost: initialData?.fuelCost?.toString() || ocrData?.fuelCost?.toString() || '',
      notes: initialData?.notes || ocrData?.notes || '',
    },
    mode: 'onChange',
  });

  const {
    origin,
    destination,
    miles,
    rate,
    fsc,
    tolls,
    weight,
    deadheadMiles,
    fuelCost,
    notes,
  } = form.watch();

  const hasErrors = Object.keys(form.formState.errors).length > 0;
  const requiredFilled = origin && destination && miles && rate;

  const { equipment } = useEquipment();

  const [extras, setExtras] = useState({
    tarp: false,
    stops: 1,
    widthFt: '',
    heightFt: '',
    itemType: '',
    weekend: false,
    afterHours: false,
    inside: false,
    residential: false,
    liftgate: false,
    palletJack: false,
  });

  const [askRate, setAskRate] = useState(0);
  const [settleRate, setSettleRate] = useState(0);
  const [bottomRate, setBottomRate] = useState(0);
  const [channel, setChannel] = useState<Channel>('text');
  const [tone, setTone] = useState<Tone>('professional');
  const [scripts, setScripts] = useState({ ask: '', settle: '', bottom: '' });

  useEffect(() => {
    if (initialData?.negotiationChannel) {
      setChannel(initialData.negotiationChannel);
      setTone(initialData.negotiationTone || 'professional');
      setScripts(initialData.negotiationScripts || { ask: '', settle: '', bottom: '' });
    }
  }, [initialData]);

  const negotiation = useMemo(() => {
    if (!requiredFilled || hasErrors) return null;
    const fields = {
      distanceMi: parseFloat(miles) || 0,
      offerFlat: parseFloat(rate) || 0,
      weightLbs: weight ? parseFloat(weight) : undefined,
      equipment,
      tarp: extras.tarp || undefined,
      stops: extras.stops ? Number(extras.stops) : undefined,
      widthFt: extras.widthFt ? parseFloat(extras.widthFt) : undefined,
      heightFt: extras.heightFt ? parseFloat(extras.heightFt) : undefined,
      itemType: extras.itemType || undefined,
      weekend: extras.weekend || undefined,
      afterHours: extras.afterHours || undefined,
      inside: extras.inside || undefined,
      residential: extras.residential || undefined,
      liftgate: extras.liftgate || undefined,
      palletJack: extras.palletJack || undefined,
    } as const;
    const margins = { anchorPct: 0.18, targetPct: 0.1, floorPct: 0.0 } as const;
    const calc = computeCalc(fields as any, margins);
    const notes = advancedTemplates ? suggestTemplates(fields as any, calc, 3) : [];
    return { calc, notes };
  }, [requiredFilled, hasErrors, miles, rate, weight, equipment, extras, advancedTemplates]);

  useEffect(() => {
    if (negotiation) {
      setAskRate(negotiation.calc.negotiation.anchor);
      setSettleRate(negotiation.calc.negotiation.target);
      setBottomRate(negotiation.calc.negotiation.floor);
    }
  }, [negotiation]);

  const [showSkeleton, setShowSkeleton] = useState(true);
  const [contentVisible, setContentVisible] = useState(false);

  useEffect(() => {
    if (!settingsLoading && !businessSetupLoading) {
      const timer = setTimeout(() => setShowSkeleton(false), 300);
      setContentVisible(true);
      return () => clearTimeout(timer);
    } else {
      setShowSkeleton(true);
      setContentVisible(false);
    }
  }, [settingsLoading, businessSetupLoading]);

  const calculateLoad = (): LoadCalculationResult => {
    const milesNum = parseFloat(miles) || 0;
    const rateNum = parseFloat(rate) || 0;
    const fscNum = parseFloat(fsc) || 0;
    const tollsNum = parseFloat(tolls) || 0;
    const deadheadNum = parseFloat(deadheadMiles) || 0;
    const fuelCostNum = settings.enableFuelCostTracking ? (parseFloat(fuelCost) || 0) : 0;
    const weightNum = parseFloat(weight) || 0;

    // Use comprehensive business setup calculation if available
    if (businessSetup && isBusinessSetupSufficient(businessSetup)) {
      const enhancedCalc = calculateNetTakeHome(
        milesNum,
        rateNum,
        fscNum,
        tollsNum,
        deadheadNum,
        fuelCostNum,
        businessSetup,
        settings
      );
      
      const quality = calculateLoadQuality(enhancedCalc.rpm, settings);
      const weightImpact = getWeightImpact(weightNum, settings);
      
      const loadData = {
        origin,
        destination,
        miles: milesNum,
        rate: rateNum,
        fsc: fscNum,
        tolls: tollsNum,
        weight: weightNum,
        deadheadMiles: deadheadNum,
        fuelCost: fuelCostNum,
        rpm: enhancedCalc.rpm,
        profit: enhancedCalc.profit
      };
      
      const tags = generateSmartTags(loadData, settings);

      return {
        rpm: enhancedCalc.rpm,
        profit: enhancedCalc.profit,
        totalMiles: enhancedCalc.totalMiles,
        netRate: enhancedCalc.netRate,
        quality,
        weightImpact,
        tags,
        // Enhanced RPM breakdown
        grossRpm: enhancedCalc.grossRpm,
        netRpm: enhancedCalc.netRpm,
        revenueSplit: businessSetup.revenue_split_percentage || 100,
        weeklyCosts: enhancedCalc.businessCostBreakdown.weeklyFixedCosts,
        weeklyFixedCostPerMile: enhancedCalc.businessCostBreakdown.weeklyFixedCostPerMile,
        // Business setup specific data
        businessCostBreakdown: enhancedCalc.businessCostBreakdown,
        isBusinessSetupUsed: enhancedCalc.isBusinessSetupUsed,
        missingSetupWarnings: enhancedCalc.missingSetupWarnings
      };
    }

    // Fallback to legacy calculation if business setup not available
    const totalMiles = milesNum + deadheadNum;
    const grossRevenue = rateNum + fscNum;
    
    // Calculate business costs impact
    const revenueSplit = settings?.revenueSplitPercentage || 100;
    const weeklyCosts = settings?.weeklyFixedCosts || 0;
    const estimatedWeeklyMiles = 2500; // Industry standard
    const weeklyFixedCostPerMile = weeklyCosts / estimatedWeeklyMiles;
    
    // Gross RPM (before business costs)
    const grossRpm = totalMiles > 0 ? grossRevenue / totalMiles : 0;
    
    // Net revenue after split and costs
    const afterSplitRevenue = grossRevenue * (revenueSplit / 100);
    const netRevenue = afterSplitRevenue - (weeklyFixedCostPerMile * totalMiles);
    const profit = netRevenue - tollsNum - fuelCostNum; // Net profit after business costs
    const netRate = profit;
    
    // Net Take-Home RPM (after business costs)
    const netRpm = totalMiles > 0 ? (netRevenue - tollsNum - fuelCostNum) / totalMiles : 0;
    
    const rpm = netRpm; // Use net RPM for quality calculation
    const quality = calculateLoadQuality(rpm, settings);
    const weightImpact = getWeightImpact(weightNum, settings);
    
    const loadData = {
      origin,
      destination,
      miles: milesNum,
      rate: rateNum,
      fsc: fscNum,
      tolls: tollsNum,
      weight: weightNum,
      deadheadMiles: deadheadNum,
      fuelCost: fuelCostNum,
      rpm,
      profit
    };
    
    const tags = generateSmartTags(loadData, settings);

    return {
      rpm,
      profit,
      totalMiles,
      netRate,
      quality,
      weightImpact,
      tags,
      // Enhanced RPM breakdown
      grossRpm,
      netRpm,
      revenueSplit,
      weeklyCosts,
      weeklyFixedCostPerMile
    };
  };

  const getQualityColor = (quality: Load['quality']) => {
    switch (quality) {
      case 'excellent':
        return 'default';
      case 'good':
        return 'default';
      case 'fair':
        return 'secondary';
      case 'poor':
        return 'destructive';
    }
  };

  const getWeightColor = (impact: LoadCalculationResult['weightImpact']) => {
    switch (impact) {
      case 'light':
        return 'default';
      case 'medium':
        return 'secondary';
      case 'heavy':
        return 'secondary';
      case 'overweight':
        return 'destructive';
    }
  };

  const onSubmit = async (values: LoadFormValues) => {
    const calculation = calculateLoad();

    const loadData: Omit<Load, 'id' | 'createdAt'> = {
      origin: values.origin,
      destination: values.destination,
      miles: parseFloat(values.miles),
      rate: parseFloat(values.rate),
      fsc: values.fsc ? parseFloat(values.fsc) : undefined,
      tolls: values.tolls ? parseFloat(values.tolls) : undefined,
      weight: values.weight ? parseFloat(values.weight) : undefined,
      widthFt: extras.widthFt ? parseFloat(extras.widthFt) : undefined,
      heightFt: extras.heightFt ? parseFloat(extras.heightFt) : undefined,
      stops: extras.stops ? extras.stops : undefined,
      equipment,
      
      accessorials: {
        tarp: extras.tarp || undefined,
        weekend: extras.weekend || undefined,
        afterHours: extras.afterHours || undefined,
        inside: extras.inside || undefined,
        residential: extras.residential || undefined,
        liftgate: extras.liftgate || undefined,
        palletJack: extras.palletJack || undefined,
        itemType: extras.itemType || undefined,
      },
      deadheadMiles: values.deadheadMiles ? parseFloat(values.deadheadMiles) : undefined,
      fuelCost: settings.enableFuelCostTracking
        ? values.fuelCost
          ? parseFloat(values.fuelCost)
          : undefined
        : undefined,
      rpm: calculation.rpm,
      profit: calculation.profit,
      quality: calculation.quality,
      tags: calculation.tags,
      notes: values.notes || '',
      negotiationChannel: channel,
      negotiationTone: tone,
      negotiationScripts: scripts,
    };

    if (onSaveLoad) {
      setSaving(true);
      try {
        await onSaveLoad(loadData);
      } finally {
        setSaving(false);
      }
    }
  };

  const handleFieldsDetected = (result: FieldDetectionResult) => {
    console.log('🔍 OCR DEBUG - handleFieldsDetected called with:', result);

    // Auto-fill form fields based on AI detection
    result.detectedFields.forEach((field) => {
      console.log(`🔍 OCR DEBUG - Processing field: ${field.field}, original value: "${field.value}"`);
      
      // Enhanced value processing for numeric fields
      let processedValue = field.value;
      
      // For numeric fields, clean and validate the value
      if (['miles', 'rate', 'deadhead', 'weight', 'fsc', 'tolls', 'fuelCost'].includes(field.field)) {
        // Remove currency symbols, commas, and whitespace
        processedValue = field.value.replace(/[$,\s]/g, '');
        console.log(`🔍 OCR DEBUG - Cleaned numeric value: "${processedValue}"`);
        
        // Validate it's a valid number
        const numValue = parseFloat(processedValue);
        if (isNaN(numValue)) {
          console.warn(`⚠️ OCR DEBUG - Invalid numeric value for ${field.field}: "${processedValue}"`);
          return; // Skip this field if it's not a valid number
        }
        
        // Convert back to string for form
        processedValue = numValue.toString();
        console.log(`🔍 OCR DEBUG - Final processed value: "${processedValue}"`);
      }

      // Set form values with enhanced debugging
      switch (field.field) {
        case 'miles':
          console.log(`🔍 OCR DEBUG - Setting miles to: "${processedValue}"`);
          form.setValue('miles', processedValue, { shouldValidate: true });
          console.log(`🔍 OCR DEBUG - Miles value after setValue:`, form.getValues('miles'));
          break;
        case 'rate':
          console.log(`🔍 OCR DEBUG - Setting rate to: "${processedValue}"`);
          form.setValue('rate', processedValue, { shouldValidate: true });
          console.log(`🔍 OCR DEBUG - Rate value after setValue:`, form.getValues('rate'));
          break;
        case 'origin':
          console.log(`🔍 OCR DEBUG - Setting origin to: "${field.value}"`);
          form.setValue('origin', field.value, { shouldValidate: true });
          break;
        case 'destination':
          console.log(`🔍 OCR DEBUG - Setting destination to: "${field.value}"`);
          form.setValue('destination', field.value, { shouldValidate: true });
          break;
        case 'deadhead':
          console.log(`🔍 OCR DEBUG - Setting deadheadMiles to: "${processedValue}"`);
          form.setValue('deadheadMiles', processedValue, { shouldValidate: true });
          break;
        case 'weight':
          console.log(`🔍 OCR DEBUG - Setting weight to: "${processedValue}"`);
          form.setValue('weight', processedValue, { shouldValidate: true });
          break;
        case 'fsc':
          console.log(`🔍 OCR DEBUG - Setting fsc to: "${processedValue}"`);
          form.setValue('fsc', processedValue, { shouldValidate: true });
          break;
        case 'tolls':
          console.log(`🔍 OCR DEBUG - Setting tolls to: "${processedValue}"`);
          form.setValue('tolls', processedValue, { shouldValidate: true });
          break;
        case 'fuelCost':
          if (settings.enableFuelCostTracking) {
            console.log(`🔍 OCR DEBUG - Setting fuelCost to: "${processedValue}"`);
            form.setValue('fuelCost', processedValue, { shouldValidate: true });
          }
          break;
      }
    });

    // Debug: Log all form values after processing
    console.log('🔍 OCR DEBUG - All form values after processing:', form.getValues());

    setShowLoadEntry(false);

    toast({
      title: 'Fields auto-filled!',
      description: `${result.detectedFields.length} fields detected and filled automatically.`,
    });
  };

  const calculation = calculateLoad();
  
  // Debug business setup integration
  console.log('💰 Business Setup Integration:', {
    hasBusinessSetup: !!businessSetup,
    isBusinessSetupSufficient: isBusinessSetupSufficient(businessSetup),
    isBusinessSetupUsed: calculation.isBusinessSetupUsed,
    missingWarnings: calculation.missingSetupWarnings,
    businessCostBreakdown: calculation.businessCostBreakdown
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {showLoadEntry && (
          <LoadEntryMethod
            onFieldsDetected={handleFieldsDetected}
            onManualEntry={() => setShowLoadEntry(false)}
            onClose={() => setShowLoadEntry(false)}
            isPro={isPro} // Pass isPro prop
          />
        )}

        {showSkeleton && (settingsLoading || businessSetupLoading) && (
          <Card
            className={cn(
              "p-6 transition-opacity duration-500",
              (settingsLoading || businessSetupLoading) ? "opacity-100" : "opacity-0"
            )}
          >
            <div className="space-y-4">
              <Skeleton className="h-6 w-1/3" />
              {[...Array(6)].map((_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          </Card>
        )}

        {!settingsLoading && !businessSetupLoading && (
          <div
            className={cn(
              "space-y-6 transition-opacity duration-500",
              contentVisible ? "opacity-100" : "opacity-0"
            )}
          >
          <Card className="gradient-card border-0">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center justify-between text-foreground">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-primary/20">
                  <Calculator className="h-5 w-5 text-primary" />
                </div>
                Load Calculator
              </div>
              <Button
                onClick={() => setShowLoadEntry(!showLoadEntry)}
                variant="ghost"
                size="sm"
              >
                <Camera className="h-4 w-4" />
              </Button>
            </CardTitle>
          </CardHeader>

          <CardContent className="space-y-4">
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <FormField
                    control={form.control}
                    name="origin"
                    rules={{
                      required: 'Origin is required',
                    }}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Origin</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter location" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="destination"
                    rules={{
                      required: 'Destination is required',
                    }}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Destination</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter location" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <FormField
                    control={form.control}
                    name="miles"
                    rules={{
                      required: 'Miles are required',
                      validate: (value) => {
                        const num = parseFloat(value);
                        if (num <= 0) {
                          return 'Miles must be greater than 0';
                        }
                        if (num > 3000) {
                          return 'Miles cannot exceed 3000';
                        }
                        return true;
                      },
                    }}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Loaded Miles</FormLabel>
                        <FormControl>
                          <Input type="number" min={0} max={3000} placeholder="0" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="deadheadMiles"
                    rules={{
                      validate: (value) => {
                        if (value === '') return true;
                        const num = parseFloat(value);
                        if (num < 0) {
                          return 'Deadhead miles cannot be negative';
                        }
                        if (num > 3000) {
                          return 'Deadhead miles cannot exceed 3000';
                        }
                        return true;
                      },
                    }}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Deadhead Miles</FormLabel>
                        <FormControl>
                          <Input type="number" min={0} max={3000} placeholder="0" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <FormField
                    control={form.control}
                    name="rate"
                    rules={{
                      required: 'Rate is required',
                      validate: (value) => {
                        const num = parseFloat(value);
                        if (num <= 0) {
                          return 'Rate must be greater than 0';
                        }
                        if (num > 10000) {
                          return 'Rate cannot exceed 10000';
                        }
                        return true;
                      },
                    }}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Rate ($)</FormLabel>
                        <FormControl>
                           <Input
                            type="number"
                            step="0.01"
                            min={0}
                            placeholder="0"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="fsc"
                    rules={{
                      validate: (value) => {
                        if (value === '') return true;
                        const num = parseFloat(value);
                        if (num < 0) {
                          return 'FSC cannot be negative';
                        }
                        if (num > 10000) {
                          return 'FSC cannot exceed 10000';
                        }
                        return true;
                      },
                    }}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>FSC ($)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="0.01"
                            min={0}
                            max={10000}
                            placeholder="0"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <FormField
                    control={form.control}
                    name="tolls"
                    rules={{
                      validate: (value) => {
                        if (value === '') return true;
                        const num = parseFloat(value);
                        if (num < 0) {
                          return 'Tolls cannot be negative';
                        }
                        if (num > 10000) {
                          return 'Tolls cannot exceed 10000';
                        }
                        return true;
                      },
                    }}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tolls ($)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="0.01"
                            min={0}
                            max={10000}
                            placeholder="0"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {equipment === 'hotshot' && (
                  <div className="space-y-3">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="tarp"
                        checked={extras.tarp}
                        onCheckedChange={(c) =>
                          setExtras((f) => ({ ...f, tarp: c === true }))
                        }
                      />
                      <Label htmlFor="tarp">Tarp</Label>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label htmlFor="stops">Stops</Label>
                        <Input
                          id="stops"
                          type="number"
                          min={1}
                          value={extras.stops}
                          onChange={(e) =>
                            setExtras((f) => ({ ...f, stops: Number(e.target.value) }))
                          }
                        />
                      </div>
                      <FormField
                        control={form.control}
                        name="weight"
                        rules={{
                          validate: (value) => {
                            if (value === '') return true;
                            const num = parseFloat(value);
                            if (num < 0) {
                              return 'Weight cannot be negative';
                            }
                            if (num > 100000) {
                              return 'Weight cannot exceed 100000';
                            }
                            return true;
                          },
                        }}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Weight (lbs)</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                min={0}
                                max={100000}
                                placeholder="0"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <div>
                        <Label htmlFor="widthFt">Width (ft)</Label>
                        <Input
                          id="widthFt"
                          type="number"
                          value={extras.widthFt}
                          onChange={(e) =>
                            setExtras((f) => ({ ...f, widthFt: e.target.value }))
                          }
                        />
                      </div>
                      <div>
                        <Label htmlFor="heightFt">Height (ft)</Label>
                        <Input
                          id="heightFt"
                          type="number"
                          value={extras.heightFt}
                          onChange={(e) =>
                            setExtras((f) => ({ ...f, heightFt: e.target.value }))
                          }
                        />
                      </div>
                      <div className="col-span-2">
                        <Label htmlFor="itemType">Item Type</Label>
                        <Input
                          id="itemType"
                          value={extras.itemType}
                          onChange={(e) =>
                            setExtras((f) => ({ ...f, itemType: e.target.value }))
                          }
                        />
                      </div>
                    </div>
                  </div>
                )}

                {equipment === 'cargo_van' && (
                  <div className="space-y-3">
                     <div className="grid grid-cols-2 gap-3">
                       <div className="flex items-center justify-between">
                         <Label htmlFor="weekend">Weekend</Label>
                         <Checkbox
                           id="weekend"
                           checked={extras.weekend}
                           onCheckedChange={(c) =>
                             setExtras((f) => ({ ...f, weekend: !!c }))
                           }
                         />
                       </div>
                       <div className="flex items-center justify-between">
                         <Label htmlFor="afterHours">After Hours</Label>
                         <Checkbox
                           id="afterHours"
                           checked={extras.afterHours}
                           onCheckedChange={(c) =>
                             setExtras((f) => ({ ...f, afterHours: !!c }))
                           }
                         />
                       </div>
                       <div className="flex items-center justify-between">
                         <Label htmlFor="inside">Inside</Label>
                         <Checkbox
                           id="inside"
                           checked={extras.inside}
                           onCheckedChange={(c) =>
                             setExtras((f) => ({ ...f, inside: !!c }))
                           }
                         />
                       </div>
                       <div className="flex items-center justify-between">
                         <Label htmlFor="residential">Residential</Label>
                         <Checkbox
                           id="residential"
                           checked={extras.residential}
                           onCheckedChange={(c) =>
                             setExtras((f) => ({ ...f, residential: !!c }))
                           }
                         />
                       </div>
                     </div>
                    <div>
                      <Label htmlFor="stopsVan">Stops</Label>
                      <Input
                        id="stopsVan"
                        type="number"
                        min={1}
                        value={extras.stops}
                        onChange={(e) =>
                          setExtras((f) => ({ ...f, stops: Number(e.target.value) }))
                        }
                      />
                    </div>
                  </div>
                )}

                {equipment === 'straight_truck' && (
                  <div className="space-y-3">
                     <div className="grid grid-cols-2 gap-3">
                       <div className="flex items-center justify-between">
                         <Label htmlFor="liftgate">Liftgate</Label>
                         <Checkbox
                           id="liftgate"
                           checked={extras.liftgate}
                           onCheckedChange={(c) =>
                             setExtras((f) => ({ ...f, liftgate: !!c }))
                           }
                         />
                       </div>
                       <div className="flex items-center justify-between">
                         <Label htmlFor="insideSt">Inside</Label>
                         <Checkbox
                           id="insideSt"
                           checked={extras.inside}
                           onCheckedChange={(c) =>
                             setExtras((f) => ({ ...f, inside: !!c }))
                           }
                         />
                       </div>
                       <div className="flex items-center justify-between">
                         <Label htmlFor="residentialSt">Residential</Label>
                         <Checkbox
                           id="residentialSt"
                           checked={extras.residential}
                           onCheckedChange={(c) =>
                             setExtras((f) => ({ ...f, residential: !!c }))
                           }
                         />
                       </div>
                       <div className="flex items-center justify-between">
                         <Label htmlFor="palletJack">Pallet Jack</Label>
                         <Checkbox
                           id="palletJack"
                           checked={extras.palletJack}
                           onCheckedChange={(c) =>
                             setExtras((f) => ({ ...f, palletJack: !!c }))
                           }
                         />
                       </div>
                     </div>
                    <div>
                      <Label htmlFor="stopsSt">Stops</Label>
                      <Input
                        id="stopsSt"
                        type="number"
                        min={1}
                        value={extras.stops}
                        onChange={(e) =>
                          setExtras((f) => ({ ...f, stops: Number(e.target.value) }))
                        }
                      />
                    </div>
                  </div>
                )}

                {settings.enableFuelCostTracking && (
                  <FormField
                    control={form.control}
                    name="fuelCost"
                    rules={{
                      validate: (value) => {
                        if (value === '') return true;
                        const num = parseFloat(value);
                        if (num < 0) {
                          return 'Fuel cost cannot be negative';
                        }
                        if (num > 10000) {
                          return 'Fuel cost cannot exceed 10000';
                        }
                        return true;
                      },
                    }}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Fuel Cost ($)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="0.01"
                            min={0}
                            max={10000}
                            placeholder="0"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

                <FormField
                  control={form.control}
                  name="notes"
                  rules={{
                    maxLength: {
                      value: 500,
                      message: 'Notes must be at most 500 characters',
                    },
                  }}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Notes</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Additional notes about this load..."
                          rows={2}
                          {...field}
                          onPaste={(e) => {
                            // Handle URL-encoded text from clipboard
                            const clipboardData = e.clipboardData?.getData('text/plain') || '';
                            if (clipboardData.includes('%20') || clipboardData.includes('%24') || clipboardData.includes('say:')) {
                              e.preventDefault();
                              try {
                                const decodedText = decodeURIComponent(clipboardData);
                                const currentValue = field.value || '';
                                const newValue = currentValue + (currentValue ? '\n' : '') + decodedText;
                                field.onChange(newValue);
                              } catch {
                                // If decoding fails, use original text
                                const currentValue = field.value || '';
                                const newValue = currentValue + (currentValue ? '\n' : '') + clipboardData;
                                field.onChange(newValue);
                              }
                            }
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Business Setup Warning */}
              <BusinessSetupWarning 
                businessSetup={businessSetup}
                onOpenSetup={() => {
                  if (onOpenBusinessSetup) {
                    onOpenBusinessSetup();
                  } else {
                    toast({
                      title: "Complete Business Setup",
                      description: "Go to Settings > Business Setup to configure your financial arrangements for accurate calculations."
                    });
                  }
                }}
                className="mb-4"
              />

            <div className="bg-muted/50 rounded-lg p-4 space-y-4">
              {/* Enhanced RPM Breakdown */}
              {isPro && calculation.grossRpm && calculation.netRpm ? (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-4">
                    {/* Gross RPM */}
                    <div className="space-y-1">
                      <div className="text-sm text-muted-foreground">Gross RPM</div>
                      <div className="flex items-center gap-2">
                        <div className="text-xl font-bold">${calculation.grossRpm.toFixed(2)}</div>
                        {negotiation && (
                          <span
                            className={cn('h-2 w-2 rounded-full', {
                              'bg-green-500': negotiation.calc.resultColor === 'green',
                              'bg-yellow-500': negotiation.calc.resultColor === 'yellow',
                              'bg-red-500': negotiation.calc.resultColor === 'red',
                            })}
                          />
                        )}
                      </div>
                      <div className="text-xs text-muted-foreground">Before business costs</div>
                    </div>
                    
                    {/* Net Take-Home RPM */}
                    <div className="space-y-1">
                      <div className="text-sm text-muted-foreground">Net Take-Home RPM</div>
                      <div className="text-2xl font-bold text-success">${calculation.netRpm.toFixed(2)}</div>
                      <Badge variant={getQualityColor(calculation.quality)} className="text-xs">
                        {calculation.quality}
                      </Badge>
                    </div>
                  </div>

                  {/* Estimated Profit - Primary Metric */}
                  <div className="flex items-center justify-between">
                    <span className="font-medium">Estimated Profit</span>
                    <div className="text-right">
                      <div className="text-xl font-bold text-success">${calculation.profit.toFixed(2)}</div>
                    </div>
                  </div>
                  
                  {/* Divider between primary and secondary metrics */}
                  <div className="border-t border-border/30 my-4"></div>
                  
                  {/* Business Impact Details */}
                  {(calculation.revenueSplit !== 100 || calculation.weeklyCosts > 0) && (
                    <div className="pt-2 border-t border-border/50">
                      <div className="text-xs text-muted-foreground space-y-1">
                        <div className="flex justify-between">
                          <span>Revenue Split:</span>
                          <span>{calculation.revenueSplit}%</span>
                        </div>
                        {calculation.weeklyCosts > 0 && (
                          <div className="flex justify-between">
                            <span>Fixed Costs:</span>
                            <span>${calculation.weeklyFixedCostPerMile?.toFixed(3)}/mi</span>
                          </div>
                        )}
                        <div className="flex justify-between font-medium text-primary">
                          <span>Impact:</span>
                          <span>-${(calculation.grossRpm - calculation.netRpm).toFixed(2)}/mi</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                /* Fallback for non-PRO or missing data */
                <div className="flex items-center justify-between">
                  <span className="font-medium">Revenue Per Mile</span>
                  <div className="text-right">
                    <div className="text-2xl font-bold">${calculation.rpm.toFixed(2)}</div>
                    <Badge variant={getQualityColor(calculation.quality)} className="text-xs">
                      {calculation.quality}
                    </Badge>
                  </div>
                </div>
              )}


              <div className="grid grid-cols-3 gap-4 text-sm">
                <div>
                  <div className="text-muted-foreground">Total Miles</div>
                  <div className="font-medium">{calculation.totalMiles}</div>
                </div>
                <div>
                  <div className="text-muted-foreground">Net Rate</div>
                  <div className="font-medium">${calculation.netRate.toFixed(2)}</div>
                </div>
                <div>
                  <div className="text-muted-foreground">Weight Impact</div>
                  <Badge variant={getWeightColor(calculation.weightImpact)} className="text-xs">
                    {calculation.weightImpact}
                  </Badge>
                </div>
              </div>

                {calculation.tags.length > 0 && (
                  <div className="space-y-2">
                    <div className="text-sm text-muted-foreground">Smart Tags</div>
                    <div className="flex flex-wrap gap-1">
                      {calculation.tags.map((tag, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {!isPro && !tierLoading && (
                  <div className="space-y-4">
                    <div className="pt-4 border-t border-border/50">
                      <UpgradeCard className="animate-in fade-in-50 duration-300" />
                    </div>
                    <NegotiationHelpCard className="animate-in fade-in-50 duration-300 delay-100" />
                  </div>
                )}

                {negotiation && (
                  <div className="space-y-3 pt-3 border-t">
                    <div className="grid grid-cols-3 gap-2 text-sm">
                      <div className="text-center p-2 bg-muted/30 rounded">
                        <div className="font-medium text-green-600">Ask</div>
                        <Input
                          type="number"
                          value={askRate}
                          onChange={(e) => setAskRate(Number(e.target.value))}
                        />
                      </div>
                      <div className="text-center p-2 bg-muted/30 rounded">
                        <div className="font-medium text-yellow-600">Settle</div>
                        <Input
                          type="number"
                          value={settleRate}
                          onChange={(e) => setSettleRate(Number(e.target.value))}
                        />
                      </div>
                      <div className="text-center p-2 bg-muted/30 rounded">
                        <div className="font-medium text-red-600">Bottom</div>
                        <Input
                          type="number"
                          value={bottomRate}
                          onChange={(e) => setBottomRate(Number(e.target.value))}
                        />
                      </div>
                    </div>

                    {(() => {
                      // Use prop-based tier detection for Quick Scripts
                      const shouldShowNegotiation = isPro;
                      console.log('🔍 QUICK SCRIPTS DEBUG:', {
                        shouldShowNegotiation,
                        isPro,
                        tier,
                        tierLoading,
                        timestamp: new Date().toISOString()
                      });
                      
                      if (shouldShowNegotiation) {
                        console.log('✅ Rendering Quick Scripts for PRO user');
                        return (
                          <div className="space-y-3">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <div className="text-sm font-medium">Quick Scripts</div>
                                <Badge variant="secondary" className="text-xs px-2 py-0.5">
                                  PRO
                                </Badge>
                              </div>
                            </div>
                             <NegotiationPanel
                               askRate={askRate}
                               settleRate={settleRate}
                               bottomRate={bottomRate}
                               miles={parseFloat(miles) || 0}
                               weightLbs={weight ? parseFloat(weight) : undefined}
                               offerTotal={
                                 (parseFloat(rate) || 0) +
                                 (parseFloat(fsc) || 0) +
                                 (parseFloat(tolls) || 0)
                               }
                               rpm={calculation.rpm}
                               pickupCity={origin}
                               deliveryCity={destination}
                               equipmentType={equipment}
                               flags={{
                                 isRush: extras.afterHours || extras.weekend || undefined,
                                 tarpRequired: extras.tarp || undefined,
                                 extraStops:
                                   extras.stops && extras.stops > 1
                                     ? extras.stops - 1
                                     : undefined,
                                 fuelSurchargeMentioned: !!fsc,
                                 palletJack: extras.palletJack || undefined,
                                 liftGate: extras.liftgate || undefined,
                               }}
                               initialChannel={channel}
                               initialTone={tone}
                               initialScripts={scripts}
                               onChannelChange={setChannel}
                               onToneChange={setTone}
                               onScriptChange={setScripts}
                             />
                          </div>
                        );
                      }
                      
                      // LITE users see nothing - completely hidden
                      console.log('❌ Quick Scripts hidden for LITE users');
                      return null;
                    })()}

                  </div>
                )}
              </div>

              <div className="flex gap-3">
                {onClose && (
                  <Button type="button" variant="outline" onClick={onClose} className="flex-1">
                    <X className="mr-2 h-4 w-4" />
                    Cancel
                  </Button>
                )}

                {/* Full Negotiation Workspace - Available to all users */}
                {SHOW_FULL_NEGOTIATION && !tierLoading && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowNegotiationSheet(true)}
                    disabled={!requiredFilled || hasErrors}
                    className="flex-1"
                    title="Open full negotiation workspace with advanced templates, outcome tracking, and detailed load analysis"
                  >
                    <TrendingUp className="h-4 w-4 mr-2" />
                    Negotiate
                  </Button>
                )}

                <Button
                  type="submit"
                  disabled={saving || !requiredFilled || hasErrors}
                  className="flex-1"
                >
                  {saving ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="mr-2 h-4 w-4" />
                  )}
                  {saving ? 'Saving...' : 'Save Load'}
                </Button>
              </div>
            </CardContent>
            </Card>
          </div>
        )}
        </form>
        <NegotiationSheet
          open={showNegotiationSheet}
          onClose={() => setShowNegotiationSheet(false)}
          isPro={isPro} // Pass isPro prop
          load={{
            origin,
            destination,
          miles: parseFloat(miles) || 0,
          rate: parseFloat(rate) || 0,
          fsc: parseFloat(fsc) || 0,
          tolls: parseFloat(tolls) || 0,
          weight: parseFloat(weight) || 0,
          deadheadMiles: parseFloat(deadheadMiles) || 0,
          notes,
        }}
      />
      <UpgradeModal 
        isOpen={showUpgradeModal} 
        onClose={() => setShowUpgradeModal(false)} 
      />
      </Form>
    );
  }