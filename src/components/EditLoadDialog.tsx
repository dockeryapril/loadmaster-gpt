import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { LoadEntrySnapshot, DecisionOutcome } from '@/types/mvp';
import { decisionLabels } from '@/store/useDecisionStore';

interface EditLoadDialogProps {
  entry: LoadEntrySnapshot;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (updates: Partial<Omit<LoadEntrySnapshot, 'id' | 'createdAt'>>) => void;
}

export function EditLoadDialog({ entry, open, onOpenChange, onSave }: EditLoadDialogProps) {
  const [formData, setFormData] = useState({
    origin: entry.origin,
    destination: entry.destination,
    miles: entry.miles.toString(),
    rate: entry.rate.toString(),
    fsc: entry.fsc.toString(),
    tolls: entry.tolls.toString(),
    fuelCost: entry.fuelCost.toString(),
    outcome: entry.outcome,
    counterResult: entry.counterResult || 'pending',
    finalRate: entry.finalRate?.toString() || entry.rate.toString(),
    notes: entry.notes || '',
  });

  const handleSave = () => {
    const miles = parseFloat(formData.miles) || 0;
    const rate = parseFloat(formData.rate) || 0;
    const fsc = parseFloat(formData.fsc) || 0;
    const tolls = parseFloat(formData.tolls) || 0;
    const fuelCost = parseFloat(formData.fuelCost) || 0;
    const finalRate = formData.outcome === 'counter' ? (parseFloat(formData.finalRate) || rate) : undefined;

    // Use finalRate for revenue if it's a counter, otherwise use original rate
    const effectiveRate = finalRate !== undefined ? finalRate : rate;
    const totalRevenue = effectiveRate + fsc;
    const totalCosts = fuelCost + tolls;
    const profit = totalRevenue - totalCosts;
    const rpm = miles > 0 ? profit / miles : 0;

    onSave({
      origin: formData.origin,
      destination: formData.destination,
      miles,
      rate,
      fsc,
      tolls,
      fuelCost,
      profit,
      rpm,
      outcome: formData.outcome,
      counterResult: formData.outcome === 'counter' ? formData.counterResult : undefined,
      finalRate,
      notes: formData.notes || undefined,
    });

    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit load entry</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-4">
          <div className="space-y-2">
            <Label htmlFor="outcome">Decision</Label>
            <Select value={formData.outcome} onValueChange={(value) => setFormData({ ...formData, outcome: value as DecisionOutcome })}>
              <SelectTrigger id="outcome">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(decisionLabels).map(([key, label]) => (
                  <SelectItem key={key} value={key}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {formData.outcome === 'counter' && (
            <>
              <div className="space-y-2">
                <Label htmlFor="counterResult">Counter offer result</Label>
                <Select value={formData.counterResult} onValueChange={(value) => setFormData({ ...formData, counterResult: value as any })}>
                  <SelectTrigger id="counterResult">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="accepted">✓ Accepted</SelectItem>
                    <SelectItem value="declined">✗ Declined</SelectItem>
                    <SelectItem value="pending">⏳ Pending</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="finalRate">Final negotiated rate ($)</Label>
                <Input
                  id="finalRate"
                  type="number"
                  step="0.01"
                  value={formData.finalRate}
                  onChange={(e) => setFormData({ ...formData, finalRate: e.target.value })}
                  placeholder="Enter final rate if different"
                />
              </div>
            </>
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="origin">Origin</Label>
              <Input
                id="origin"
                value={formData.origin}
                onChange={(e) => setFormData({ ...formData, origin: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="destination">Destination</Label>
              <Input
                id="destination"
                value={formData.destination}
                onChange={(e) => setFormData({ ...formData, destination: e.target.value })}
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="miles">Miles</Label>
              <Input
                id="miles"
                type="number"
                step="0.1"
                value={formData.miles}
                onChange={(e) => setFormData({ ...formData, miles: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="rate">Rate ($)</Label>
              <Input
                id="rate"
                type="number"
                step="0.01"
                value={formData.rate}
                onChange={(e) => setFormData({ ...formData, rate: e.target.value })}
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="fsc">FSC ($)</Label>
              <Input
                id="fsc"
                type="number"
                step="0.01"
                value={formData.fsc}
                onChange={(e) => setFormData({ ...formData, fsc: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="tolls">Tolls ($)</Label>
              <Input
                id="tolls"
                type="number"
                step="0.01"
                value={formData.tolls}
                onChange={(e) => setFormData({ ...formData, tolls: e.target.value })}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="fuelCost">Fuel cost ($)</Label>
            <Input
              id="fuelCost"
              type="number"
              step="0.01"
              value={formData.fuelCost}
              onChange={(e) => setFormData({ ...formData, fuelCost: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={3}
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave}>
              Save changes
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
