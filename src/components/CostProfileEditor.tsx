import { useState, useEffect, useMemo } from 'react';
import { Settings, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { useCostProfile } from '@/store/useDecisionStore';
import { defaultCostAssumptions } from '@/types/mvp';
import type { CostAssumptions, Equipment, FuelType } from '@/types/mvp';
import { toast } from '@/components/ui/use-toast';
import { ToastAction } from '@/components/ui/toast';
import { trackCostAssumptionsEdited, trackPresetToggled, trackCostEditorFirstOpen, trackFuelTypeChanged } from '@/utils/analytics';
import { getPresetValues } from '@/config/vehicleDefaults';
import { useOnboardingStore } from '@/store/useOnboardingStore';

type EditingCostProfile = {
  fuelPricePerGallon: string;
  averageMPG: string;
  dailyFixedCosts: string;
  variableCostPerMile: string;
  goodRpm: string;
  fairRpm: string;
  goodProfit: string;
  fairProfit: string;
  useSmartHopPresets: boolean;
  fuelType: FuelType;
};

interface CostProfileEditorProps {
  currentEquipment?: Equipment;
  onPresetApplied?: (mpg: number, variableCPM: number, fixedPerDay: number) => void;
}

const formatProfileForEditing = (profile: CostAssumptions): EditingCostProfile => ({
  fuelPricePerGallon: profile.fuelPricePerGallon.toFixed(2),
  averageMPG: String(profile.averageMPG),
  dailyFixedCosts: String(profile.dailyFixedCosts),
  variableCostPerMile: profile.variableCostPerMile.toFixed(2),
  goodRpm: profile.goodRpm.toFixed(2),
  fairRpm: profile.fairRpm.toFixed(2),
  goodProfit: String(profile.goodProfit),
  fairProfit: String(profile.fairProfit),
  useSmartHopPresets: profile.useSmartHopPresets ?? false,
  fuelType: profile.fuelType ?? 'diesel',
});

export function CostProfileEditor({ currentEquipment = 'hotshot', onPresetApplied }: CostProfileEditorProps = {}) {
  const { costProfile, updateCostProfile } = useCostProfile();
  const mergedCostProfile = useMemo(
    () => ({
      ...defaultCostAssumptions,
      ...costProfile,
    }),
    [costProfile],
  );
  const [editingValues, setEditingValues] = useState<EditingCostProfile>(() =>
    formatProfileForEditing(mergedCostProfile),
  );
  const [open, setOpen] = useState(false);
  const hasOpenedCostEditor = useOnboardingStore((state) => state.hasOpenedCostEditor);
  const markCostEditorOpened = useOnboardingStore((state) => state.markCostEditorOpened);

  // Track when cost profile editor opens
  useEffect(() => {
    if (open) {
      trackCostAssumptionsEdited();
      
      // Track and mark first time opening
      if (!hasOpenedCostEditor) {
        markCostEditorOpened();
        trackCostEditorFirstOpen();
        toast({
          title: '💡 Tip',
          description: 'Customize MPG, fuel price & costs to match your truck',
        });
      }
    }
  }, [open, hasOpenedCostEditor, markCostEditorOpened]);

  // Keep local state in sync with persisted values while the sheet is closed
  useEffect(() => {
    if (!open) {
      setEditingValues(formatProfileForEditing(mergedCostProfile));
    }
  }, [mergedCostProfile, open]);

  // Apply presets when toggle is enabled and equipment/fuel changes
  useEffect(() => {
    if (editingValues.useSmartHopPresets && currentEquipment) {
      const preset = getPresetValues(currentEquipment, editingValues.fuelType);
      setEditingValues(prev => ({
        ...prev,
        averageMPG: String(preset.mpg),
        variableCostPerMile: preset.variableCPM.toFixed(2),
        dailyFixedCosts: String(preset.fixedPerDay),
      }));
      onPresetApplied?.(preset.mpg, preset.variableCPM, preset.fixedPerDay);
    }
  }, [editingValues.useSmartHopPresets, editingValues.fuelType, currentEquipment, onPresetApplied]);

  const parseOrDefault = (value: string, fallback: number) => {
    const parsed = parseFloat(value);
    return Number.isNaN(parsed) ? fallback : parsed;
  };

  const handleSave = () => {
    updateCostProfile({
      fuelPricePerGallon: parseOrDefault(
        editingValues.fuelPricePerGallon,
        mergedCostProfile.fuelPricePerGallon,
      ),
      averageMPG: parseOrDefault(editingValues.averageMPG, mergedCostProfile.averageMPG),
      dailyFixedCosts: parseOrDefault(
        editingValues.dailyFixedCosts,
        mergedCostProfile.dailyFixedCosts,
      ),
      variableCostPerMile: parseOrDefault(
        editingValues.variableCostPerMile,
        mergedCostProfile.variableCostPerMile,
      ),
      goodRpm: parseOrDefault(editingValues.goodRpm, mergedCostProfile.goodRpm),
      fairRpm: parseOrDefault(editingValues.fairRpm, mergedCostProfile.fairRpm),
      goodProfit: parseOrDefault(editingValues.goodProfit, mergedCostProfile.goodProfit),
      fairProfit: parseOrDefault(editingValues.fairProfit, mergedCostProfile.fairProfit),
      useSmartHopPresets: editingValues.useSmartHopPresets,
      fuelType: editingValues.fuelType,
    });
    
    // Track save action
    trackCostAssumptionsEdited();
    
    setOpen(false);
  };

  const handlePresetToggle = () => {
    const newValue = !editingValues.useSmartHopPresets;
    setEditingValues(prev => ({ ...prev, useSmartHopPresets: newValue }));
    trackPresetToggled(newValue);
    
    if (newValue && currentEquipment) {
      const preset = getPresetValues(currentEquipment, editingValues.fuelType);
      setEditingValues(prev => ({
        ...prev,
        averageMPG: String(preset.mpg),
        variableCostPerMile: preset.variableCPM.toFixed(2),
        dailyFixedCosts: String(preset.fixedPerDay),
        useSmartHopPresets: true,
      }));
      onPresetApplied?.(preset.mpg, preset.variableCPM, preset.fixedPerDay);
    }
  };

  const handleCancel = () => {
    setEditingValues(formatProfileForEditing(mergedCostProfile));
    setOpen(false);
  };

  const handleResetThresholds = () => {
    const previousThresholds = {
      goodRpm: editingValues.goodRpm,
      fairRpm: editingValues.fairRpm,
      goodProfit: editingValues.goodProfit,
      fairProfit: editingValues.fairProfit,
    };

    setEditingValues((prev) => ({
      ...prev,
      goodRpm: defaultCostAssumptions.goodRpm.toFixed(2),
      fairRpm: defaultCostAssumptions.fairRpm.toFixed(2),
      goodProfit: String(defaultCostAssumptions.goodProfit),
      fairProfit: String(defaultCostAssumptions.fairProfit),
    }));

    toast({
      description: 'Defaults restored.',
      action: (
        <ToastAction
          altText="Undo"
          onClick={() =>
            setEditingValues((prev) => ({
              ...prev,
              ...previousThresholds,
            }))
          }
        >
          Undo
        </ToastAction>
      ),
    });
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button 
          variant="outline" 
          size="sm" 
          className="gap-2 border-primary/30 bg-primary/5 text-primary hover:bg-primary/10 hover:border-primary/50 font-medium relative"
          data-onboarding="cost-editor-trigger"
        >
          <Settings className="h-4 w-4" />
          Edit Cost Assumptions
          {/* First-time user hint badge */}
          {!hasOpenedCostEditor && (
            <span className="absolute -top-1 -right-1 flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-primary"></span>
            </span>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent side="bottom" className="h-[90vh] sm:h-auto sm:max-h-[90vh]">
        <SheetHeader>
          <SheetTitle>Cost Profile</SheetTitle>
          <SheetDescription>
            Adjust these values to match your actual operating costs. These are used to calculate your net profit.
          </SheetDescription>
        </SheetHeader>
        
        <ScrollArea className="h-[calc(90vh-120px)] sm:h-[calc(80vh-180px)]">
          <div className="mt-6 space-y-6 pr-4">
            {/* Fuel Type Selector */}
            <div>
              <label className="text-sm font-medium text-foreground">
                Fuel Type
              </label>
              <p className="text-xs text-muted-foreground mt-0.5">
                Your vehicle's fuel type (affects MPG defaults)
              </p>
              <div className="mt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setEditingValues(prev => ({ ...prev, fuelType: 'gas' }));
                    trackFuelTypeChanged('gas', currentEquipment);
                  }}
                  className={`flex-1 rounded-lg border py-2 px-3 text-sm font-medium transition-colors ${
                    editingValues.fuelType === 'gas'
                      ? 'border-primary bg-primary text-primary-foreground'
                      : 'border-input bg-background text-foreground hover:bg-muted'
                  }`}
                >
                  ⛽ Gas
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setEditingValues(prev => ({ ...prev, fuelType: 'diesel' }));
                    trackFuelTypeChanged('diesel', currentEquipment);
                  }}
                  className={`flex-1 rounded-lg border py-2 px-3 text-sm font-medium transition-colors ${
                    editingValues.fuelType === 'diesel'
                      ? 'border-primary bg-primary text-primary-foreground'
                      : 'border-input bg-background text-foreground hover:bg-muted'
                  }`}
                >
                  🚛 Diesel
                </button>
              </div>
            </div>

            {/* Industry Presets Toggle */}
            <div className="rounded-lg border border-border bg-muted/30 p-4">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <label className="text-sm font-medium text-foreground">Use industry presets</label>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Auto-populate MPG, costs based on equipment and fuel type
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handlePresetToggle}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    editingValues.useSmartHopPresets ? 'bg-primary' : 'bg-muted-foreground/30'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      editingValues.useSmartHopPresets ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
              {editingValues.useSmartHopPresets && (
                <Badge variant="secondary" className="mt-3 gap-1">
                  <Info className="h-3 w-3" />
                  Based on 2024-2025 market data
                </Badge>
              )}
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">
                Fuel price per gallon
              </label>
              <p className="text-xs text-muted-foreground">
                Current diesel price at your usual fuel stops
              </p>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={editingValues.fuelPricePerGallon}
                  onChange={(e) => setEditingValues({ ...editingValues, fuelPricePerGallon: e.target.value })}
                  className="w-full rounded-lg border border-input bg-background py-2 pl-7 pr-3 text-sm focus:border-primary focus:outline-none"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">
                Average MPG
              </label>
              <p className="text-xs text-muted-foreground">
                Your truck's fuel efficiency (miles per gallon)
              </p>
              <input
                type="number"
                step="0.1"
                min="0"
                value={editingValues.averageMPG}
                onChange={(e) => setEditingValues({ ...editingValues, averageMPG: e.target.value })}
                disabled={editingValues.useSmartHopPresets}
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">
                Daily fixed costs
              </label>
              <p className="text-xs text-muted-foreground">
                Insurance, truck payment, permits (prorated per day)
              </p>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                <input
                  type="number"
                  step="1"
                  min="0"
                  value={editingValues.dailyFixedCosts}
                  onChange={(e) => setEditingValues({ ...editingValues, dailyFixedCosts: e.target.value })}
                  disabled={editingValues.useSmartHopPresets}
                  className="w-full rounded-lg border border-input bg-background py-2 pl-7 pr-3 text-sm focus:border-primary focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">
                Variable cost per mile
              </label>
              <p className="text-xs text-muted-foreground">
                Tires, maintenance, wear & tear per mile driven
              </p>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={editingValues.variableCostPerMile}
                  onChange={(e) => setEditingValues({ ...editingValues, variableCostPerMile: e.target.value })}
                  disabled={editingValues.useSmartHopPresets}
                  className="w-full rounded-lg border border-input bg-background py-2 pl-7 pr-3 text-sm focus:border-primary focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
                />
              </div>
            </div>

            <div className="mt-6 border-t border-border pt-6">
              <h3 className="text-sm font-semibold text-foreground mb-4">Decision Guidance Thresholds</h3>
              <p className="text-xs text-muted-foreground mb-4">
                These thresholds determine when to book, counter, or pass on a load based on Net RPM and profit
              </p>

              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">
                    Good Net RPM (Book it threshold)
                  </label>
                  <p className="text-xs text-muted-foreground">
                    Book loads with Net RPM above this amount
                  </p>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={editingValues.goodRpm}
                      onChange={(e) => setEditingValues({ ...editingValues, goodRpm: e.target.value })}
                      className="w-full rounded-lg border border-input bg-background py-2 pl-7 pr-3 text-sm focus:border-primary focus:outline-none"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">
                    Fair Net RPM (Counter threshold)
                  </label>
                  <p className="text-xs text-muted-foreground">
                    Consider loads with Net RPM above this amount
                  </p>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={editingValues.fairRpm}
                      onChange={(e) => setEditingValues({ ...editingValues, fairRpm: e.target.value })}
                      className="w-full rounded-lg border border-input bg-background py-2 pl-7 pr-3 text-sm focus:border-primary focus:outline-none"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">
                    Good Profit (Book it threshold)
                  </label>
                  <p className="text-xs text-muted-foreground">
                    Book loads with profit above this amount
                  </p>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                    <input
                      type="number"
                      step="1"
                      min="0"
                      value={editingValues.goodProfit}
                      onChange={(e) => setEditingValues({ ...editingValues, goodProfit: e.target.value })}
                      className="w-full rounded-lg border border-input bg-background py-2 pl-7 pr-3 text-sm focus:border-primary focus:outline-none"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">
                    Fair Profit (Counter threshold)
                  </label>
                  <p className="text-xs text-muted-foreground">
                    Consider loads with profit above this amount
                  </p>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                    <input
                      type="number"
                      step="1"
                      min="0"
                      value={editingValues.fairProfit}
                      onChange={(e) => setEditingValues({ ...editingValues, fairProfit: e.target.value })}
                      className="w-full rounded-lg border border-input bg-background py-2 pl-7 pr-3 text-sm focus:border-primary focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <Button
                    type="button"
                    variant="ghost"
                    className="px-0 text-sm font-normal text-muted-foreground hover:text-primary"
                    onClick={handleResetThresholds}
                  >
                    Reset to Defaults
                  </Button>
                </div>
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <Button onClick={handleSave} className="flex-1">
                Save Changes
              </Button>
              <Button onClick={handleCancel} variant="outline" className="flex-1">
                Cancel
              </Button>
            </div>
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
