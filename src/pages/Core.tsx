import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calculator, Truck, TrendingUp, Crown, LogIn, ExternalLink, History, BarChart3, LayoutDashboard, ArrowLeft, Camera, Clock } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { useAuth } from '@/contexts/AuthContext';
import { useSupabaseSettings } from '@/hooks/useSupabaseSettings';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '@loadmaster/api';
import { logEvent } from '@/utils/metrics';
import { useEquipment } from '@/hooks/useEquipment';
import { getEquipmentRPMTargets, equipmentDefaults } from '../../packages/engine/src/equipmentProfiles';
import { UpgradeCard } from '@/components/UpgradeCard';
import { CameraInterface } from '@/components/CameraInterface';
import { FieldDetectionResult } from '@/utils/SmartFieldDetector';
import { useOCRUsage } from '@/hooks/useOCRUsage';
import { useOCRProcessor } from '@/hooks/useOCRProcessor';
import { OCRCorrectionInterface } from '@/components/OCRCorrectionInterface';
import { MilesInputModal } from '@/components/MilesInputModal';
import { Progress } from '@/components/ui/progress';
import { Loader2, X, Upload } from 'lucide-react';
import type { Equipment } from '@/types/equipment';
import { SimpleBusinessSetup } from '@/components/SimpleBusinessSetup';


