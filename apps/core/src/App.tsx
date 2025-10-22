import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calculator, Truck, TrendingUp, Crown, LogIn, ExternalLink, History, BarChart3, Camera } from 'lucide-react';
import { LiteOCRInterface } from '@/components/LiteOCRInterface';
import { SuccessScreen } from '@/components/SuccessScreen';
import { computeCalc, suggestTemplates } from '@loadmaster/engine';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { useAuth } from '@/hooks/useAuth';
import { usePlan } from '@/hooks/usePlan';
import { HistoryItem } from '@/types';
import { supabase } from '@/integrations/supabase/client';
import { logEvent } from '@/utils/metrics';

function App() {
  const [miles, setMiles] = useState('');
  const [offerAllIn, setOfferAllIn] = useState('');
  const [weightLbs, setWeightLbs] = useState('');
  const [pickupInHours, setPickupInHours] = useState('');
  const [weekend, setWeekend] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [history, setHistory] = useLocalStorage<HistoryItem[]>('lm_core_history_v1', []);
  const [showHistory, setShowHistory] = useState(false);
  const [showOCR, setShowOCR] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  
  const { user, loading: authLoading } = useAuth();
  const { plan, isPro, loading: planLoading } = usePlan();

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

    const loadFields = {
      distanceMi: milesNum,
      offerFlat: offerNum,
      weightLbs: weightNum,
      equipment: 'straight_truck' as const,
      weekend: weekend
    };

    const margins = { anchorPct: 15, targetPct: 10, floorPct: 5 };
    
    const calculation = computeCalc(loadFields, margins);

    if (!calculation) return;

    const templates = suggestTemplates(loadFields, calculation);
    const message = templates && templates.length > 0 ? templates[0] : { subject: 'Rate Request', message: 'Looking to negotiate a better rate for this load.' };

    const historyItem: HistoryItem = {
      id: Date.now().toString(),
      miles: milesNum,
      offerAllIn: offerNum,
      weightLbs: weightNum,
      pickupInHours: pickupInHours ? parseFloat(pickupInHours) : undefined,
      weekend,
      targetAllIn: calculation.negotiation.target,
      anchorAllIn: calculation.negotiation.anchor,
      floorAllIn: calculation.negotiation.floor,
      premiums: Object.entries(calculation.surcharges).filter(([_, value]) => value > 0).map(([key, _]) => key),
      strategy: 'standard',
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
    setShowOCR(false);
    setShowSuccess(false);
  };

  const handleOCRSuccess = (extractedData: any) => {
    // Populate form fields with extracted data
    if (extractedData.miles) setMiles(extractedData.miles);
    if (extractedData.offerAllIn) setOfferAllIn(extractedData.offerAllIn);
    if (extractedData.weightLbs) setWeightLbs(extractedData.weightLbs);
    if (extractedData.pickupInHours) setPickupInHours(extractedData.pickupInHours);
    
    setShowOCR(false);
    // Don't show success screen - go directly to calculator with populated data
  };

  const handleBackToCalculator = () => {
    setShowSuccess(false);
    setShowHistory(false);
  };

  const handleSignIn = async () => {
    // Navigate to v1 auth
    window.location.href = '/auth';
  };

  const handleUpgradeToPro = async () => {
    const timestamp = new Date().toISOString();
    try {
      await supabase
        .from('user_settings')
        .update({
          plan: 'pro',
          plan_changed_at: timestamp,
          plan_change_source: 'core_app'
        });
      await logEvent('plan_change', {
        from: plan,
        to: 'pro',
        source: 'core_app',
        timestamp
      });
    } catch {
      /* ignore analytics errors */
    }
    // Navigate to v1 for upgrade flow
    window.location.href = '/';
  };

  const handleOpenProApp = () => {
    // Navigate to v1 Pro app
    window.location.href = '/';
  };

  if (authLoading || planLoading) {
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
      <div className="max-w-md md:max-w-2xl lg:max-w-6xl mx-auto px-4 md:px-6 lg:px-8 py-6">
        <div className="lg:grid lg:grid-cols-2 lg:gap-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8 lg:col-span-2">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 md:w-12 md:h-12 lg:w-14 lg:h-14 bg-primary rounded-xl flex items-center justify-center">
              <Truck className="h-6 w-6 md:h-7 md:w-7 lg:h-8 lg:w-8 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-xl md:text-2xl lg:text-3xl font-bold">LoadMaster Free</h1>
              <p className="text-sm md:text-base text-muted-foreground">Free Rate Calculator</p>
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
                Upgrade
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

        {/* Navigation */}
        <div className="flex gap-2 mb-6 lg:col-span-2">
          <Button
            variant={!showHistory && !showOCR && !showSuccess ? "default" : "outline"}
            onClick={() => {
              setShowHistory(false);
              setShowOCR(false);
              setShowSuccess(false);
            }}
            className="flex-1"
          >
            <Calculator className="h-4 w-4 mr-2" />
            Calculate
          </Button>
          <Button
            variant={showHistory ? "default" : "outline"}
            onClick={() => {
              setShowHistory(true);
              setShowOCR(false);
              setShowSuccess(false);
            }}
            className="flex-1"
          >
            <History className="h-4 w-4 mr-2" />
            Recent ({history.length})
          </Button>
        </div>

        {showSuccess ? (
          <SuccessScreen 
            onBackToCalculator={handleBackToCalculator}
            onUpgrade={handleUpgradeToPro}
          />
        ) : showOCR ? (
          <LiteOCRInterface 
            onSuccess={handleOCRSuccess}
            onClose={() => setShowOCR(false)}
          />
        ) : showHistory ? (
          <div className="space-y-4 lg:col-span-2">
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
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {history.map((item) => (
                  <Card key={item.id}>
                    <CardContent className="pt-4">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <p className="font-semibold">{item.miles} miles @ ${item.offerAllIn}</p>
                          <p className="text-sm text-muted-foreground">
                            {new Date(item.timestamp).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-muted-foreground">Settle For</p>
                          <p className="font-semibold text-primary">${item.targetAllIn}</p>
                        </div>
                      </div>
                      <div className="flex gap-4 text-xs text-muted-foreground">
                        <span>Ask: ${item.anchorAllIn}</span>
                        <span>Bottom Line: ${item.floorAllIn}</span>
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
          <div className="space-y-6 lg:col-span-2 lg:max-w-4xl lg:mx-auto">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Negotiation Strategy
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-3 gap-4 md:gap-6 lg:gap-8 text-center">
                  <div>
                    <p className="text-sm md:text-base text-muted-foreground mb-1">Ask</p>
                    <p className="text-xl md:text-2xl lg:text-3xl font-bold text-primary">${result.calculation.negotiation.anchor}</p>
                  </div>
                  <div>
                    <p className="text-sm md:text-base text-muted-foreground mb-1">Settle For</p>
                    <p className="text-xl md:text-2xl lg:text-3xl font-bold">${result.calculation.negotiation.target}</p>
                  </div>
                  <div>
                    <p className="text-sm md:text-base text-muted-foreground mb-1">Bottom Line</p>
                    <p className="text-xl md:text-2xl lg:text-3xl font-bold text-muted-foreground">${result.calculation.negotiation.floor}</p>
                  </div>
                </div>
                
                {result.historyItem.premiums.length > 0 && (
                  <div>
                    <p className="text-sm text-muted-foreground mb-2">Applied Premiums:</p>
                    <div className="flex flex-wrap gap-2">
                      {result.historyItem.premiums.map((premium: string, idx: number) => (
                        <span key={idx} className="text-xs bg-primary/10 text-primary px-2 py-1 rounded">
                          {premium}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                
                <div className="space-y-2">
                  <p className="text-sm md:text-base text-muted-foreground">Suggested Message:</p>
                  <div className="bg-muted p-4 md:p-5 lg:p-6 rounded-lg text-sm md:text-base">
                    <p className="font-semibold mb-2">Subject: {result.message.subject}</p>
                    <p className="leading-relaxed">{result.message.message}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Button onClick={handleReset} className="w-full h-10 md:h-11 lg:h-12">
              Calculate Another Load
            </Button>
          </div>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calculator className="h-5 w-5" />
                Rate Calculator
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <label className="text-sm font-medium mb-1 block">Miles</label>
                  <Input
                    type="number"
                    placeholder="500"
                    value={miles}
                    onChange={(e) => setMiles(e.target.value)}
                    className="h-10 md:h-11 lg:h-12"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">Offer (All-in)</label>
                  <Input
                    type="number"
                    placeholder="1250"
                    value={offerAllIn}
                    onChange={(e) => setOfferAllIn(e.target.value)}
                    className="h-10 md:h-11 lg:h-12"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">Weight (lbs)</label>
                  <Input
                    type="number"
                    placeholder="40000"
                    value={weightLbs}
                    onChange={(e) => setWeightLbs(e.target.value)}
                    className="h-10 md:h-11 lg:h-12"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">Pickup (hours)</label>
                  <Input
                    type="number"
                    placeholder="24"
                    value={pickupInHours}
                    onChange={(e) => setPickupInHours(e.target.value)}
                    className="h-10 md:h-11 lg:h-12"
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
              
              <div className="space-y-3">
                <Button 
                  onClick={handleCalculate} 
                  className="w-full h-10 md:h-11 lg:h-12"
                  disabled={!miles || !offerAllIn}
                >
                  Calculate Negotiation Strategy
                </Button>
                
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-background px-2 text-muted-foreground">or</span>
                  </div>
                </div>
                
                <Button 
                  onClick={() => setShowOCR(true)}
                  variant="outline" 
                  className="w-full h-10 md:h-11 lg:h-12"
                >
                  <Camera className="h-4 w-4 mr-2" />
                  Upload Load Image
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
        </div>
        
        {/* Footer */}
        <div className="mt-12 text-center text-sm text-muted-foreground lg:col-span-2">
          <p>LoadMaster Free Plan</p>
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
    </div>
  );
}

export default App;