import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { useToast } from '@/hooks/use-toast';
import { useUnifiedNegotiation } from '@/hooks/useUnifiedNegotiation';
import { Load } from '@/types/load';
import { MESSAGE_TEMPLATES } from '@/types/negotiation';
import { Channel, Tone } from '@/features/negotiation/templates';
import { 
  Copy, 
  TrendingUp, 
  Target, 
  DollarSign, 
  CheckCircle, 
  XCircle, 
  Clock, 
  MessageSquare,
  BarChart3,
  Zap
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { getFeatureFlags } from '@/utils/featureFlags';
import { isPro } from '@/utils/tier';

interface UnifiedNegotiationSheetProps {
  open: boolean;
  onClose: () => void;
  load: Partial<Load>;
  laneBaselineRpm?: number;
}

export function UnifiedNegotiationSheet({ 
  open, 
  onClose, 
  load, 
  laneBaselineRpm 
}: UnifiedNegotiationSheetProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const { advancedTemplates } = getFeatureFlags(user);
  const isProTier = isPro();
  
  const {
    calculation,
    notes,
    resultColor,
    isReady,
    scripts,
    generateDynamicScripts,
    channel,
    setChannel,
    tone,
    setTone,
    selectedStrategy,
    setSelectedStrategy,
    outcome,
    trackOutcome,
    isLoading,
  } = useUnifiedNegotiation({ load, laneBaselineRpm });

  const [customMessage, setCustomMessage] = useState('');
  const [finalRate, setFinalRate] = useState<number | undefined>();
  const [rateTierAccepted, setRateTierAccepted] = useState<'ask' | 'settle' | 'bottom' | 'other'>('ask');

  // Generate scripts when component mounts or dependencies change
  useEffect(() => {
    if (isReady) {
      generateDynamicScripts();
    }
  }, [isReady, channel, tone, generateDynamicScripts]);

  const selectedTemplate = MESSAGE_TEMPLATES.find(t => t.strategy === selectedStrategy);
  const rpmColorClass = resultColor === 'green' ? 'text-green-600' : resultColor === 'red' ? 'text-red-600' : 'text-yellow-600';

  const generateTemplateMessage = () => {
    if (!selectedTemplate || !calculation || !load) return '';

    let message = selectedTemplate.template;
    
    // Replace template variables
    message = message.replace(/{origin}/g, load.origin || '[Origin]');
    message = message.replace(/{destination}/g, load.destination || '[Destination]');
    message = message.replace(/{miles}/g, load.miles?.toString() || '[Miles]');
    message = message.replace(/{weight}/g, load.weight?.toString() || '[Weight]');
    message = message.replace(/{pickup_date}/g, '[Pickup Date]');
    message = message.replace(/{anchor_rate}/g, `$${(calculation.anchor_rate / (load.miles || 1)).toFixed(2)}`);
    message = message.replace(/{multi_stop_premium}/g, '$25');

    return message;
  };

  const handleCopyScript = async (scriptType: 'ask' | 'settle' | 'bottom') => {
    try {
      await navigator.clipboard.writeText(scripts[scriptType]);
      toast({ description: `${scriptType.charAt(0).toUpperCase() + scriptType.slice(1)} script copied to clipboard` });
    } catch (error) {
      toast({ description: 'Failed to copy script', variant: 'destructive' });
    }
  };

  const handleCopyTemplate = async () => {
    const message = selectedStrategy === 'custom' ? customMessage : generateTemplateMessage();
    try {
      await navigator.clipboard.writeText(message);
      toast({ description: 'Template message copied to clipboard' });
    } catch (error) {
      toast({ description: 'Failed to copy message', variant: 'destructive' });
    }
  };

  const handleCopyAllNotes = async () => {
    if (!notes || notes.length === 0) return;

    const anchorNote = notes.find(n => n.templateId === 't_anchor')?.message || '';
    const surchargeNotes = notes.filter(n => n.templateId !== 't_anchor').map(n => n.message);
    const etiquetteLine = 'Thanks!';
    const fullMessage = [anchorNote, ...surchargeNotes, etiquetteLine].join(' ');

    try {
      await navigator.clipboard.writeText(fullMessage);
      toast({ description: 'All notes copied to clipboard' });
    } catch (error) {
      toast({ description: 'Failed to copy notes', variant: 'destructive' });
    }
  };

  const handleTrackOutcome = (newOutcome: typeof outcome) => {
    trackOutcome(newOutcome, rateTierAccepted, finalRate);
  };

  if (!calculation || !isReady) {
    return null;
  }

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent side="bottom" className="h-[95vh] overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-primary" />
            Unified Negotiation Hub
          </SheetTitle>
          <SheetDescription>
            {load.origin} → {load.destination} • {load.miles} miles
          </SheetDescription>
        </SheetHeader>

        <div className="py-6">
          <Tabs defaultValue="scripts" className="space-y-6">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="scripts" className="flex items-center gap-2">
                <MessageSquare className="h-4 w-4" />
                Quick Scripts
              </TabsTrigger>
              <TabsTrigger value="templates" className="flex items-center gap-2">
                <Target className="h-4 w-4" />
                Templates
              </TabsTrigger>
              <TabsTrigger value="outcome" className="flex items-center gap-2">
                <BarChart3 className="h-4 w-4" />
                Track Outcome
              </TabsTrigger>
            </TabsList>

            {/* Load Summary - Always visible */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Load Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
                  <div>
                    <Label className="text-muted-foreground">Original Offer</Label>
                    <p className="font-medium">${load.rate?.toLocaleString()}</p>
                    <p className="text-xs text-muted-foreground">
                      ${((load.rate || 0) / (load.miles || 1)).toFixed(2)}/mile
                    </p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Ask Rate</Label>
                    <p className="font-medium text-green-600">${calculation.anchor_rate.toLocaleString()}</p>
                    <p className="text-xs text-muted-foreground">
                      ${(calculation.anchor_rate / (load.miles || 1)).toFixed(2)}/mile
                    </p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Settle Rate</Label>
                    <p className="font-medium text-primary">${calculation.target_rate.toLocaleString()}</p>
                    <p className="text-xs text-muted-foreground">
                      ${(calculation.target_rate / (load.miles || 1)).toFixed(2)}/mile
                    </p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Bottom Rate</Label>
                    <p className="font-medium text-red-600">${calculation.floor_rate.toLocaleString()}</p>
                    <p className="text-xs text-muted-foreground">
                      ${(calculation.floor_rate / (load.miles || 1)).toFixed(2)}/mile
                    </p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Base RPM</Label>
                    <p className={`font-medium ${rpmColorClass}`}>{calculation.base_rpm.toFixed(2)}</p>
                  </div>
                </div>

                {calculation.premiums_applied.length > 0 && (
                  <div className="mt-4">
                    <Label className="text-sm font-medium">Premiums Applied:</Label>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {calculation.premiums_applied.map((premium, index) => (
                        <Badge key={index} variant="secondary" className="text-xs">
                          {premium}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Quick Scripts Tab */}
            <TabsContent value="scripts" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MessageSquare className="h-5 w-5" />
                    Dynamic Negotiation Scripts
                  </CardTitle>
                  <CardDescription>
                    Customize your communication preferences and copy rate-specific scripts
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Channel and Tone Controls */}
                  <div className="flex gap-4 flex-wrap">
                    <div>
                      <Label>Channel</Label>
                      <Tabs value={channel} onValueChange={(value) => setChannel(value as Channel)} className="mt-1">
                        <TabsList>
                          <TabsTrigger value="text">Text</TabsTrigger>
                          <TabsTrigger value="email">Email</TabsTrigger>
                          <TabsTrigger value="phone">Phone</TabsTrigger>
                        </TabsList>
                      </Tabs>
                    </div>
                    <div>
                      <Label>Tone</Label>
                      <Select value={tone} onValueChange={(value) => setTone(value as Tone)}>
                        <SelectTrigger className="w-[180px] mt-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="professional">Professional</SelectItem>
                          <SelectItem value="driver">Driver</SelectItem>
                          <SelectItem value="firm">Firm</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Generated Scripts */}
                  {(['ask', 'settle', 'bottom'] as const).map(scriptType => (
                    <div key={scriptType} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label className="font-medium capitalize text-base">
                          {scriptType} (${scriptType === 'ask' ? calculation.anchor_rate : 
                                         scriptType === 'settle' ? calculation.target_rate : 
                                         calculation.floor_rate})
                        </Label>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => handleCopyScript(scriptType)}
                        >
                          <Copy className="h-4 w-4 mr-2" />
                          Copy
                        </Button>
                      </div>
                      <Textarea 
                        value={scripts[scriptType]} 
                        readOnly 
                        rows={channel === 'email' ? 6 : 3}
                        className="bg-muted/30"
                      />
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Notes Section */}
              {notes && notes.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Strategy Notes</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleCopyAllNotes}
                      className="mb-4"
                    >
                      <Copy className="h-4 w-4 mr-2" />
                      Copy All Notes
                    </Button>
                    <ul className="list-disc pl-4 text-sm space-y-2">
                      {notes.slice(0, 3).map(n => (
                        <li key={n.templateId} className="flex items-start gap-2">
                          <span className="flex-1">{n.message}</span>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => navigator.clipboard.writeText(n.message)}
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* Templates Tab */}
            <TabsContent value="templates" className="space-y-4">
              {(advancedTemplates || isProTier) && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Target className="h-5 w-5" />
                      Message Templates
                    </CardTitle>
                    <CardDescription>
                      Use strategy-based templates for specific scenarios
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label>Strategy Template</Label>
                      <Select value={selectedStrategy} onValueChange={setSelectedStrategy}>
                        <SelectTrigger className="mt-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {MESSAGE_TEMPLATES.map((template) => (
                            <SelectItem key={template.id} value={template.strategy}>
                              {template.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label>Generated Message</Label>
                      {selectedStrategy === 'custom' ? (
                        <Textarea
                          value={customMessage}
                          onChange={(e) => setCustomMessage(e.target.value)}
                          placeholder="Enter your custom negotiation message..."
                          rows={8}
                          className="mt-1"
                        />
                      ) : (
                        <Textarea
                          value={generateTemplateMessage()}
                          readOnly
                          rows={8}
                          className="mt-1 bg-muted/30"
                        />
                      )}
                    </div>

                    <Button onClick={handleCopyTemplate} className="w-full">
                      <Copy className="h-4 w-4 mr-2" />
                      Copy Template Message
                    </Button>
                  </CardContent>
                </Card>
              )}

              {!advancedTemplates && !isProTier && (
                <Card>
                  <CardContent className="pt-6 text-center">
                    <p className="text-muted-foreground mb-4">
                      Upgrade to PRO to access advanced negotiation templates
                    </p>
                    <Button variant="outline">
                      Upgrade to PRO
                    </Button>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* Track Outcome Tab */}
            <TabsContent value="outcome" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5" />
                    Track Negotiation Outcome
                  </CardTitle>
                  <CardDescription>
                    Record the results to improve your negotiation analytics
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Which Rate Was Accepted?</Label>
                      <Select value={rateTierAccepted} onValueChange={(value) => setRateTierAccepted(value as 'ask' | 'settle' | 'bottom' | 'other')}>
                        <SelectTrigger className="mt-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="ask">Ask Rate (${calculation.anchor_rate.toLocaleString()})</SelectItem>
                          <SelectItem value="settle">Settle Rate (${calculation.target_rate.toLocaleString()})</SelectItem>
                          <SelectItem value="bottom">Bottom Rate (${calculation.floor_rate.toLocaleString()})</SelectItem>
                          <SelectItem value="other">Other Amount</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {rateTierAccepted === 'other' && (
                      <div>
                        <Label>Final Rate</Label>
                        <Input
                          type="number"
                          value={finalRate || ''}
                          onChange={(e) => setFinalRate(Number(e.target.value))}
                          placeholder="Enter final rate"
                          className="mt-1"
                        />
                      </div>
                    )}
                  </div>

                  <div>
                    <Label>Outcome</Label>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-2">
                      <Button
                        variant={outcome === 'accepted' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => handleTrackOutcome('accepted')}
                        className="flex items-center gap-2"
                        disabled={isLoading}
                      >
                        <CheckCircle className="h-4 w-4" />
                        Accepted
                      </Button>
                      <Button
                        variant={outcome === 'counter_offered' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => handleTrackOutcome('counter_offered')}
                        className="flex items-center gap-2"
                        disabled={isLoading}
                      >
                        <Clock className="h-4 w-4" />
                        Counter
                      </Button>
                      <Button
                        variant={outcome === 'rejected' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => handleTrackOutcome('rejected')}
                        className="flex items-center gap-2"
                        disabled={isLoading}
                      >
                        <XCircle className="h-4 w-4" />
                        Rejected
                      </Button>
                      <Button
                        variant={outcome === 'pending' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => handleTrackOutcome('pending')}
                        className="flex items-center gap-2"
                        disabled={isLoading}
                      >
                        <Clock className="h-4 w-4" />
                        Pending
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          <div className="flex gap-2 pt-6">
            <Button onClick={onClose} variant="outline" className="flex-1">
              Close
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}