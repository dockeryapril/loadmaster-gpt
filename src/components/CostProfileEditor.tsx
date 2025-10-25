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
import { trackCostAssumptionsEdited, trackPresetToggled } from '@/utils/analytics';
import { getPresetValues } from '@/config/vehicleDefaults';

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
};

interface CostProfileEditorProps {
  currentEquipment?: Equipment;
  currentFuelType?: FuelType;
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
});

export function CostProfileEditor({ currentEquipment = 'hotshot', currentFuelType = 'diesel', onPresetApplied }: CostProfileEditorProps = {}) {
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

  // Track when cost profile editor opens
  useEffect(() => {
    if (open) {
      trackCostAssumptionsEdited();
    }
  }, [open]);

  // Keep local state in sync with persisted values while the sheet is closed
  useEffect(() => {
    if (!open) {
      setEditingValues(formatProfileForEditing(mergedCostProfile));
    }
  }, [mergedCostProfile, open]);

  // Apply presets when toggle is enabled and equipment/fuel changes
  useEffect(() => {
    if (editingValues.useSmartHopPresets && currentEquipment && currentFuelType) {
      const preset = getPresetValues(currentEquipment, currentFuelType);
      setEditingValues(prev => ({
        ...prev,
        averageMPG: String(preset.mpg),
        variableCostPerMile: preset.variableCPM.toFixed(2),
        dailyFixedCosts: String(preset.fixedPerDay),
      }));
      onPresetApplied?.(preset.mpg, preset.variableCPM, preset.fixedPerDay);
    }
  }, [editingValues.useSmartHopPresets, currentEquipment, currentFuelType, onPresetApplied]);

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
    });
    
    // Track save action
    trackCostAssumptionsEdited();
    
    setOpen(false);
  };

  const handlePresetToggle = () => {
    const newValue = !editingValues.useSmartHopPresets;
    setEditingValues(prev => ({ ...prev, useSmartHopPresets: newValue }));
    trackPresetToggled(newValue);
    
    if (newValue && currentEquipment && currentFuelType) {
      const preset = getPresetValues(currentEquipment, currentFuelType);
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
        <Button variant="ghost" size="sm" className="gap-2 text-muted-foreground hover:text-primary">
          <Settings className="h-4 w-4" />
          Edit Cost Assumptions
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
