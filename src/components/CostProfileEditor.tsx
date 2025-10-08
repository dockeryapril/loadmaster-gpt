import { useState } from 'react';
import { Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { useCostProfile } from '@/store/useDecisionStore';

export function CostProfileEditor() {
  const { costProfile, updateCostProfile } = useCostProfile();
  const [localProfile, setLocalProfile] = useState(costProfile);
  const [open, setOpen] = useState(false);

  const handleSave = () => {
    updateCostProfile(localProfile);
    setOpen(false);
  };

  const handleCancel = () => {
    setLocalProfile(costProfile);
    setOpen(false);
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
        
        <div className="mt-6 space-y-6">
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
                value={localProfile.fuelPricePerGallon}
                onChange={(e) => setLocalProfile({ ...localProfile, fuelPricePerGallon: parseFloat(e.target.value) || 0 })}
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
              value={localProfile.averageMPG}
              onChange={(e) => setLocalProfile({ ...localProfile, averageMPG: parseFloat(e.target.value) || 0 })}
              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none"
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
                value={localProfile.dailyFixedCosts}
                onChange={(e) => setLocalProfile({ ...localProfile, dailyFixedCosts: parseFloat(e.target.value) || 0 })}
                className="w-full rounded-lg border border-input bg-background py-2 pl-7 pr-3 text-sm focus:border-primary focus:outline-none"
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
                value={localProfile.variableCostPerMile}
                onChange={(e) => setLocalProfile({ ...localProfile, variableCostPerMile: parseFloat(e.target.value) || 0 })}
                className="w-full rounded-lg border border-input bg-background py-2 pl-7 pr-3 text-sm focus:border-primary focus:outline-none"
              />
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
      </SheetContent>
    </Sheet>
  );
}
