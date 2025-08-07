import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Calculator, MapPin, DollarSign, Truck, Weight, Fuel } from 'lucide-react';
import { Load, LoadCalculationResult, calculateLoadQuality, getWeightImpact } from '@/types/load';

interface LoadCalculatorProps {
  onSaveLoad?: (load: Omit<Load, 'id' | 'createdAt'>) => void;
  initialData?: Partial<Load>;
  onClose?: () => void;
}

export function LoadCalculator({ onSaveLoad, initialData, onClose }: LoadCalculatorProps) {
  const [origin, setOrigin] = useState(initialData?.origin || '');
  const [destination, setDestination] = useState(initialData?.destination || '');
  const [miles, setMiles] = useState(initialData?.miles?.toString() || '');
  const [rate, setRate] = useState(initialData?.rate?.toString() || '');
  const [weight, setWeight] = useState(initialData?.weight?.toString() || '');
  const [deadheadMiles, setDeadheadMiles] = useState(initialData?.deadheadMiles?.toString() || '');
  const [fuelCost, setFuelCost] = useState(initialData?.fuelCost?.toString() || '');
  const [notes, setNotes] = useState(initialData?.notes || '');

  const calculateLoad = (): LoadCalculationResult | null => {
    const milesNum = parseFloat(miles);
    const rateNum = parseFloat(rate);
    const deadheadNum = parseFloat(deadheadMiles) || 0;
    const fuelNum = parseFloat(fuelCost) || 0;
    const weightNum = parseFloat(weight) || 0;

    if (!milesNum || !rateNum) return null;

    const totalMiles = milesNum + deadheadNum;
    const netRate = rateNum - fuelNum;
    const rpm = totalMiles > 0 ? netRate / totalMiles : 0;
    const quality = calculateLoadQuality(rpm);
    const weightImpact = getWeightImpact(weightNum);

    return {
      rpm,
      totalMiles,
      netRate,
      quality,
      weightImpact
    };
  };

  const result = calculateLoad();

  const getQualityColor = (quality: Load['quality']) => {
    switch (quality) {
      case 'excellent':
        return 'gradient-success';
      case 'good':
        return 'bg-success';
      case 'fair':
        return 'gradient-warning';
      case 'poor':
        return 'gradient-danger';
    }
  };

  const getWeightColor = (impact: LoadCalculationResult['weightImpact']) => {
    switch (impact) {
      case 'light':
        return 'bg-success';
      case 'medium':
        return 'bg-warning';
      case 'heavy':
        return 'gradient-warning';
      case 'overweight':
        return 'gradient-danger';
    }
  };

  const handleSave = () => {
    if (!result || !onSaveLoad) return;

    const loadData: Omit<Load, 'id' | 'createdAt'> = {
      origin,
      destination,
      miles: parseFloat(miles),
      rate: parseFloat(rate),
      weight: weight ? parseFloat(weight) : undefined,
      deadheadMiles: deadheadMiles ? parseFloat(deadheadMiles) : undefined,
      fuelCost: fuelCost ? parseFloat(fuelCost) : undefined,
      rpm: result.rpm,
      quality: result.quality,
      notes: notes || undefined
    };

    onSaveLoad(loadData);
  };

  const isValid = result && origin && destination;

  return (
    <Card className="p-6 space-y-6 gradient-card">
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-primary/20">
          <Calculator className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h2 className="text-xl font-bold">Load Calculator</h2>
          <p className="text-sm text-muted-foreground">Calculate your Revenue Per Mile</p>
        </div>
      </div>

      <div className="grid gap-4">
        {/* Route Information */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-sm font-medium">
            <MapPin className="h-4 w-4 text-primary" />
            Route Details
          </div>
          <div className="grid gap-3">
            <div>
              <Label htmlFor="origin">Pickup Location</Label>
              <Input
                id="origin"
                placeholder="City, State"
                value={origin}
                onChange={(e) => setOrigin(e.target.value)}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="destination">Delivery Location</Label>
              <Input
                id="destination"
                placeholder="City, State"
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
                className="mt-1"
              />
            </div>
          </div>
        </div>

        {/* Financial Information */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-sm font-medium">
            <DollarSign className="h-4 w-4 text-primary" />
            Payment & Costs
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="rate">Load Rate ($)</Label>
              <Input
                id="rate"
                type="number"
                placeholder="2500"
                value={rate}
                onChange={(e) => setRate(e.target.value)}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="fuelCost">Fuel Cost ($)</Label>
              <Input
                id="fuelCost"
                type="number"
                placeholder="350"
                value={fuelCost}
                onChange={(e) => setFuelCost(e.target.value)}
                className="mt-1"
              />
            </div>
          </div>
        </div>

        {/* Distance & Weight */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-sm font-medium">
            <Truck className="h-4 w-4 text-primary" />
            Distance & Load Details
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="miles">Loaded Miles</Label>
              <Input
                id="miles"
                type="number"
                placeholder="450"
                value={miles}
                onChange={(e) => setMiles(e.target.value)}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="deadheadMiles">Deadhead Miles</Label>
              <Input
                id="deadheadMiles"
                type="number"
                placeholder="50"
                value={deadheadMiles}
                onChange={(e) => setDeadheadMiles(e.target.value)}
                className="mt-1"
              />
            </div>
            <div className="col-span-2">
              <Label htmlFor="weight">Load Weight (lbs)</Label>
              <Input
                id="weight"
                type="number"
                placeholder="45000"
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
                className="mt-1"
              />
            </div>
          </div>
        </div>

        {/* Notes */}
        <div>
          <Label htmlFor="notes">Notes (Optional)</Label>
          <Textarea
            id="notes"
            placeholder="Special requirements, equipment needed, etc."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="mt-1 resize-none"
            rows={2}
          />
        </div>
      </div>

      {/* Results */}
      {result && (
        <div className="space-y-4 p-4 rounded-lg border bg-card/50">
          <h3 className="font-semibold text-lg">Load Analysis</h3>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center">
              <div className={`p-3 rounded-lg ${getQualityColor(result.quality)}`}>
                <div className="text-2xl font-bold text-white">
                  ${result.rpm.toFixed(2)}
                </div>
                <div className="text-sm text-white/90">Revenue Per Mile</div>
              </div>
              <Badge className="mt-2" variant={result.quality === 'excellent' || result.quality === 'good' ? 'default' : 'destructive'}>
                {result.quality.toUpperCase()}
              </Badge>
            </div>

            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Total Miles:</span>
                <span className="font-medium">{result.totalMiles}</span>
              </div>
              <div className="flex justify-between">
                <span>Net Revenue:</span>
                <span className="font-medium">${result.netRate.toLocaleString()}</span>
              </div>
              {weight && (
                <div className="flex justify-between items-center">
                  <span>Weight Impact:</span>
                  <Badge className={getWeightColor(result.weightImpact)}>
                    {result.weightImpact}
                  </Badge>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-3">
        {onClose && (
          <Button variant="outline" onClick={onClose} className="flex-1">
            Cancel
          </Button>
        )}
        <Button 
          onClick={handleSave}
          disabled={!isValid}
          className="flex-1 gradient-primary border-0"
        >
          Save Load
        </Button>
      </div>
    </Card>
  );
}