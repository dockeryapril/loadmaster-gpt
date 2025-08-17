import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { useNegotiationSettings } from '@/hooks/useNegotiationSettings';
import { NegotiationSettings as NegotiationSettingsType } from '@/types/negotiation';
import { Loader2, TrendingUp, Settings2 } from 'lucide-react';

interface NegotiationSettingsProps {
  onClose?: () => void;
}

export function NegotiationSettings({ onClose }: NegotiationSettingsProps) {
  const { settings, loading, updateSettings } = useNegotiationSettings();
  const [localSettings, setLocalSettings] = useState<Partial<NegotiationSettingsType>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (settings) {
      setLocalSettings(settings);
    }
  }, [settings]);

  const handleSave = async () => {
    setSaving(true);
    await updateSettings(localSettings);
    setSaving(false);
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
                <Switch
                  checked={localSettings.rush_enabled}
                  onCheckedChange={(checked) => updateLocalSetting('rush_enabled', checked)}
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
                      value={localSettings.rush_value}
                      onChange={(e) => updateLocalSetting('rush_value', parseFloat(e.target.value))}
                    />
                  </div>
                </div>
              )}
            </div>

            <Separator />

            {/* Weekend Premium */}
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Switch
                  checked={localSettings.weekend_enabled}
                  onCheckedChange={(checked) => updateLocalSetting('weekend_enabled', checked)}
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
                      value={localSettings.weekend_value}
                      onChange={(e) => updateLocalSetting('weekend_value', parseFloat(e.target.value))}
                    />
                  </div>
                </div>
              )}
            </div>

            <Separator />

            {/* Heavy Load Adjustment */}
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Switch
                  checked={localSettings.heavy_enabled}
                  onCheckedChange={(checked) => updateLocalSetting('heavy_enabled', checked)}
                />
                <Label className="font-medium">Heavy Load Adjustment</Label>
              </div>
              {localSettings.heavy_enabled && (
                <div className="flex gap-4 ml-6">
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
                      Value {localSettings.heavy_method === 'percentage' ? '(%)' : '($/mile)'}
                    </Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={localSettings.heavy_value}
                      onChange={(e) => updateLocalSetting('heavy_value', parseFloat(e.target.value))}
                    />
                  </div>
                  <div className="flex-1">
                    <Label>Weight Threshold (lbs)</Label>
                    <Input
                      type="number"
                      value={localSettings.heavy_weight_threshold}
                      onChange={(e) => updateLocalSetting('heavy_weight_threshold', parseInt(e.target.value))}
                    />
                  </div>
                </div>
              )}
            </div>

            <Separator />

            {/* Multi-Stop Premium */}
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Switch
                  checked={localSettings.multi_stop_enabled}
                  onCheckedChange={(checked) => updateLocalSetting('multi_stop_enabled', checked)}
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
                      value={localSettings.multi_stop_value}
                      onChange={(e) => updateLocalSetting('multi_stop_value', parseFloat(e.target.value))}
                    />
                  </div>
                </div>
              )}
            </div>

            <Separator />

            {/* Premium Freight */}
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Switch
                  checked={localSettings.premium_freight_enabled}
                  onCheckedChange={(checked) => updateLocalSetting('premium_freight_enabled', checked)}
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
                      value={localSettings.premium_freight_value}
                      onChange={(e) => updateLocalSetting('premium_freight_value', parseFloat(e.target.value))}
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
              Configure your anchor and floor rate calculations
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Anchor Offset (%)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={localSettings.anchor_offset ? localSettings.anchor_offset * 100 : 0}
                  onChange={(e) => updateLocalSetting('anchor_offset', parseFloat(e.target.value) / 100)}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  How much above target for opening bid
                </p>
              </div>
              <div>
                <Label>Floor Offset (%)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={localSettings.floor_offset ? localSettings.floor_offset * 100 : 0}
                  onChange={(e) => updateLocalSetting('floor_offset', parseFloat(e.target.value) / 100)}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  How much below target for minimum rate
                </p>
              </div>
            </div>
            <div>
              <Label>Rush Threshold (hours)</Label>
              <Input
                type="number"
                value={localSettings.rush_threshold_hours}
                onChange={(e) => updateLocalSetting('rush_threshold_hours', parseInt(e.target.value))}
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