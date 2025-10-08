import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { useNegotiationSettings } from '@/hooks/useNegotiationSettings';
import { NegotiationSettings as NegotiationSettingsType } from '@/types/negotiation';
import { Loader2, TrendingUp, Settings2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { 
  validatePercentage, 
  validateRushThreshold, 
  validateNumeric 
} from '@/utils/inputValidation';

interface NegotiationSettingsProps {
  onClose?: () => void;
}

export function NegotiationSettings({ onClose }: NegotiationSettingsProps) {
  const { settings, loading, updateSettings } = useNegotiationSettings();
  const [localSettings, setLocalSettings] = useState<Partial<NegotiationSettingsType>>({});
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (settings) {
      setLocalSettings(settings);
    }
  }, [settings]);

  const handleSave = async () => {
    // Validate all numeric inputs before saving
    const validationErrors = [];

    // Validate percentage values
    if (localSettings.rush_value !== undefined) {
      const rushValidation = localSettings.rush_method === 'percentage' 
        ? validatePercentage(localSettings.rush_value)
        : validateNumeric(localSettings.rush_value, 0, 10); // Max $10/mile
      if (!rushValidation.isValid) {
        validationErrors.push(`Rush Value: ${rushValidation.error}`);
      }
    }

    if (localSettings.weekend_value !== undefined) {
      const weekendValidation = localSettings.weekend_method === 'percentage' 
        ? validatePercentage(localSettings.weekend_value)
        : validateNumeric(localSettings.weekend_value, 0, 10);
      if (!weekendValidation.isValid) {
        validationErrors.push(`Weekend Value: ${weekendValidation.error}`);
      }
    }

    if (localSettings.heavy_value !== undefined) {
      const heavyValidation = localSettings.heavy_method === 'percentage' 
        ? validatePercentage(localSettings.heavy_value)
        : validateNumeric(localSettings.heavy_value, -5, 5); // Can be negative
      if (!heavyValidation.isValid) {
        validationErrors.push(`Heavy Value: ${heavyValidation.error}`);
      }
    }

    if (localSettings.multi_stop_value !== undefined) {
      const multiStopValidation = localSettings.multi_stop_method === 'percentage' 
        ? validatePercentage(localSettings.multi_stop_value)
        : validateNumeric(localSettings.multi_stop_value, 0, 1000);
      if (!multiStopValidation.isValid) {
        validationErrors.push(`Multi-Stop Value: ${multiStopValidation.error}`);
      }
    }

    if (localSettings.premium_freight_value !== undefined) {
      const premiumValidation = localSettings.premium_freight_method === 'percentage' 
        ? validatePercentage(localSettings.premium_freight_value)
        : validateNumeric(localSettings.premium_freight_value, 0, 10);
      if (!premiumValidation.isValid) {
        validationErrors.push(`Premium Freight Value: ${premiumValidation.error}`);
      }
    }

    // Validate offset percentages
    if (localSettings.anchor_offset !== undefined) {
      const anchorValidation = validatePercentage(localSettings.anchor_offset * 100);
      if (!anchorValidation.isValid) {
        validationErrors.push(`Ask Offset: ${anchorValidation.error}`);
      }
    }

    if (localSettings.floor_offset !== undefined) {
      const floorValidation = validatePercentage(localSettings.floor_offset * 100);
      if (!floorValidation.isValid) {
        validationErrors.push(`Bottom Line Offset: ${floorValidation.error}`);
      }
    }

    // Validate rush threshold
    if (localSettings.rush_threshold_hours !== undefined) {
      const thresholdValidation = validateRushThreshold(localSettings.rush_threshold_hours);
      if (!thresholdValidation.isValid) {
        validationErrors.push(`Rush Threshold: ${thresholdValidation.error}`);
      }
    }

    // Validate weight threshold
    if (localSettings.heavy_weight_threshold !== undefined) {
      const weightValidation = validateNumeric(localSettings.heavy_weight_threshold, 1000, 150000);
      if (!weightValidation.isValid) {
        validationErrors.push(`Heavy Weight Threshold: ${weightValidation.error}`);
      }
    }

    if (validationErrors.length > 0) {
      toast({
        title: "Validation Error",
        description: validationErrors.join('. '),
        variant: "destructive",
      });
      return;
    }

    setSaving(true);
    try {
      await updateSettings(localSettings);
      toast({
        title: "Settings saved",
        description: "Your negotiation settings have been updated successfully.",
      });
      onClose?.(); // Navigate back to dashboard after successful save
    } catch (error) {
      toast({
        title: "Error saving settings",
        description: "Please try again.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const updateLocalSetting = (key: keyof NegotiationSettingsType, value: any) => {
    setLocalSettings(prev => ({ ...prev, [key]: value }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <TrendingUp className="h-6 w-6" />
            Negotiation Settings
          </h1>
          <p className="text-muted-foreground">
            Configure your premium adjustments and negotiation strategy.
          </p>
        </div>
        {onClose && (
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        )}
      </div>

      <div className="grid gap-6">
        {/* Premium Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings2 className="h-5 w-5" />
              Premium Adjustments
            </CardTitle>
            <CardDescription>
              Configure how premiums are applied for different load types. You can switch between fixed and percentages for each adjustment.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Rush Premium */}
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                 <Checkbox
                   checked={localSettings.rush_enabled}
                   onCheckedChange={(checked) => updateLocalSetting('rush_enabled', !!checked)}
                 />
                <Label htmlFor="rush-enabled" className="font-medium">Rush Load Premium</Label>
              </div>
              {localSettings.rush_enabled && (
                <div className="flex gap-4 ml-6">
                  <div className="flex-1">
                    <Label htmlFor="rush-method">Method</Label>
                    <Select 
                      value={localSettings.rush_method} 
                      onValueChange={(value) => updateLocalSetting('rush_method', value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="fixed">Fixed $/mile</SelectItem>
                        <SelectItem value="percentage">Percentage</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex-1">
                    <Label htmlFor="rush-value">
                      Value {localSettings.rush_method === 'percentage' ? '(%)' : '($/mile)'}
                    </Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={localSettings.rush_value?.toString() || ''}
                      onChange={(e) => updateLocalSetting('rush_value', e.target.value ? parseFloat(e.target.value) : undefined)}
                    />
                  </div>
                </div>
              )}
            </div>

            <Separator />

            {/* Weekend Premium */}
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                 <Checkbox
                   checked={localSettings.weekend_enabled}
                   onCheckedChange={(checked) => updateLocalSetting('weekend_enabled', !!checked)}
                 />
                <Label className="font-medium">Weekend Premium</Label>
              </div>
              {localSettings.weekend_enabled && (
                <div className="flex gap-4 ml-6">
                  <div className="flex-1">
                    <Label>Method</Label>
                    <Select 
                      value={localSettings.weekend_method} 
                      onValueChange={(value) => updateLocalSetting('weekend_method', value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="fixed">Fixed $/mile</SelectItem>
                        <SelectItem value="percentage">Percentage</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex-1">
                    <Label>
                      Value {localSettings.weekend_method === 'percentage' ? '(%)' : '($/mile)'}
                    </Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={localSettings.weekend_value?.toString() || ''}
                      onChange={(e) => updateLocalSetting('weekend_value', e.target.value ? parseFloat(e.target.value) : undefined)}
                    />
                  </div>
                </div>
              )}
            </div>

            <Separator />

            {/* Heavy Load Cost Adjustment */}
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                 <Checkbox
                   checked={localSettings.heavy_enabled}
                   onCheckedChange={(checked) => updateLocalSetting('heavy_enabled', !!checked)}
                 />
                <Label className="font-medium">Heavy Load Cost Adjustment</Label>
              </div>
              {localSettings.heavy_enabled && (
                <div className="ml-6 space-y-4">
                  {/* Method and Value row */}
                  <div className="flex gap-4">
                    <div className="flex-1">
                      <Label>Method</Label>
                      <Select 
                        value={localSettings.heavy_method} 
                        onValueChange={(value) => updateLocalSetting('heavy_method', value)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="fixed">Fixed $/mile</SelectItem>
                          <SelectItem value="percentage">Percentage</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex-1">
                      <Label>
                        Adjustment {localSettings.heavy_method === 'percentage' ? '(%)' : '($/mile)'}
                      </Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={localSettings.heavy_value?.toString() || ''}
                        onChange={(e) => updateLocalSetting('heavy_value', e.target.value ? parseFloat(e.target.value) : undefined)}
                        placeholder="e.g., -0.05 for cost reduction"
                      />
                    </div>
                  </div>
                  
                  {/* Weight Threshold row */}
                  <div>
                    <Label>Weight Threshold (lbs)</Label>
                    <Input
                      type="number"
                      value={localSettings.heavy_weight_threshold?.toString() || ''}
                      onChange={(e) => updateLocalSetting('heavy_weight_threshold', e.target.value ? parseInt(e.target.value) : undefined)}
                      placeholder="e.g., 45000"
                      className="w-full max-w-xs"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Loads above this weight will apply the adjustment (can be negative for cost reduction)
                    </p>
                  </div>
                </div>
              )}
            </div>

            <Separator />

            {/* Multi-Stop Premium */}
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                 <Checkbox
                   checked={localSettings.multi_stop_enabled}
                   onCheckedChange={(checked) => updateLocalSetting('multi_stop_enabled', !!checked)}
                 />
                <Label className="font-medium">Multi-Stop Premium</Label>
              </div>
              {localSettings.multi_stop_enabled && (
                <div className="flex gap-4 ml-6">
                  <div className="flex-1">
                    <Label>Method</Label>
                    <Select 
                      value={localSettings.multi_stop_method} 
                      onValueChange={(value) => updateLocalSetting('multi_stop_method', value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="fixed">Fixed Amount</SelectItem>
                        <SelectItem value="percentage">Percentage</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex-1">
                    <Label>
                      Value {localSettings.multi_stop_method === 'percentage' ? '(%)' : '($)'}
                    </Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={localSettings.multi_stop_value?.toString() || ''}
                      onChange={(e) => updateLocalSetting('multi_stop_value', e.target.value ? parseFloat(e.target.value) : undefined)}
                    />
                  </div>
                </div>
              )}
            </div>

            <Separator />

            {/* Premium Freight */}
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                 <Checkbox
                   checked={localSettings.premium_freight_enabled}
                   onCheckedChange={(checked) => updateLocalSetting('premium_freight_enabled', !!checked)}
                 />
                <Label className="font-medium">Premium Freight</Label>
              </div>
              {localSettings.premium_freight_enabled && (
                <div className="flex gap-4 ml-6">
                  <div className="flex-1">
                    <Label>Method</Label>
                    <Select 
                      value={localSettings.premium_freight_method} 
                      onValueChange={(value) => updateLocalSetting('premium_freight_method', value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="fixed">Fixed $/mile</SelectItem>
                        <SelectItem value="percentage">Percentage</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex-1">
                    <Label>
                      Value {localSettings.premium_freight_method === 'percentage' ? '(%)' : '($/mile)'}
                    </Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={localSettings.premium_freight_value?.toString() || ''}
                      onChange={(e) => updateLocalSetting('premium_freight_value', e.target.value ? parseFloat(e.target.value) : undefined)}
                    />
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Strategy Settings */}
        <Card>
          <CardHeader>
            <CardTitle>Negotiation Strategy</CardTitle>
            <CardDescription>
              Configure your ask and bottom line rate calculations.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Ask Offset (%)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={localSettings.anchor_offset ? (localSettings.anchor_offset * 100).toString() : ''}
                  onChange={(e) => updateLocalSetting('anchor_offset', e.target.value ? parseFloat(e.target.value) / 100 : undefined)}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  How much above settle-for for opening bid.
                </p>
              </div>
              <div>
                <Label>Bottom Line Offset (%)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={localSettings.floor_offset ? (localSettings.floor_offset * 100).toString() : ''}
                  onChange={(e) => updateLocalSetting('floor_offset', e.target.value ? parseFloat(e.target.value) / 100 : undefined)}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  How much below settle-for for bottom line rate.
                </p>
              </div>
            </div>
            <div>
              <Label>Rush Threshold (hours)</Label>
              <Input
                type="number"
                value={localSettings.rush_threshold_hours?.toString() || ''}
                onChange={(e) => updateLocalSetting('rush_threshold_hours', e.target.value ? parseInt(e.target.value) : undefined)}
              />
              <p className="text-xs text-muted-foreground mt-1">
                Hours to pickup to consider a load "rush"
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex gap-2">
          <Button onClick={handleSave} disabled={saving}>
            {saving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
            Save Settings
          </Button>
          {onClose && (
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}