// Equipment-aware negotiation logic with business setup integration
const calculateNegotiation = (
  miles: number, 
  rate: number, 
  weight?: number, 
  equipment: Equipment = 'cargo_van',
  revenueSplitPercentage: number = 100,
  weeklyFixedCosts: number = 0
) => {
  // Calculate gross RPM
  const grossRpm = rate / miles;
  
  // Apply revenue split
  const netRevenue = rate * (revenueSplitPercentage / 100);
  
  // Estimate weekly miles for cost distribution (industry average: 2500 miles/week)
  const estimatedWeeklyMiles = 2500;
  const fixedCostPerMile = weeklyFixedCosts / estimatedWeeklyMiles;
  
  // Calculate net RPM after business costs
  const netRpm = (netRevenue / miles) - fixedCostPerMile;
  
  // Use net RPM for negotiation targets
  const anchor = netRevenue * 1.15; // 15% above net offer
  const target = netRevenue * 1.08; // 8% above net offer  
  const floor = netRevenue * 0.98; // 2% below net offer
  
  const premiums = [];
  if (weight && weight > 45000) premiums.push('Heavy Load');
  if (grossRpm < 1.5) premiums.push('Low Rate Lane');
  
  // Get equipment-specific RPM targets for quality assessment (use net RPM)
  const rpmTargets = getEquipmentRPMTargets(equipment);
  const equipmentInfo = equipmentDefaults[equipment];
  
  let qualityNote = '';
  if (netRpm >= rpmTargets.green) {
    qualityNote = 'Excellent net rate for your setup';
  } else if (netRpm >= rpmTargets.yellow) {
    qualityNote = 'Good net rate - above industry average';
  } else if (netRpm >= rpmTargets.red) {
    qualityNote = 'Fair net rate - consider negotiating higher';
  } else {
    qualityNote = 'Below average net rate - negotiate strongly';
  }
  
  return {
    anchor_rate: Math.round(anchor),
    target_rate: Math.round(target),
    floor_rate: Math.round(floor),
    premiums_applied: premiums,
    suggested_strategy: 'Negotiate higher',
    quality_note: qualityNote,
    equipment_context: `${equipment.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())} avg: $${equipmentInfo.rpmTargets.yellow.toFixed(2)}/mi`,
    gross_rpm: grossRpm,
    net_rpm: netRpm,
    revenue_impact: revenueSplitPercentage < 100 ? `${100 - revenueSplitPercentage}% to company` : null,
    fixed_cost_impact: weeklyFixedCosts > 0 ? `$${fixedCostPerMile.toFixed(3)}/mi fixed costs` : null
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
  const [showCameraInterface, setShowCameraInterface] = useState(false);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const [ocrJustCompleted, setOcrJustCompleted] = useState(false);
  const [populatedFields, setPopulatedFields] = useState<string[]>([]);
  const [showBusinessSetup, setShowBusinessSetup] = useState(false);
  
  const { user, loading: authLoading } = useAuth();
  const { settings, loading: settingsLoading, updateSettings } = useSupabaseSettings();
  const { equipment, setEquipment } = useEquipment();
  // This is the LITE page - always LITE tier
  const plan = 'free' as const;
  const isPro = false;
  const planLoading = false;
  const navigate = useNavigate();
  const ocrUsage = useOCRUsage(isPro);
  const { toast } = useToast();
  
  // Initialize OCR processor
  const ocrProcessor = useOCRProcessor(isPro);

  // OCR state is now managed explicitly by user actions only

  // Extract calculation logic for reuse
  const performCalculation = (milesValue: string, offerValue: string, weightValue?: string) => {
    const milesNum = parseFloat(milesValue);
    const offerNum = parseFloat(offerValue);
    const weightNum = weightValue ? parseFloat(weightValue) : undefined;

    if (!milesNum || !offerNum) return null;

    // Use business setup values from settings
    const revenueSplit = settings?.revenueSplitPercentage || 100;
    const weeklyCosts = settings?.weeklyFixedCosts || 0;

    const calculation = calculateNegotiation(
      milesNum, 
      offerNum, 
      weightNum, 
      equipment, 
      revenueSplit, 
      weeklyCosts
    );
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

    return { calculation, message, historyItem };
  };

  const handleCalculate = () => {
    const result = performCalculation(miles, offerAllIn, weightLbs);
    if (!result) return;

    setHistory(prev => [result.historyItem, ...prev.slice(0, 4)]);
    setResult(result);
    setShowResult(true);
    
    // Clear OCR state when user proceeds to calculate
    setOcrJustCompleted(false);
    setPopulatedFields([]);
  };

  // Auto-recalculate when equipment changes and results are showing
  useEffect(() => {
    if (showResult && miles && offerAllIn) {
      const newResult = performCalculation(miles, offerAllIn, weightLbs);
      if (newResult) {
        setResult(newResult);
        // Update the most recent history entry instead of adding new one
        setHistory(prev => {
          if (prev.length > 0) {
            return [newResult.historyItem, ...prev.slice(1)];
          }
          return [newResult.historyItem];
        });
      }
    }
  }, [equipment]);

  const handleReset = () => {
    setMiles('');
    setOfferAllIn('');
    setWeightLbs('');
    setPickupInHours('');
    setWeekend(false);
    setShowResult(false);
    setResult(null);
    setShowCameraInterface(false);
    if (cameraStream) {
      cameraStream.getTracks().forEach(track => track.stop());
      setCameraStream(null);
    }
    ocrProcessor.resetProcessingState();
  };

  const handleFieldsDetected = (detectionResult: FieldDetectionResult) => {
    console.log('🎯 CORE DEBUG - Applying detected fields to calculator', detectionResult);
    
    const fieldsPopulated: string[] = [];
    
    // Populate form fields from OCR results with enhanced debugging
    detectionResult.detectedFields.forEach(field => {
      console.log(`🔍 CORE DEBUG - Processing field: ${field.field}, original value: "${field.value}"`);
      
      // Enhanced cleaning that preserves decimals but removes all other non-numeric chars
      const cleanValue = field.value.replace(/[$,\s€£¥₹]/g, '');
      console.log(`🔍 CORE DEBUG - Cleaned value: "${cleanValue}"`);
      
      if (cleanValue && !isNaN(parseFloat(cleanValue))) {
        switch (field.field) {
          case 'miles':
            setMiles(cleanValue);
            fieldsPopulated.push('Miles');
            console.log('📏 CORE DEBUG - Set miles to', cleanValue);
            break;
          case 'rate':
            setOfferAllIn(cleanValue);
            fieldsPopulated.push('Rate');
            console.log('💰 CORE DEBUG - Set rate to', cleanValue);
            break;
          case 'weight':
            setWeightLbs(cleanValue);
            fieldsPopulated.push('Weight');
            console.log('⚖️ CORE DEBUG - Set weight to', cleanValue);
            break;
          // Add other fields as needed
        }
      } else {
        console.warn(`⚠️ CORE DEBUG - Skipped invalid value for ${field.field}: "${cleanValue}"`);
      }
    });

    // Set visual feedback state
    setPopulatedFields(fieldsPopulated);
    setOcrJustCompleted(true);
    
    // Show success toast
    const fieldsList = fieldsPopulated.join(', ');
    toast({
      title: "✅ Fields populated successfully!",
      description: `Extracted: ${fieldsList}. Ready to calculate your negotiation strategy.`,
      duration: 4000,
    });
    
    console.log('✨ CORE DEBUG - Successfully populated fields:', fieldsPopulated);
    console.log('🔍 CORE DEBUG - Final form state:', { miles, offerAllIn, weightLbs });
    
    // Scroll to top to show the populated form
    setTimeout(() => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }, 100);
  };

  const handleUploadClick = () => {
    if (!ocrUsage.canUseOCR) return;
    
    // Create file input and trigger click
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = 'image/*';
    fileInput.onchange = (event) => {
      const file = (event.target as HTMLInputElement).files?.[0];
      if (file && file.type.startsWith('image/')) {
        ocrProcessor.processOCR(file, handleFieldsDetected, () => {
          // Fallback: Reset OCR states and stay on manual input form
          console.log('OCR fallback - staying on manual input');
        });
      }
    };
    fileInput.click();
  };

  const handleCameraClick = async () => {
    if (!ocrUsage.canUseOCR) return;
    
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' } 
      });
      setCameraStream(stream);
      setShowCameraInterface(true);
    } catch (error) {
      console.error('Camera access failed:', error);
      // Fallback to upload
      handleUploadClick();
    }
  };

  const handleCameraCapture = (file: File) => {
    setShowCameraInterface(false);
    if (cameraStream) {
      cameraStream.getTracks().forEach(track => track.stop());
      setCameraStream(null);
    }
    
    // Process the captured file through OCR
    ocrProcessor.processOCR(file, handleFieldsDetected, () => {
      // Fallback: Reset states and stay on manual input form
      console.log('Camera OCR fallback - staying on manual input');
    });
  };

  const handleCameraClose = () => {
    setShowCameraInterface(false);
    if (cameraStream) {
      cameraStream.getTracks().forEach(track => track.stop());
      setCameraStream(null);
    }
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

  // Business setup handlers
  const handleBusinessSetup = (revenueSplit: number, weeklyCosts: number) => {
    updateSettings({
      revenueSplitPercentage: revenueSplit,
      weeklyFixedCosts: weeklyCosts,
    });
    setShowBusinessSetup(false);
    toast({
      title: "Business setup saved!",
      description: "Your RPM calculations will now reflect your business arrangement.",
    });
  };

  const handleSkipSetup = () => {
    setShowBusinessSetup(false);
  };

  // Show business setup for new users
  const shouldShowSetup = user && settings && 
    settings.revenueSplitPercentage === 100 && 
    settings.weeklyFixedCosts === 0 &&
    !showResult &&
    !showHistory;

  if (authLoading || settingsLoading) {
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
              <Button variant="outline" size="sm" onClick={handleOpenProApp}>
                <ExternalLink className="h-4 w-4 mr-2" />
                PRO App
              </Button>
            )}
          </div>
        </div>

        {/* Equipment Selection */}
        <Card className="mb-6">
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <Truck className="h-5 w-5 text-primary" />
              <div className="flex-1">
                <label className="text-sm font-medium">Equipment Type</label>
                <select
                  value={equipment || ''}
                  onChange={(e) => setEquipment(e.target.value as Equipment)}
                  className="w-full mt-1 rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  <option value="">Select Equipment Type</option>
                  <option value="cargo_van">Cargo Van</option>
                  <option value="straight_truck">Straight Truck</option>
                  <option value="hotshot">Hotshot</option>
                </select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Simple Business Setup */}
        {(shouldShowSetup || showBusinessSetup) && (
          <div className="mb-6">
            <SimpleBusinessSetup
              onSave={handleBusinessSetup}
              onSkip={handleSkipSetup}
              initialRevenueSplit={settings?.revenueSplitPercentage || 100}
              initialWeeklyCosts={settings?.weeklyFixedCosts || 0}
            />
          </div>
        )}

        {/* Business Setup Button for existing users */}
        {user && !shouldShowSetup && !showBusinessSetup && (
          <Card className="mb-6">
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">Business Setup</p>
                  <p className="text-xs text-muted-foreground">
                    {settings?.revenueSplitPercentage !== 100 || settings?.weeklyFixedCosts !== 0
                      ? `${settings?.revenueSplitPercentage}% split • $${settings?.weeklyFixedCosts}/week`
                      : 'Set your revenue split and costs'
                    }
                  </p>
                </div>
                <Button variant="outline" size="sm" onClick={() => setShowBusinessSetup(true)}>
                  {settings?.revenueSplitPercentage !== 100 || settings?.weeklyFixedCosts !== 0 ? 'Edit' : 'Setup'}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Navigation */}
        <div className="flex gap-2 mb-6">
          <Button
            variant={!showHistory ? "default" : "outline"}
            onClick={() => {
              setShowHistory(false);
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

                {/* RPM Breakdown */}
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-4 text-center">
                    <div className="p-3 bg-muted rounded">
                      <p className="text-xs text-muted-foreground">Gross RPM</p>
                      <p className="text-lg font-bold">${result.calculation.gross_rpm.toFixed(2)}</p>
                    </div>
                    <div className="p-3 bg-primary/10 rounded">
                      <p className="text-xs text-muted-foreground">Net Take-Home RPM</p>
                      <p className="text-lg font-bold text-primary">${result.calculation.net_rpm.toFixed(2)}</p>
                    </div>
                  </div>
                  
                  {/* Business Impact Display */}
                  {(result.calculation.revenue_impact || result.calculation.fixed_cost_impact) && (
                    <div className="text-xs text-muted-foreground space-y-1">
                      {result.calculation.revenue_impact && (
                        <div>• {result.calculation.revenue_impact}</div>
                      )}
                      {result.calculation.fixed_cost_impact && (
                        <div>• {result.calculation.fixed_cost_impact}</div>
                      )}
                    </div>
                  )}
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
        ) : showCameraInterface ? (
          <CameraInterface
            stream={cameraStream!}
            onCapture={handleCameraCapture}
            onClose={handleCameraClose}
          />
        ) : ocrProcessor.showCorrection && ocrProcessor.currentDetectionResult ? (
          <OCRCorrectionInterface
            detectedFields={ocrProcessor.currentDetectionResult.detectedFields}
            rawText={ocrProcessor.currentDetectionResult.rawText}
            onFieldCorrection={ocrProcessor.handleFieldCorrection}
            onConfirm={() => ocrProcessor.confirmCorrections(handleFieldsDetected)}
            onCancel={ocrProcessor.cancelCorrections}
            overallConfidence={ocrProcessor.currentDetectionResult.confidence}
            warnings={ocrProcessor.currentDetectionResult.warnings}
          />
        ) : ocrProcessor.isProcessing ? (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-xl font-semibold mb-2">Processing Image</h2>
              <p className="text-sm text-muted-foreground">
                Extracting text and analyzing load information...
              </p>
            </div>
            
            <Card className="p-8">
              <div className="flex flex-col items-center gap-4">
                <Loader2 className="h-12 w-12 animate-spin text-primary" />
                <Progress value={ocrProcessor.ocrProgress} className="w-48" />
                <p className="text-sm text-muted-foreground">{Math.round(ocrProcessor.ocrProgress)}%</p>
                <div className="text-center space-y-2">
                  <p className="font-medium">{ocrProcessor.processingStage || 'Processing your image'}</p>
                  <p className="text-sm text-muted-foreground">
                    This may take a moment
                  </p>
                </div>
                <Button
                  onClick={ocrProcessor.cancelUpload}
                  variant="outline"
                  size="sm"
                  disabled={ocrProcessor.isCancelling}
                  className="mt-2 text-destructive hover:text-destructive border-destructive disabled:opacity-50"
                >
                  <X className="h-4 w-4 mr-2" />
                  {ocrProcessor.isCancelling ? 'Cancelling...' : 'Cancel Upload'}
                </Button>
              </div>
            </Card>
          </div>
        ) : (
          <Card>
            <CardContent className="pt-6 space-y-4">
              {/* OCR Success Summary - Shows extracted data prominently */}
              {ocrJustCompleted && populatedFields.length > 0 ? (
                <div className="space-y-4">
                  <div className="text-center">
                    <h2 className="text-xl font-semibold mb-2 text-primary">✅ Data Extracted Successfully!</h2>
                    <p className="text-sm text-muted-foreground">
                      Ready to calculate your negotiation strategy
                    </p>
                  </div>
                  
                  {/* Extract Summary Card */}
                  <div className="bg-primary/5 border border-primary/20 p-4 rounded-lg">
                    <h3 className="font-semibold text-primary mb-3">Extracted Load Details:</h3>
                    <div className="grid grid-cols-2 gap-4 mb-3">
                      {miles && (
                        <div>
                          <p className="text-xs text-muted-foreground">Miles</p>
                          <p className="text-lg font-bold text-primary">{miles}</p>
                        </div>
                      )}
                      {offerAllIn && (
                        <div>
                          <p className="text-xs text-muted-foreground">Rate (All-in)</p>
                          <p className="text-lg font-bold text-primary">${offerAllIn}</p>
                        </div>
                      )}
                      {weightLbs && (
                        <div>
                          <p className="text-xs text-muted-foreground">Weight</p>
                          <p className="text-lg font-bold text-primary">{weightLbs} lbs</p>
                        </div>
                      )}
                    </div>
                    <div className="space-y-3">
                      <Button 
                        onClick={handleCalculate} 
                        className="w-full bg-primary hover:bg-primary/90"
                        size="lg"
                        disabled={!miles || !offerAllIn}
                      >
                        <Calculator className="h-4 w-4 mr-2" />
                        Calculate Negotiation Strategy
                      </Button>
                      
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setOcrJustCompleted(false);
                            setPopulatedFields([]);
                          }}
                          className="flex-1 text-xs"
                        >
                          Edit Details
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setOcrJustCompleted(false);
                            setPopulatedFields([]);
                            handleReset();
                          }}
                          className="flex-1 text-xs text-muted-foreground"
                        >
                          <Upload className="h-3 w-3 mr-1" />
                          Upload Different Image
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="text-center">
                    <h2 className="text-xl font-semibold mb-2">Calculate Load Rate</h2>
                    <p className="text-sm text-muted-foreground">
                      Get negotiation strategies for your {equipment.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </p>
                    
                    {/* OCR Usage Display - Only show for LITE users */}
                    {!isPro && (
                      <div className={`bg-card rounded-lg p-3 border mt-4 ${!ocrUsage.canUseOCR ? 'bg-destructive/5 border-destructive/20' : ''}`}>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Image scans today:</span>
                          <span className={`font-medium ${ocrUsage.canUseOCR ? 'text-primary' : 'text-destructive'}`}>
                            {ocrUsage.daily}/{ocrUsage.dailyLimit}
                          </span>
                        </div>
                        {!ocrUsage.canUseOCR ? (
                          <div className="mt-2 space-y-1">
                            <p className="text-xs text-destructive font-medium">
                              Daily image upload limit reached! Resets at {ocrUsage.resetTime.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              Upgrade to PRO for more AI image processing
                            </p>
                          </div>
                        ) : (
                          <p className="text-xs text-muted-foreground mt-1">
                            {ocrUsage.remaining} Image scans remaining today
                          </p>
                        )}
                      </div>
                    )}
                  </div>

                  {/* OCR Options */}
                  <div className="space-y-3">
                    <p className="text-xs text-muted-foreground text-center">
                      Upload an image to automatically extract load details
                    </p>
                    
                    <div className="grid grid-cols-2 gap-3">
                      <Button
                        variant="outline"
                        onClick={handleUploadClick}
                        disabled={!ocrUsage.canUseOCR}
                        className="h-auto p-4 flex flex-col gap-2"
                      >
                        <Upload className="h-6 w-6" />
                        <span className="text-sm">Upload Image</span>
                      </Button>
                      
                      <Button
                        variant="outline"
                        onClick={handleCameraClick}
                        disabled={!ocrUsage.canUseOCR}
                        className="h-auto p-4 flex flex-col gap-2"
                      >
                        <Camera className="h-6 w-6" />
                        <span className="text-sm">Take Photo</span>
                      </Button>
                    </div>
                    
                    <div className="relative">
                      <div className="absolute inset-0 flex items-center">
                        <span className="w-full border-t border-border" />
                      </div>
                      <div className="relative flex justify-center text-xs uppercase">
                        <span className="bg-background px-2 text-muted-foreground">Or</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Manual Input Form - Only show when OCR hasn't just completed */}
              {!ocrJustCompleted && (
                <div className="space-y-4">
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
                      <label className="text-sm font-medium mb-1 block">Pickup (in hours)</label>
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
                </div>
              )}
            </CardContent>
          </Card>
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
            <Link 
              to="/upgrade" 
              className="underline"
              onClick={() => {
                // Scroll to top when navigating to upgrade page
                setTimeout(() => {
                  window.scrollTo(0, 0);
                }, 100);
              }}
            >
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
        
        {/* Miles Modal for OCR */}
        {ocrProcessor.showMilesModal && (
          <MilesInputModal
            isOpen={ocrProcessor.showMilesModal}
            onClose={ocrProcessor.cancelMiles}
            onConfirm={ocrProcessor.confirmMiles}
          />
        )}
      </div>
    </div>
  );
};

// Export the Core component
export default Core;