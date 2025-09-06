import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calculator, Truck, TrendingUp, Crown, LogIn, ExternalLink, History, BarChart3, LayoutDashboard, Upload, ArrowLeft } from 'lucide-react';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { useAuth } from '@/contexts/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '@loadmaster/api';
import { logEvent } from '@/utils/metrics';
import { useEquipment } from '@/hooks/useEquipment';
import { getEquipmentRPMTargets, equipmentDefaults } from '../../packages/engine/src/equipmentProfiles';
import { UpgradeCard } from '@/components/UpgradeCard';
import { LoadEntryMethod } from '@/components/LoadEntryMethod';
import { FieldDetectionResult } from '@/utils/SmartFieldDetector';
import type { Equipment } from '@/types/equipment';


// Equipment-aware negotiation logic for LITE version
const calculateNegotiation = (miles: number, rate: number, weight?: number, equipment: Equipment = 'cargo_van') => {
  const ratePerMile = rate / miles;
  const anchor = rate * 1.15; // 15% above offer
  const target = rate * 1.08; // 8% above offer
  const floor = rate * 0.98; // 2% below offer
  
  const premiums = [];
  if (weight && weight > 45000) premiums.push('Heavy Load');
  if (ratePerMile < 1.5) premiums.push('Low Rate Lane');
  
  // Get equipment-specific RPM targets for quality assessment
  const rpmTargets = getEquipmentRPMTargets(equipment);
  const equipmentInfo = equipmentDefaults[equipment];
  
  let qualityNote = '';
  if (ratePerMile >= rpmTargets.green) {
    qualityNote = 'Excellent rate for your equipment';
  } else if (ratePerMile >= rpmTargets.yellow) {
    qualityNote = 'Good rate - above industry average';
  } else if (ratePerMile >= rpmTargets.red) {
    qualityNote = 'Fair rate - consider negotiating higher';
  } else {
    qualityNote = 'Below average - negotiate strongly';
  }
  
  return {
    anchor_rate: Math.round(anchor),
    target_rate: Math.round(target),
    floor_rate: Math.round(floor),
    premiums_applied: premiums,
    suggested_strategy: 'Negotiate higher',
    quality_note: qualityNote,
    equipment_context: `${equipment.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())} avg: $${equipmentInfo.rpmTargets.yellow.toFixed(2)}/mi`
  };
};

const generateMessage = (miles: number, offer: number, target: number) => ({
  subject: `Rate Negotiation - ${miles} miles`,
  message: `Hi, I can move this ${miles} mile load. Based on current market conditions, I'd need $${target} to make this work. Can we discuss?`
});

interface HistoryItem {
  id: string;
  miles: number;
  offerAllIn: number;
  weightLbs?: number;
  pickupInHours?: number;
  weekend: boolean;
  targetAllIn: number;
  anchorAllIn: number;
  floorAllIn: number;
  premiums: string[];
  strategy: string;
  timestamp: number;
}

const DEFAULT_USER_SETTINGS = {
  rpmThresholds: {
    excellent: 2.5,
    good: 2.0,
    fair: 1.5
  }
};

