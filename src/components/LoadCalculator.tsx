import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
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
import { FieldDetectionResult } from '@/utils/SmartFieldDetector';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

interface LoadCalculatorProps {
  onSaveLoad?: (load: Omit<Load, 'id' | 'createdAt'>) => void;
  initialData?: Load;
  onClose?: () => void;
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

export function LoadCalculator({ onSaveLoad, initialData, onClose }: LoadCalculatorProps) {
  const { settings, loading: settingsLoading } = useSupabaseSettings();
  const { toast } = useToast();
  const [showLoadEntry, setShowLoadEntry] = useState(false);
  const [showNegotiationSheet, setShowNegotiationSheet] = useState(false);
  const [saving, setSaving] = useState(false);

  const form = useForm<LoadFormValues>({
    defaultValues: {
      origin: initialData?.origin || '',
      destination: initialData?.destination || '',
      miles: initialData?.miles?.toString() || '',
      rate: initialData?.rate?.toString() || '',
      fsc: initialData?.fsc?.toString() || '',
      tolls: initialData?.tolls?.toString() || '',
      weight: initialData?.weight?.toString() || '',
      deadheadMiles: initialData?.deadheadMiles?.toString() || '',
      fuelCost: initialData?.fuelCost?.toString() || '',
      notes: initialData?.notes || '',
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

  const [showSkeleton, setShowSkeleton] = useState(true);
  const [contentVisible, setContentVisible] = useState(false);

  useEffect(() => {
    if (!settingsLoading) {
      const timer = setTimeout(() => setShowSkeleton(false), 300);
      setContentVisible(true);
      return () => clearTimeout(timer);
    } else {
      setShowSkeleton(true);
      setContentVisible(false);
    }
  }, [settingsLoading]);

  const calculateLoad = (): LoadCalculationResult => {
    const milesNum = parseFloat(miles) || 0;
    const rateNum = parseFloat(rate) || 0;
    const fscNum = parseFloat(fsc) || 0;
    const tollsNum = parseFloat(tolls) || 0;
    const deadheadNum = parseFloat(deadheadMiles) || 0;
    const fuelCostNum = settings.enableFuelCostTracking ? (parseFloat(fuelCost) || 0) : 0;
    const weightNum = parseFloat(weight) || 0;

    const totalMiles = milesNum + deadheadNum;
    const profit = calculateProfit(rateNum, fscNum, tollsNum, fuelCostNum);
    const netRate = profit;
    const rpm = totalMiles > 0 ? netRate / totalMiles : 0;
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
      tags
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
      notes: values.notes,
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
    // Auto-fill form fields based on AI detection
    result.detectedFields.forEach((field) => {
      const value = field.value.replace(/[$,]/g, '');

      switch (field.field) {
        case 'miles':
          form.setValue('miles', value, { shouldValidate: true });
          break;
        case 'rate':
          form.setValue('rate', value, { shouldValidate: true });
          break;
        case 'origin':
          form.setValue('origin', field.value, { shouldValidate: true });
          break;
        case 'destination':
          form.setValue('destination', field.value, { shouldValidate: true });
          break;
        case 'deadhead':
          form.setValue('deadheadMiles', value, { shouldValidate: true });
          break;
        case 'weight':
          form.setValue('weight', value, { shouldValidate: true });
          break;
        case 'fsc':
          form.setValue('fsc', value, { shouldValidate: true });
          break;
        case 'tolls':
          form.setValue('tolls', value, { shouldValidate: true });
          break;
        case 'fuelCost':
          if (settings.enableFuelCostTracking) {
            form.setValue('fuelCost', value, { shouldValidate: true });
          }
          break;
      }
    });

    setShowLoadEntry(false);

    toast({
      title: 'Fields auto-filled!',
      description: `${result.detectedFields.length} fields detected and filled automatically.`,
    });
  };

  const calculation = calculateLoad();

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {showLoadEntry && (
          <LoadEntryMethod
            onFieldsDetected={handleFieldsDetected}
            onManualEntry={() => setShowLoadEntry(false)}
            onClose={() => setShowLoadEntry(false)}
          />
        )}

        {showSkeleton && (
          <Card
            className={cn(
              "p-6 transition-opacity duration-500",
              settingsLoading ? "opacity-100" : "opacity-0"
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
                      pattern: {
                        value: /^[^,]+,\s*[A-Z]{2}$/,
                        message: 'Format: City, ST',
                      },
                    }}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Origin</FormLabel>
                        <FormControl>
                          <Input placeholder="City, ST" {...field} />
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
                      pattern: {
                        value: /^[^,]+,\s*[A-Z]{2}$/,
                        message: 'Format: City, ST',
                      },
                    }}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Destination</FormLabel>
                        <FormControl>
                          <Input placeholder="City, ST" {...field} />
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
                      validate: (value) =>
                        parseFloat(value) > 0 || 'Miles must be greater than 0',
                    }}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Miles</FormLabel>
                        <FormControl>
                          <Input type="number" placeholder="450" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="deadheadMiles"
                    rules={{
                      validate: (value) =>
                        value === '' ||
                        parseFloat(value) >= 0 ||
                        'Deadhead miles must be 0 or more',
                    }}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Deadhead Miles</FormLabel>
                        <FormControl>
                          <Input type="number" placeholder="50" {...field} />
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
                      validate: (value) =>
                        parseFloat(value) > 0 || 'Rate must be greater than 0',
                    }}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Rate ($)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="0.01"
                            placeholder="2500.00"
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
                      validate: (value) =>
                        value === '' ||
                        parseFloat(value) >= 0 ||
                        'FSC must be 0 or more',
                    }}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>FSC ($)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="0.01"
                            placeholder="250.00"
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
                      validate: (value) =>
                        value === '' ||
                        parseFloat(value) >= 0 ||
                        'Tolls must be 0 or more',
                    }}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tolls ($)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="0.01"
                            placeholder="85.00"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="weight"
                    rules={{
                      validate: (value) =>
                        value === '' ||
                        parseFloat(value) >= 0 ||
                        'Weight must be 0 or more',
                    }}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Weight (lbs)</FormLabel>
                        <FormControl>
                          <Input type="number" placeholder="45000" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {settings.enableFuelCostTracking && (
                  <FormField
                    control={form.control}
                    name="fuelCost"
                    rules={{
                      validate: (value) =>
                        value === '' ||
                        parseFloat(value) >= 0 ||
                        'Fuel cost must be 0 or more',
                    }}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Fuel Cost ($)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="0.01"
                            placeholder="350.00"
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
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

            <div className="bg-muted/50 rounded-lg p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-medium">Revenue Per Mile</span>
                <div className="text-right">
                  <div className="text-2xl font-bold">${calculation.rpm.toFixed(2)}</div>
                  <Badge variant={getQualityColor(calculation.quality)} className="text-xs">
                    {calculation.quality}
                  </Badge>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <span className="font-medium">Estimated Profit</span>
                <div className="text-right">
                  <div className="text-xl font-bold text-success">${calculation.profit.toFixed(2)}</div>
                </div>
              </div>

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
            </div>

              <div className="flex gap-3">
                {onClose && (
                  <Button type="button" variant="outline" onClick={onClose} className="flex-1">
                    <X className="mr-2 h-4 w-4" />
                    Cancel
                  </Button>
                )}

                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowNegotiationSheet(true)}
                  disabled={!requiredFilled || hasErrors}
                  className="flex-1"
                >
                  <TrendingUp className="h-4 w-4 mr-2" />
                  Negotiate
                </Button>

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
        </form>
        <NegotiationSheet
          open={showNegotiationSheet}
          onClose={() => setShowNegotiationSheet(false)}
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
      </Form>
    );
  }