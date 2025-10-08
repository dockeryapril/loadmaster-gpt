import { useState, useEffect } from 'react';
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
import { ScrollArea } from '@/components/ui/scroll-area';
import { useCostProfile } from '@/store/useDecisionStore';

export function CostProfileEditor() {
  const { costProfile, updateCostProfile } = useCostProfile();
  const [localProfile, setLocalProfile] = useState(costProfile);
  const [editingValues, setEditingValues] = useState({
    fuelPricePerGallon: String(costProfile.fuelPricePerGallon),
    averageMPG: String(costProfile.averageMPG),
    dailyFixedCosts: String(costProfile.dailyFixedCosts),
    variableCostPerMile: String(costProfile.variableCostPerMile),
  });
  const [open, setOpen] = useState(false);

  // Sync local state with store when sheet opens
  useEffect(() => {
    if (open) {
      setLocalProfile(costProfile);
      setEditingValues({
        fuelPricePerGallon: costProfile.fuelPricePerGallon.toFixed(2),
        averageMPG: String(costProfile.averageMPG),
        dailyFixedCosts: String(costProfile.dailyFixedCosts),
        variableCostPerMile: costProfile.variableCostPerMile.toFixed(2),
      });
    }
  }, [open, costProfile]);

  const handleSave = () => {
    updateCostProfile({
      fuelPricePerGallon: parseFloat(editingValues.fuelPricePerGallon) || 3.89,
      averageMPG: parseFloat(editingValues.averageMPG) || 6.5,
      dailyFixedCosts: parseFloat(editingValues.dailyFixedCosts) || 250,
      variableCostPerMile: parseFloat(editingValues.variableCostPerMile) || 0.35,
    });
    setOpen(false);
  };

  const handleCancel = () => {
    setLocalProfile(costProfile);
    setEditingValues({
      fuelPricePerGallon: costProfile.fuelPricePerGallon.toFixed(2),
      averageMPG: String(costProfile.averageMPG),
      dailyFixedCosts: String(costProfile.dailyFixedCosts),
      variableCostPerMile: costProfile.variableCostPerMile.toFixed(2),
    });
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
        
        <ScrollArea className="h-[calc(90vh-120px)] sm:h-[calc(80vh-180px)]">
          <div className="mt-6 space-y-6 pr-4">
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
                  value={editingValues.dailyFixedCosts}
                  onChange={(e) => setEditingValues({ ...editingValues, dailyFixedCosts: e.target.value })}
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
                  value={editingValues.variableCostPerMile}
                  onChange={(e) => setEditingValues({ ...editingValues, variableCostPerMile: e.target.value })}
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
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
