import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Settings as SettingsIcon, Save, RotateCcw, Info, Zap } from 'lucide-react';
import { useSupabaseSettings } from '@/hooks/useSupabaseSettings';
import { defaultUserSettings } from '@/types/load';
import { useToast } from '@/hooks/use-toast';
import { useEquipment } from '@/hooks/useEquipment';
import type { Equipment } from '@/types/equipment';
import { 
  validateFuelPrice, 
  validateMPG, 
  validateRPM, 
  validateWeightLimit 
} from '@/utils/inputValidation';
import { getIndustryContext, getEffectiveMPG, getEffectiveRPMTargets } from '@/utils/equipmentDefaults';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

interface SettingsProps {
  onClose?: () => void;
}

export function Settings({ onClose }: SettingsProps) {
  const { settings, updateSettings } = useSupabaseSettings();
  const { toast } = useToast();
  const { equipment, setEquipment } = useEquipment();
  
  const [fuelPrice, setFuelPrice] = useState(settings.fuelPrice.toString());
  const [mpg, setMpg] = useState(settings.mpg.toString());
  const [excellentRpm, setExcellentRpm] = useState(settings.rpmThresholds.excellent.toString());
  const [goodRpm, setGoodRpm] = useState(settings.rpmThresholds.good.toString());
  const [fairRpm, setFairRpm] = useState(settings.rpmThresholds.fair.toString());
  const [weightLimit, setWeightLimit] = useState(settings.weightLimit.toString());
  const [enableFuelCostTracking, setEnableFuelCostTracking] = useState(settings.enableFuelCostTracking);
  const [useEquipmentDefaults, setUseEquipmentDefaults] = useState(settings.useEquipmentDefaults ?? true);

  // Get industry context for current equipment
  const industryContext = equipment ? getIndustryContext(equipment) : null;
  const effectiveMPG = equipment ? getEffectiveMPG(equipment, settings) : settings.mpg;
  const effectiveRPM = equipment ? getEffectiveRPMTargets(equipment, settings) : null;

  // Auto-update MPG when equipment changes (if using defaults and field is empty/default)
  useEffect(() => {
    if (equipment && useEquipmentDefaults && industryContext) {
      const currentMpgValue = parseFloat(mpg) || 0;
      // Auto-update if MPG is 0 (empty) or 6.5 (system default) to populate equipment-specific defaults
      if (currentMpgValue === 0 || currentMpgValue === 6.5) {
        setMpg(industryContext.recommendedMPG.toString());
      }
    }
  }, [equipment, useEquipmentDefaults, industryContext]);

  // Auto-update RPM thresholds when equipment changes (if using defaults and fields are empty/default)  
  useEffect(() => {
    if (equipment && useEquipmentDefaults && effectiveRPM) {
      const currentExcellent = parseFloat(excellentRpm) || 0;
      const currentGood = parseFloat(goodRpm) || 0; 
      const currentFair = parseFloat(fairRpm) || 0;
      
      // Only auto-update if all RPM values are 0 (empty/default)
      if (currentExcellent === 0 && currentGood === 0 && currentFair === 0) {
        setExcellentRpm(effectiveRPM.green.toString());
        setGoodRpm(effectiveRPM.yellow.toString());
        setFairRpm(effectiveRPM.red.toString());
      }
    }
  }, [equipment, useEquipmentDefaults, effectiveRPM]);

  const handleSave = async () => {
    // Validate all inputs before saving
    const fuelPriceValidation = validateFuelPrice(fuelPrice);
    const mpgValidation = validateMPG(mpg);
    const excellentRpmValidation = validateRPM(excellentRpm);
    const goodRpmValidation = validateRPM(goodRpm);
    const fairRpmValidation = validateRPM(fairRpm);
    const weightLimitValidation = validateWeightLimit(weightLimit);

    // Check for validation errors
    const validationErrors = [];
    if (!fuelPriceValidation.isValid) validationErrors.push(`Fuel Price: ${fuelPriceValidation.error}`);
    if (!mpgValidation.isValid) validationErrors.push(`MPG: ${mpgValidation.error}`);
    if (!excellentRpmValidation.isValid) validationErrors.push(`Excellent RPM: ${excellentRpmValidation.error}`);
    if (!goodRpmValidation.isValid) validationErrors.push(`Good RPM: ${goodRpmValidation.error}`);
    if (!fairRpmValidation.isValid) validationErrors.push(`Fair RPM: ${fairRpmValidation.error}`);
    if (!weightLimitValidation.isValid) validationErrors.push(`Weight Limit: ${weightLimitValidation.error}`);

    // Validate RPM threshold order (excellent > good > fair)
    const excellentVal = parseFloat(excellentRpm);
    const goodVal = parseFloat(goodRpm);
    const fairVal = parseFloat(fairRpm);
    
    if (excellentVal <= goodVal) {
      validationErrors.push('Excellent RPM must be higher than Good RPM');
    }
    if (goodVal <= fairVal) {
      validationErrors.push('Good RPM must be higher than Fair RPM');
    }

    if (validationErrors.length > 0) {
      toast({
        title: "Validation Error",
        description: validationErrors.join('. '),
        variant: "destructive",
      });
      return;
    }

    const newSettings = {
      ...settings,
      fuelPrice: parseFloat(fuelPrice),
      mpg: parseFloat(mpg),
      rpmThresholds: {
        excellent: excellentVal,
        good: goodVal,
        fair: fairVal,
      },
      weightLimit: parseFloat(weightLimit),
      enableFuelCostTracking,
      useEquipmentDefaults,
    };
    
    await updateSettings(newSettings);
    
    toast({
      title: "Settings saved",
      description: "Your settings have been updated successfully.",
    });
    
    onClose?.();
  };

  const handleReset = async () => {
    // Custom reset values - all numbers to 0
    const resetSettings = {
      ...defaultUserSettings,
      fuelPrice: 0,
      mpg: 0,
      rpmThresholds: {
        excellent: 0,
        good: 0,
        fair: 0
      },
      weightLimit: 0
    };
    
    await updateSettings(resetSettings);
    setFuelPrice('0');
    setMpg('0');
    setExcellentRpm('0');
    setGoodRpm('0');
    setFairRpm('0');
    setWeightLimit('0');
    setEnableFuelCostTracking(resetSettings.enableFuelCostTracking);
    setUseEquipmentDefaults(true);
    
    // Reset equipment to unselected state
    setEquipment(undefined);
  };

  return (
    <Card className="gradient-card border-0">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-foreground">
          <div className="p-2 rounded-lg bg-primary/20">
            <SettingsIcon className="h-5 w-5 text-primary" />
          </div>
          Settings
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Fuel Settings */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Fuel & Vehicle</h3>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="fuelPrice">Fuel Price ($/gallon)</Label>
              <Input
                id="fuelPrice"
                type="number"
                step="0.01"
                value={fuelPrice ? parseFloat(fuelPrice).toFixed(2) : '0.00'}
                onChange={(e) => setFuelPrice(e.target.value)}
                placeholder="0.00"
              />
              <div className="text-sm text-muted-foreground">
                National average: $3.89
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Label htmlFor="mpg">MPG</Label>
                {equipment && <Badge variant="secondary" className="text-xs">
                  {industryContext?.equipmentType}: {industryContext?.recommendedMPG} MPG
                </Badge>}
              </div>
              <Input
                id="mpg"
                type="number"
                step="0.1"
                value={mpg}
                onChange={(e) => setMpg(e.target.value)}
                placeholder="0"
              />
              {equipment && effectiveMPG !== parseFloat(mpg) && (
                <div className="text-sm text-muted-foreground flex items-center gap-1">
                  <Zap className="h-3 w-3" />
                  Smart default: {effectiveMPG} MPG
                </div>
              )}
            </div>
          </div>
          
          {/* Smart Defaults Toggle */}
          <div className="flex items-center justify-between p-3 rounded-lg bg-accent/50">
            <div className="space-y-1">
              <Label htmlFor="useEquipmentDefaults">Use Equipment-Specific Defaults</Label>
              <div className="text-sm text-muted-foreground">
                Automatically use industry-researched MPG/RPM targets for your equipment type
              </div>
            </div>
             <Checkbox
               id="useEquipmentDefaults"
               checked={useEquipmentDefaults}
               onCheckedChange={(checked) => setUseEquipmentDefaults(!!checked)}
             />
          </div>
        </div>

        {/* Equipment */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Equipment</h3>
          <div className="space-y-2">
            <Label htmlFor="equipment">Equipment Type</Label>
            <Select value={equipment || ""} onValueChange={(value) => setEquipment(value as Equipment)}>
              <SelectTrigger id="equipment">
                <SelectValue placeholder="Select Equipment Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="cargo_van">Cargo Van</SelectItem>
                <SelectItem value="straight_truck">Straight Truck</SelectItem>
                <SelectItem value="hotshot">Hotshot</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* RPM Thresholds */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">RPM Quality Thresholds</h3>
            {equipment && industryContext && (
              <Badge variant="outline" className="text-xs">
                Market avg: ${industryContext.marketAverageRPM}/mi
              </Badge>
            )}
          </div>
          
          {effectiveRPM && useEquipmentDefaults && (
            <div className="p-3 rounded-lg bg-primary/10 border border-primary/20">
              <div className="flex items-center gap-2 mb-2">
                <Info className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium text-primary">
                  Using {industryContext?.equipmentType} Industry Standards
                </span>
              </div>
              <div className="grid grid-cols-3 gap-2 text-sm">
                <div>Great: ${effectiveRPM.green.toFixed(2)}/mi</div>
                <div>Good: ${effectiveRPM.yellow.toFixed(2)}/mi</div>
                <div>Fair: ${effectiveRPM.red.toFixed(2)}/mi</div>
              </div>
            </div>
          )}
          
          <div className="space-y-3">
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-2">
                <Label htmlFor="excellentRpm">Great ($/mile)</Label>
                <Input
                  id="excellentRpm"
                  type="number"
                  step="0.1"
                  value={excellentRpm}
                  onChange={(e) => setExcellentRpm(e.target.value)}
                  placeholder="0"
                  className="h-10"
                  disabled={useEquipmentDefaults && !!equipment}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="goodRpm">Good ($/mile)</Label>
                <Input
                  id="goodRpm"
                  type="number"
                  step="0.1"
                  value={goodRpm}
                  onChange={(e) => setGoodRpm(e.target.value)}
                  placeholder="0"
                  className="h-10"
                  disabled={useEquipmentDefaults && !!equipment}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="fairRpm">Fair ($/mile)</Label>
                <Input
                  id="fairRpm"
                  type="number"
                  step="0.1"
                  value={fairRpm}
                  onChange={(e) => setFairRpm(e.target.value)}
                  placeholder="0"
                  className="h-10"
                  disabled={useEquipmentDefaults && !!equipment}
                />
              </div>
            </div>
            <div className="text-sm text-muted-foreground">
              {useEquipmentDefaults && equipment ? 
                "Using equipment-specific industry standards. Disable smart defaults to customize." :
                "Loads below the Fair threshold will be marked as Poor quality."
              }
            </div>
          </div>
        </div>

        {/* Weight Limit */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Weight Limits</h3>
          <div className="space-y-2">
            <Label htmlFor="weightLimit">Maximum Weight (lbs)</Label>
            <Input
              id="weightLimit"
              type="number"
              value={weightLimit}
              onChange={(e) => setWeightLimit(e.target.value)}
              placeholder="0"
            />
            <div className="text-sm text-muted-foreground">
              Loads above this weight will be flagged as overweight.
            </div>
          </div>
        </div>

        {/* Fuel Cost Tracking */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Fuel Cost Tracking</h3>
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label htmlFor="enableFuelCostTracking">Enable Fuel Cost Tracking</Label>
              <div className="text-sm text-muted-foreground">
                Track fuel costs in your load calculations. Can be enabled later if needed.
              </div>
            </div>
             <Checkbox
               id="enableFuelCostTracking"
               checked={enableFuelCostTracking}
               onCheckedChange={(checked) => setEnableFuelCostTracking(!!checked)}
             />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 pt-4">
          <Button variant="outline" onClick={handleReset} className="flex-1">
            <RotateCcw className="mr-2 h-4 w-4" />
            Reset to Defaults
          </Button>
          
          <Button onClick={handleSave} className="flex-1">
            <Save className="mr-2 h-4 w-4" />
            Save Settings
          </Button>
        </div>
        
        {onClose && (
          <Button variant="ghost" onClick={onClose} className="w-full">
            Close
          </Button>
        )}
      </CardContent>
    </Card>
  );
}