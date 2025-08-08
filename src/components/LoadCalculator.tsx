import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Calculator, Save, X, Camera } from 'lucide-react';
import { Load, LoadCalculationResult, calculateLoadQuality, getWeightImpact, generateSmartTags, calculateProfit } from '@/types/load';
import { useSupabaseSettings } from '@/hooks/useSupabaseSettings';
import { OCRUpload } from './OCRUpload';
import { FieldDetectionResult } from '@/utils/SmartFieldDetector';
import { useToast } from '@/hooks/use-toast';

interface LoadCalculatorProps {
  onSaveLoad?: (load: Omit<Load, 'id' | 'createdAt'>) => void;
  initialData?: Load;
  onClose?: () => void;
}

export function LoadCalculator({ onSaveLoad, initialData, onClose }: LoadCalculatorProps) {
  const { settings } = useSupabaseSettings();
  const { toast } = useToast();
  const [showOCR, setShowOCR] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [ocrResult, setOcrResult] = useState<any>(null);
  
  const [origin, setOrigin] = useState(initialData?.origin || '');
  const [destination, setDestination] = useState(initialData?.destination || '');
  const [miles, setMiles] = useState(initialData?.miles?.toString() || '');
  const [rate, setRate] = useState(initialData?.rate?.toString() || '');
  const [fsc, setFsc] = useState(initialData?.fsc?.toString() || '');
  const [tolls, setTolls] = useState(initialData?.tolls?.toString() || '');
  const [weight, setWeight] = useState(initialData?.weight?.toString() || '');
  const [deadheadMiles, setDeadheadMiles] = useState(initialData?.deadheadMiles?.toString() || '');
  const [fuelCost, setFuelCost] = useState(initialData?.fuelCost?.toString() || '');
  const [notes, setNotes] = useState(initialData?.notes || '');

  const calculateLoad = (): LoadCalculationResult => {
    const milesNum = parseFloat(miles) || 0;
    const rateNum = parseFloat(rate) || 0;
    const fscNum = parseFloat(fsc) || 0;
    const tollsNum = parseFloat(tolls) || 0;
    const deadheadNum = parseFloat(deadheadMiles) || 0;
    const fuelCostNum = parseFloat(fuelCost) || 0;
    const weightNum = parseFloat(weight) || 0;

    const totalMiles = milesNum + deadheadNum;
    const profit = calculateProfit(rateNum, fscNum, tollsNum, fuelCostNum);
    const netRate = profit;
    const rpm = totalMiles > 0 ? netRate / totalMiles : 0;
    const quality = calculateLoadQuality(rpm, settings);
    const weightImpact = getWeightImpact(weightNum, settings);
    
    const loadData = {
      origin,
      destination,
      miles: milesNum,
      rate: rateNum,
      fsc: fscNum,
      tolls: tollsNum,
      weight: weightNum,
      deadheadMiles: deadheadNum,
      fuelCost: fuelCostNum,
      rpm,
      profit
    };
    
    const tags = generateSmartTags(loadData, settings);

    return {
      rpm,
      profit,
      totalMiles,
      netRate,
      quality,
      weightImpact,
      tags
    };
  };

  const getQualityColor = (quality: Load['quality']) => {
    switch (quality) {
      case 'excellent':
        return 'default';
      case 'good':
        return 'default';
      case 'fair':
        return 'secondary';
      case 'poor':
        return 'destructive';
    }
  };

  const getWeightColor = (impact: LoadCalculationResult['weightImpact']) => {
    switch (impact) {
      case 'light':
        return 'default';
      case 'medium':
        return 'secondary';
      case 'heavy':
        return 'secondary';
      case 'overweight':
        return 'destructive';
    }
  };

  const handleSave = () => {
    if (!origin || !destination || !miles || !rate) {
      return;
    }

    const calculation = calculateLoad();
    
    const loadData: Omit<Load, 'id' | 'createdAt'> = {
      origin,
      destination,
      miles: parseFloat(miles),
      rate: parseFloat(rate),
      fsc: parseFloat(fsc) || undefined,
      tolls: parseFloat(tolls) || undefined,
      weight: parseFloat(weight) || undefined,
      deadheadMiles: parseFloat(deadheadMiles) || undefined,
      fuelCost: parseFloat(fuelCost) || undefined,
      rpm: calculation.rpm,
      profit: calculation.profit,
      quality: calculation.quality,
      tags: calculation.tags,
      notes
    };

    onSaveLoad?.(loadData);
  };

  const handleOCRText = (extractedText: string) => {
    // Simple parsing logic - can be enhanced based on common load board formats
    const text = extractedText.toLowerCase();
    
    // Try to extract common patterns
    const milesMatch = text.match(/(\d+)\s*mi/);
    const rateMatch = text.match(/\$(\d+(?:,\d+)?(?:\.\d{2})?)/);
    const weightMatch = text.match(/(\d+(?:,\d+)?)\s*lbs?/);
    
    if (milesMatch) setMiles(milesMatch[1]);
    if (rateMatch) setRate(rateMatch[1].replace(',', ''));
    if (weightMatch) setWeight(weightMatch[1].replace(',', ''));
  };

  const handleFieldsDetected = (result: FieldDetectionResult) => {
    // Auto-fill form fields based on AI detection
    result.detectedFields.forEach(field => {
      const value = field.value.replace(/[$,]/g, ''); // Clean currency/comma formatting
      
      switch (field.field) {
        case 'miles':
          setMiles(value);
          break;
        case 'rate':
          setRate(value);
          break;
        case 'origin':
          setOrigin(field.value);
          break;
        case 'destination':
          setDestination(field.value);
          break;
        case 'deadhead':
          setDeadheadMiles(value);
          break;
        case 'weight':
          setWeight(value);
          break;
        case 'fsc':
          setFsc(value);
          break;
        case 'tolls':
          setTolls(value);
          break;
      }
    });
    
    setOcrResult(result);
    setShowOCR(false);
    
    toast({
      title: "Fields auto-filled!",
      description: `${result.detectedFields.length} fields detected and filled automatically.`,
    });
  };

  const calculation = calculateLoad();

  return (
    <div className="space-y-6">
        {showOCR && (
          <OCRUpload
            onTextExtracted={handleOCRText}
            onFieldsDetected={handleFieldsDetected}
            isProcessing={isProcessing}
            setIsProcessing={setIsProcessing}
          />
        )}
      
      <Card className="gradient-card border-0">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center justify-between text-foreground">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-primary/20">
                <Calculator className="h-5 w-5 text-primary" />
              </div>
              Load Calculator
            </div>
            <Button
              onClick={() => setShowOCR(!showOCR)}
              variant="ghost"
              size="sm"
              disabled={isProcessing}
            >
              <Camera className="h-4 w-4" />
            </Button>
          </CardTitle>
        </CardHeader>
        
        <CardContent className="space-y-4">
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="origin">Origin</Label>
                <Input
                  id="origin"
                  value={origin}
                  onChange={(e) => setOrigin(e.target.value)}
                  placeholder="City, State"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="destination">Destination</Label>
                <Input
                  id="destination"
                  value={destination}
                  onChange={(e) => setDestination(e.target.value)}
                  placeholder="City, State"
                />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="miles">Miles</Label>
                <Input
                  id="miles"
                  type="number"
                  value={miles}
                  onChange={(e) => setMiles(e.target.value)}
                  placeholder="450"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="deadheadMiles">Deadhead Miles</Label>
                <Input
                  id="deadheadMiles"
                  type="number"
                  value={deadheadMiles}
                  onChange={(e) => setDeadheadMiles(e.target.value)}
                  placeholder="50"
                />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="rate">Rate ($)</Label>
                <Input
                  id="rate"
                  type="number"
                  step="0.01"
                  value={rate}
                  onChange={(e) => setRate(e.target.value)}
                  placeholder="2500.00"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="fsc">FSC ($)</Label>
                <Input
                  id="fsc"
                  type="number"
                  step="0.01"
                  value={fsc}
                  onChange={(e) => setFsc(e.target.value)}
                  placeholder="250.00"
                />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="tolls">Tolls ($)</Label>
                <Input
                  id="tolls"
                  type="number"
                  step="0.01"
                  value={tolls}
                  onChange={(e) => setTolls(e.target.value)}
                  placeholder="85.00"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="weight">Weight (lbs)</Label>
                <Input
                  id="weight"
                  type="number"
                  value={weight}
                  onChange={(e) => setWeight(e.target.value)}
                  placeholder="45000"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="fuelCost">Fuel Cost ($)</Label>
              <Input
                id="fuelCost"
                type="number"
                step="0.01"
                value={fuelCost}
                onChange={(e) => setFuelCost(e.target.value)}
                placeholder="350.00"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Additional notes about this load..."
                rows={2}
              />
            </div>
          </div>
          
          <div className="bg-muted/50 rounded-lg p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-medium">Revenue Per Mile</span>
              <div className="text-right">
                <div className="text-2xl font-bold">${calculation.rpm.toFixed(2)}</div>
                <Badge variant={getQualityColor(calculation.quality)} className="text-xs">
                  {calculation.quality}
                </Badge>
              </div>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="font-medium">Estimated Profit</span>
              <div className="text-right">
                <div className="text-xl font-bold text-success">${calculation.profit.toFixed(2)}</div>
              </div>
            </div>
            
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div>
                <div className="text-muted-foreground">Total Miles</div>
                <div className="font-medium">{calculation.totalMiles}</div>
              </div>
              <div>
                <div className="text-muted-foreground">Net Rate</div>
                <div className="font-medium">${calculation.netRate.toFixed(2)}</div>
              </div>
              <div>
                <div className="text-muted-foreground">Weight Impact</div>
                <Badge variant={getWeightColor(calculation.weightImpact)} className="text-xs">
                  {calculation.weightImpact}
                </Badge>
              </div>
            </div>
            
            {calculation.tags.length > 0 && (
              <div className="space-y-2">
                <div className="text-sm text-muted-foreground">Smart Tags</div>
                <div className="flex flex-wrap gap-1">
                  {calculation.tags.map((tag, index) => (
                    <Badge key={index} variant="outline" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
          
          <div className="flex gap-3">
            {onClose && (
              <Button variant="outline" onClick={onClose} className="flex-1">
                <X className="mr-2 h-4 w-4" />
                Cancel
              </Button>
            )}
            
            <Button
              onClick={handleSave}
              disabled={!origin || !destination || !miles || !rate}
              className="flex-1 gradient-primary border-0"
            >
              <Save className="mr-2 h-4 w-4" />
              Save Load
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}