const Core = () => {
  const [miles, setMiles] = useState('');
  const [offerAllIn, setOfferAllIn] = useState('');
  const [weightLbs, setWeightLbs] = useState('');
  const [pickupInHours, setPickupInHours] = useState('');
  const [weekend, setWeekend] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [history, setHistory] = useLocalStorage<HistoryItem[]>('lm_core_history_v1', []);
  const [showHistory, setShowHistory] = useState(false);
  const [entryMethod, setEntryMethod] = useState<'select' | 'ocr' | 'manual'>('select');
  
  const { user, loading: authLoading } = useAuth();
  const { equipment, setEquipment } = useEquipment();
  // This is the LITE page - always LITE tier
  const plan = 'free' as const;
  const isPro = false;
  const planLoading = false;
  const navigate = useNavigate();

  const handleCalculate = () => {
    const milesNum = parseFloat(miles);
    const offerNum = parseFloat(offerAllIn);
    const weightNum = weightLbs ? parseFloat(weightLbs) : undefined;

    if (!milesNum || !offerNum) return;

    const loadData = {
      miles: milesNum,
      rate: offerNum,
      weight: weightNum,
      notes: weekend ? 'weekend pickup' : ''
    };

    const calculation = calculateNegotiation(milesNum, offerNum, weightNum, equipment);
    const message = generateMessage(milesNum, offerNum, calculation.anchor_rate);

    const historyItem: HistoryItem = {
      id: Date.now().toString(),
      miles: milesNum,
      offerAllIn: offerNum,
      weightLbs: weightNum,
      pickupInHours: pickupInHours ? parseFloat(pickupInHours) : undefined,
      weekend,
      targetAllIn: calculation.target_rate,
      anchorAllIn: calculation.anchor_rate,
      floorAllIn: calculation.floor_rate,
      premiums: calculation.premiums_applied,
      strategy: calculation.suggested_strategy,
      timestamp: Date.now(),
    };

    setHistory(prev => [historyItem, ...prev.slice(0, 4)]);
    setResult({ calculation, message, historyItem });
    setShowResult(true);
  };

  const handleReset = () => {
    setMiles('');
    setOfferAllIn('');
    setWeightLbs('');
    setPickupInHours('');
    setWeekend(false);
    setShowResult(false);
    setResult(null);
    setEntryMethod('select');
  };

  const handleFieldsDetected = (detectionResult: FieldDetectionResult) => {
    // Populate form fields from OCR results
    detectionResult.detectedFields.forEach(field => {
      switch (field.field) {
        case 'miles':
          setMiles(field.value.replace(/[^0-9.]/g, ''));
          break;
        case 'rate':
          setOfferAllIn(field.value.replace(/[^0-9.]/g, ''));
          break;
        case 'weight':
          setWeightLbs(field.value.replace(/[^0-9.]/g, ''));
          break;
        // Add other fields as needed
      }
    });
    setEntryMethod('manual'); // Switch to manual form after OCR
  };

  const handleManualEntry = () => {
    setEntryMethod('manual');
  };

  const handleSignIn = () => {
    navigate('/auth');
  };

  const handleUpgradeToPro = async () => {
    const timestamp = new Date().toISOString();
    try {
      await supabase
        .from('user_settings')
        .update({
          plan: 'pro',
          plan_changed_at: timestamp,
          plan_change_source: 'core_upgrade_button'
        });
      await logEvent('plan_change', {
        from: plan,
        to: 'pro',
        source: 'core_upgrade_button',
        timestamp
      });
    } catch (err) {
      /* ignore analytics errors */
    }
    navigate('/');
  };

  const handleOpenProApp = () => {
    navigate('/');
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-primary rounded-xl flex items-center justify-center mx-auto mb-4 animate-pulse">
            <Truck className="h-8 w-8 text-primary-foreground" />
          </div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-md mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center">
              <LayoutDashboard className="h-6 w-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-xl font-bold">LoadMasterLITE</h1>
              <p className="text-sm text-muted-foreground">Your Smart Load Rate Calculator</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {!user && (
              <Button variant="ghost" size="sm" onClick={handleSignIn}>
                <LogIn className="h-4 w-4 mr-2" />
                Sign In
              </Button>
            )}
            
            {user && !isPro && (
              <Button variant="outline" size="sm" onClick={handleUpgradeToPro}>
                <Crown className="h-4 w-4 mr-2" />
                Upgrade to PRO
              </Button>
            )}
            
            {user && isPro && (
              <Button variant="default" size="sm" onClick={handleOpenProApp}>
                <ExternalLink className="h-4 w-4 mr-2" />
                PRO App
              </Button>
            )}
          </div>
        </div>

        {/* Quick Equipment Setup */}
        <Card className="mb-6">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Equipment Type</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="grid grid-cols-3 gap-2">
              {(['cargo_van', 'straight_truck', 'hotshot'] as Equipment[]).map((type) => {
                const isSelected = equipment === type;
                const info = equipmentDefaults[type];
                const displayName = type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
                return (
                  <Button
                    key={type}
                    variant={isSelected ? "default" : "outline"}
                    size="sm"
                    onClick={() => setEquipment(type)}
                    className="h-auto p-3 flex flex-col gap-1"
                  >
                    <span className="font-medium text-xs">{displayName}</span>
                    <span className="text-xs opacity-80">
                      Avg: ${info.rpmTargets.yellow.toFixed(2)}/mi
                    </span>
                  </Button>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Navigation */}
        <div className="flex gap-2 mb-6">
          <Button
            variant={!showHistory ? "default" : "outline"}
            onClick={() => {
              setShowHistory(false);
              setEntryMethod('select');
            }}
            className="flex-1"
          >
            <Calculator className="h-4 w-4 mr-2" />
            Calculate
          </Button>
          <Button
            variant={showHistory ? "default" : "outline"}
            onClick={() => setShowHistory(true)}
            className="flex-1"
          >
            <History className="h-4 w-4 mr-2" />
            Recent ({history.length})
          </Button>
        </div>

        {showHistory ? (
          <div className="space-y-4">
            {history.length === 0 ? (
              <Card>
                <CardContent className="pt-6 text-center">
                  <BarChart3 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="font-semibold mb-2">No calculations yet</h3>
                  <p className="text-sm text-muted-foreground mb-4">Your recent calculations will appear here</p>
                  <Button onClick={() => setShowHistory(false)}>
                    <Calculator className="h-4 w-4 mr-2" />
                    Start Calculating
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {history.map((item) => (
                  <Card key={item.id}>
                    <CardContent className="pt-4">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <p className="font-semibold">{item.miles} miles @ ${item.offerAllIn.toFixed(2)}</p>
                          <p className="text-sm text-muted-foreground">
                            {new Date(item.timestamp).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-muted-foreground">Settle For</p>
                          <p className="font-semibold text-primary">${item.targetAllIn.toFixed(2)}</p>
                        </div>
                      </div>
                       <div className="flex gap-4 text-xs text-muted-foreground">
                         <span>Ask: ${item.anchorAllIn.toFixed(2)}</span>
                         <span>Bottom Line: ${item.floorAllIn.toFixed(2)}</span>
                       </div>
                      {item.premiums.length > 0 && (
                        <div className="mt-2">
                          <div className="flex flex-wrap gap-1">
                            {item.premiums.map((premium, idx) => (
                              <span key={idx} className="text-xs bg-primary/10 text-primary px-2 py-1 rounded">
                                {premium}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        ) : showResult ? (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Negotiation Strategy
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                 <div className="grid grid-cols-3 gap-4 text-center">
                   <div>
                     <p className="text-sm text-muted-foreground">Ask</p>
                     <p className="text-xl font-bold text-primary">${result.calculation.anchor_rate.toFixed(2)}</p>
                   </div>
                   <div>
                     <p className="text-sm text-muted-foreground">Settle For</p>
                     <p className="text-xl font-bold">${result.calculation.target_rate.toFixed(2)}</p>
                   </div>
                   <div>
                     <p className="text-sm text-muted-foreground">Bottom Line</p>
                     <p className="text-xl font-bold text-muted-foreground">${result.calculation.floor_rate.toFixed(2)}</p>
                   </div>
                 </div>
                
                {result.calculation.premiums_applied.length > 0 && (
                  <div>
                    <p className="text-sm text-muted-foreground mb-2">Applied Premiums:</p>
                    <div className="flex flex-wrap gap-2">
                      {result.calculation.premiums_applied.map((premium: string, idx: number) => (
                        <span key={idx} className="text-xs bg-primary/10 text-primary px-2 py-1 rounded">
                          {premium}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                
                {/* Equipment Context & Quality */}
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">{result.calculation.equipment_context}</p>
                  <div className="bg-primary/5 border border-primary/20 p-3 rounded">
                    <p className="text-sm font-medium text-primary">{result.calculation.quality_note}</p>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">Suggested Message:</p>
                  <div className="bg-muted p-3 rounded text-sm">
                    <p className="font-semibold mb-1">Subject: {result.message.subject}</p>
                    <p>{result.message.message}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Button onClick={handleReset} className="w-full">
              Calculate Another Load
            </Button>
          </div>
        ) : entryMethod === 'ocr' ? (
          <div className="space-y-4">
            <Button 
              variant="ghost" 
              onClick={() => setEntryMethod('select')}
              className="mb-4"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Manual Entry
            </Button>
            <LoadEntryMethod
              onFieldsDetected={handleFieldsDetected}
              onManualEntry={handleManualEntry}
              isPro={isPro}
            />
          </div>
        ) : entryMethod === 'select' ? (
          <Card>
            <CardContent className="pt-6 space-y-4">
              <div className="space-y-3">
                <Button 
                  onClick={() => setEntryMethod('ocr')}
                  className="w-full h-auto p-4 flex flex-col gap-2"
                  variant="outline"
                >
                  <Upload className="h-6 w-6" />
                  <span className="font-medium">Upload Image / Take Photo</span>
                  <span className="text-xs text-muted-foreground">
                    Automatically extract load details with OCR
                  </span>
                </Button>
                
                <Button 
                  onClick={() => setEntryMethod('manual')}
                  className="w-full h-auto p-4 flex flex-col gap-2"
                  variant="outline"
                >
                  <Calculator className="h-6 w-6" />
                  <span className="font-medium">Enter Details Manually</span>
                  <span className="text-xs text-muted-foreground">
                    Type in load information yourself
                  </span>
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            <Button 
              variant="ghost" 
              onClick={() => setEntryMethod('select')}
              className="mb-4"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Options
            </Button>
            
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calculator className="h-5 w-5" />
                  Rate Calculator
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium mb-1 block">Miles</label>
                    <Input
                      type="number"
                      placeholder="0"
                      value={miles}
                      onChange={(e) => setMiles(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1 block">Offer (All-in)</label>
                    <Input
                      type="number"
                      placeholder="0"
                      value={offerAllIn}
                      onChange={(e) => setOfferAllIn(e.target.value)}
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium mb-1 block">Weight (lbs)</label>
                    <Input
                      type="number"
                      placeholder="0"
                      value={weightLbs}
                      onChange={(e) => setWeightLbs(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1 block">Pickup (hours)</label>
                    <Input
                      type="number"
                      placeholder="0"
                      value={pickupInHours}
                      onChange={(e) => setPickupInHours(e.target.value)}
                    />
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="weekend"
                    checked={weekend}
                    onChange={(e) => setWeekend(e.target.checked)}
                    className="rounded border-border"
                  />
                  <label htmlFor="weekend" className="text-sm">Weekend pickup</label>
                </div>
                
                <Button 
                  onClick={handleCalculate} 
                  className="w-full"
                  disabled={!miles || !offerAllIn}
                >
                  Calculate Negotiation Strategy
                </Button>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Upgrade Card - shown when not in history and not showing results */}
        {!showHistory && !showResult && (
          <div className="mt-6">
            <UpgradeCard />
          </div>
        )}
        
        {/* Footer */}
        <div className="mt-12 text-center text-sm text-muted-foreground">
          <p>LoadMasterLITE - Free Forever</p>
          <p className="mt-2">
            Want more?{' '}
            <Link to="/upgrade" className="underline">
              Unlock AI-powered negotiations
            </Link>{' '}
            and smarter load insights with LoadMasterPRO.
          </p>
          {!user && (
            <p className="mt-2">
              <Button variant="link" onClick={handleSignIn} className="text-xs">
                Sign in for full features
              </Button>
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

// Export the Core component
export default Core;