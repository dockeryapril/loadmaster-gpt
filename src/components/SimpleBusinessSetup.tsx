import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Truck, DollarSign } from 'lucide-react';
import type { Equipment } from '@/types/equipment';

interface SimpleBusinessSetupProps {
  onSave: (revenueSplit: number, weeklyCosts: number, equipment?: Equipment) => void;
  onSkip?: () => void;
  initialRevenueSplit?: number;
  initialWeeklyCosts?: number;
  initialEquipment?: Equipment;
}

// Quick setup templates
const SETUP_TEMPLATES = [
  {
    name: '75/25 Lease',
    revenueSplit: 75,
    weeklyCosts: 400,
    description: 'Company provides truck, insurance, maintenance'
  },
  {
    name: 'Independent Contractor',
    revenueSplit: 95,
    weeklyCosts: 100,
    description: 'Own your truck, pay basic operational costs'
  },
  {
    name: 'Company Driver',
    revenueSplit: 35,
    weeklyCosts: 0,
    description: 'Salary/percentage with no equipment costs'
  }
];

export function SimpleBusinessSetup({ 
  onSave, 
  onSkip, 
  initialRevenueSplit = 100, 
  initialWeeklyCosts = 0,
  initialEquipment = 'straight_truck' 
}: SimpleBusinessSetupProps) {
  const [revenueSplit, setRevenueSplit] = useState(initialRevenueSplit);
  const [weeklyCosts, setWeeklyCosts] = useState(initialWeeklyCosts);
  const [equipment, setEquipment] = useState<Equipment>(initialEquipment);

  const handleSave = () => {
    onSave(revenueSplit, weeklyCosts, equipment);
  };

  const equipmentOptions = [
    { value: 'cargo_van', label: 'Cargo Van' },
    { value: 'straight_truck', label: 'Straight Truck' },
    { value: 'hotshot', label: 'Hotshot/Pickup' }
  ];

  const applyTemplate = (template: typeof SETUP_TEMPLATES[0]) => {
    setRevenueSplit(template.revenueSplit);
    setWeeklyCosts(template.weeklyCosts);
  };

  const estimatedWeeklyMiles = 2500; // Industry average for calculations
  const weeklyImpactPerMile = weeklyCosts / estimatedWeeklyMiles;

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="text-center pb-4">
        <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center mx-auto mb-3">
          <Truck className="w-6 h-6 text-primary-foreground" />
        </div>
        <CardTitle className="text-xl">Quick Business Setup</CardTitle>
        <CardDescription className="text-sm">
          Set up your revenue split and costs for accurate RPM calculations
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Quick Templates */}
        <div className="space-y-3">
          <Label className="text-sm font-medium">Quick Setup Templates</Label>
          <div className="grid gap-2">
            {SETUP_TEMPLATES.map((template) => (
              <Button
                key={template.name}
                variant="outline"
                className="h-auto p-3 text-left justify-start"
                onClick={() => applyTemplate(template)}
              >
                <div className="flex-1">
                  <div className="font-medium text-sm">{template.name}</div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {template.revenueSplit}% split • ${template.weeklyCosts}/week
                  </div>
                </div>
              </Button>
            ))}
          </div>
        </div>

        <Separator />

        {/* Manual Setup */}
        <div className="space-y-4">
          <Label className="text-sm font-medium">Custom Setup</Label>
          
          <div className="space-y-2">
            <Label htmlFor="equipment-type" className="text-sm">
              Equipment Type
            </Label>
            <Select value={equipment} onValueChange={(value) => setEquipment(value as Equipment)}>
              <SelectTrigger>
                <SelectValue placeholder="Select equipment type" />
              </SelectTrigger>
              <SelectContent>
                {equipmentOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Your primary equipment type for load calculations
            </p>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="revenue-split" className="text-sm">
              Revenue Split Percentage
            </Label>
            <div className="relative">
              <Input
                id="revenue-split"
                type="number"
                value={revenueSplit}
                onChange={(e) => setRevenueSplit(Number(e.target.value))}
                min="0"
                max="100"
                step="5"
                className="pr-8"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                %
              </span>
            </div>
            <p className="text-xs text-muted-foreground">
              Percentage of gross revenue you keep after company split
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="weekly-costs" className="text-sm">
              Weekly Fixed Costs
            </Label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="weekly-costs"
                type="number"
                value={weeklyCosts}
                onChange={(e) => setWeeklyCosts(Number(e.target.value))}
                min="0"
                step="25"
                className="pl-10"
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Truck payment, insurance, escrow, etc. per week
            </p>
          </div>
        </div>

        {/* Impact Preview */}
        {(revenueSplit < 100 || weeklyCosts > 0) && (
          <div className="p-3 bg-muted rounded-lg">
            <div className="text-sm font-medium mb-2">Impact on Your Calculations:</div>
            <div className="space-y-1 text-xs text-muted-foreground">
              {revenueSplit < 100 && (
                <div>• Revenue reduced by {100 - revenueSplit}% after company split</div>
              )}
              {weeklyCosts > 0 && (
                <div>• Fixed costs reduce RPM by ~${weeklyImpactPerMile.toFixed(3)}/mile</div>
              )}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-3 pt-2">
          {onSkip && (
            <Button variant="outline" onClick={onSkip} className="flex-1">
              Skip for Now
            </Button>
          )}
          <Button onClick={handleSave} className="flex-1">
            Save Setup
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}