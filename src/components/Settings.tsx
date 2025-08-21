import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Settings as SettingsIcon, Save, RotateCcw } from 'lucide-react';
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
    };
    
    await updateSettings(newSettings);
    
    toast({
      title: "Settings saved",
      description: "Your settings have been updated successfully.",
    });
    
    onClose?.();
  };

  const handleReset = async () => {
    await updateSettings(defaultUserSettings);
    setFuelPrice(defaultUserSettings.fuelPrice.toString());
    setMpg(defaultUserSettings.mpg.toString());
    setExcellentRpm(defaultUserSettings.rpmThresholds.excellent.toString());
    setGoodRpm(defaultUserSettings.rpmThresholds.good.toString());
    setFairRpm(defaultUserSettings.rpmThresholds.fair.toString());
    setWeightLimit(defaultUserSettings.weightLimit.toString());
    setEnableFuelCostTracking(defaultUserSettings.enableFuelCostTracking);
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
                value={fuelPrice}
                onChange={(e) => setFuelPrice(e.target.value)}
                placeholder="0"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="mpg">Miles Per Gallon</Label>
              <Input
                id="mpg"
                type="number"
                step="0.1"
                value={mpg}
                onChange={(e) => setMpg(e.target.value)}
                placeholder="0"
              />
            </div>
          </div>
        </div>

        {/* Equipment */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Equipment</h3>
          <div className="space-y-2">
            <Label htmlFor="equipment">Equipment Type</Label>
            <Select value={equipment} onValueChange={(value) => setEquipment(value as Equipment)}>
              <SelectTrigger id="equipment">
                <SelectValue />
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
          <h3 className="text-lg font-semibold">RPM Quality Thresholds</h3>
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
                />
              </div>
            </div>
            <div className="text-sm text-muted-foreground">
              Loads below the Fair threshold will be marked as Poor quality.
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
            <Switch
              id="enableFuelCostTracking"
              checked={enableFuelCostTracking}
              onCheckedChange={setEnableFuelCostTracking}
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