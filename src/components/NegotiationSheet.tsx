import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { useToast } from '@/hooks/use-toast';
import { useNegotiationEngine } from '@/hooks/useNegotiationEngine';
import { Load } from '@/types/load';
import { MESSAGE_TEMPLATES, Negotiation } from '@/types/negotiation';
import { Copy, TrendingUp, Target, DollarSign, CheckCircle, XCircle, Clock } from 'lucide-react';

interface NegotiationSheetProps {
  open: boolean;
  onClose: () => void;
  load: Partial<Load>;
  onSaveNegotiation?: (negotiation: Omit<Negotiation, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => void;
}

export function NegotiationSheet({ open, onClose, load, onSaveNegotiation }: NegotiationSheetProps) {
  const { calculation, notes, resultColor } = useNegotiationEngine({ load });
  const { toast } = useToast();
  
  const [selectedStrategy, setSelectedStrategy] = useState<string>(calculation?.suggested_strategy || 'standard');
  const [customMessage, setCustomMessage] = useState('');
  const [outcome, setOutcome] = useState<Negotiation['outcome']>('pending');

  const selectedTemplate = MESSAGE_TEMPLATES.find(t => t.strategy === selectedStrategy);
  const rpmColorClass = resultColor === 'green' ? 'text-green-600' : resultColor === 'red' ? 'text-red-600' : 'text-yellow-600';

  const generateMessage = () => {
    if (!selectedTemplate || !calculation || !load) return '';

    let message = selectedTemplate.template;
    
    // Replace template variables
    message = message.replace(/{origin}/g, load.origin || '[Origin]');
    message = message.replace(/{destination}/g, load.destination || '[Destination]');
    message = message.replace(/{miles}/g, load.miles?.toString() || '[Miles]');
    message = message.replace(/{weight}/g, load.weight?.toString() || '[Weight]');
    message = message.replace(/{pickup_date}/g, '[Pickup Date]');
    message = message.replace(/\${anchor_rate}/g, `$${(calculation.anchor_rate / (load.miles || 1)).toFixed(2)}`);
    message = message.replace(/\${multi_stop_premium}/g, '$25'); // Based on default multi-stop value

    return message;
  };

  const handleCopyMessage = () => {
    const message = selectedStrategy === 'custom' ? customMessage : generateMessage();
    navigator.clipboard.writeText(message);
    toast({
      title: "Message copied",
      description: "Negotiation message copied to clipboard",
    });
  };

  const handleCopyNote = (note: string) => {
    navigator.clipboard.writeText(note);
    toast({
      title: "Note copied",
      description: "Template note copied to clipboard",
    });
  };

  const handleCopyAllNotes = () => {
    if (!notes || notes.length === 0) return;

    const anchorNote = notes.find(n => n.templateId === 't_anchor')?.message || '';
    const surchargeNotes = notes.filter(n => n.templateId !== 't_anchor').map(n => n.message);
    const etiquetteLine = 'Thanks!';
    const fullMessage = [anchorNote, ...surchargeNotes, etiquetteLine].join(' ');

    navigator.clipboard.writeText(fullMessage).then(() => {
      toast({
        title: 'Notes copied',
        description: 'All notes copied to clipboard',
      });
    });
  };

  const handleTrackOutcome = (newOutcome: Negotiation['outcome']) => {
    setOutcome(newOutcome);
    
    if (onSaveNegotiation && calculation && load.id) {
      const negotiation: Omit<Negotiation, 'id' | 'user_id' | 'created_at' | 'updated_at'> = {
        load_id: load.id,
        original_offer: load.rate || 0,
        target_rate: calculation.target_rate,
        anchor_rate: calculation.anchor_rate,
        floor_rate: calculation.floor_rate,
        strategy_used: selectedStrategy as Negotiation['strategy_used'],
        outcome: newOutcome,
        iterations: 1,
        message_sent: selectedStrategy === 'custom' ? customMessage : generateMessage(),
      };
      
      onSaveNegotiation(negotiation);
    }

    toast({
      title: "Outcome tracked",
      description: `Negotiation marked as ${newOutcome}`,
    });
  };

  if (!calculation) {
    return null;
  }

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent side="bottom" className="h-[90vh] overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Load Negotiation
          </SheetTitle>
          <SheetDescription>
            {load.origin} → {load.destination} • {load.miles} miles
          </SheetDescription>
        </SheetHeader>

        <div className="grid gap-6 py-6">
          {/* Load Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Load Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <Label className="text-muted-foreground">Original Offer</Label>
                  <p className="font-medium">${load.rate?.toLocaleString()}</p>
                  <p className="text-xs text-muted-foreground">
                    ${((load.rate || 0) / (load.miles || 1)).toFixed(2)}/mile
                  </p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Weight</Label>
                  <p className="font-medium">{load.weight?.toLocaleString() || 'Not specified'} lbs</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Deadhead</Label>
                  <p className="font-medium">{load.deadheadMiles || 0} miles</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Total Miles</Label>
                  <p className="font-medium">{((load.miles || 0) + (load.deadheadMiles || 0)).toLocaleString()}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Base RPM</Label>
                  <p className={`font-medium ${rpmColorClass}`}>{calculation.base_rpm.toFixed(2)}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Negotiation Calculation */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                Negotiation Strategy
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4 mb-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">${calculation.anchor_rate.toLocaleString()}</div>
                  <Label className="text-muted-foreground">Anchor (Opening)</Label>
                  <p className="text-xs">${(calculation.anchor_rate / (load.miles || 1)).toFixed(2)}/mile</p>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary">${calculation.target_rate.toLocaleString()}</div>
                  <Label className="text-muted-foreground">Target</Label>
                  <p className="text-xs">${(calculation.target_rate / (load.miles || 1)).toFixed(2)}/mile</p>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-red-600">${calculation.floor_rate.toLocaleString()}</div>
                  <Label className="text-muted-foreground">Floor (Minimum)</Label>
                  <p className="text-xs">${(calculation.floor_rate / (load.miles || 1)).toFixed(2)}/mile</p>
                </div>
              </div>

              {calculation.premiums_applied.length > 0 && (
                <div>
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

              {calculation.lane_baseline_rpm && (
                <div className="mt-4 p-2 bg-muted/50 rounded">
                  <Label className="text-xs text-muted-foreground">Lane Baseline RPM:</Label>
                  <span className="ml-2 font-medium">${calculation.lane_baseline_rpm.toFixed(2)}</span>
                </div>
              )}
            </CardContent>
          </Card>

          {notes && notes.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Notes</CardTitle>
            </CardHeader>
            <CardContent>
              <Button
                variant="outline"
                size="sm"
                onClick={handleCopyAllNotes}
                className="mb-2"
              >
                <Copy className="h-4 w-4 mr-2" />
                Copy All
              </Button>
              <ul className="list-disc pl-4 text-sm space-y-1">
                {notes.slice(0, 3).map(n => (
                  <li key={n.templateId} className="flex items-start gap-2">
                    <span className="flex-1">{n.message}</span>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleCopyNote(n.message)}
                      aria-label="Copy note"
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}

          {/* Message Templates */}
          <Card>
            <CardHeader>
              <CardTitle>Negotiation Message</CardTitle>
              <CardDescription>
                Choose a template and customize your message
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Strategy Template</Label>
                <Select value={selectedStrategy} onValueChange={setSelectedStrategy}>
                  <SelectTrigger>
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
                <Label>Message</Label>
                {selectedStrategy === 'custom' ? (
                  <Textarea
                    value={customMessage}
                    onChange={(e) => setCustomMessage(e.target.value)}
                    placeholder="Enter your custom negotiation message..."
                    rows={8}
                  />
                ) : (
                  <Textarea
                    value={generateMessage()}
                    readOnly
                    rows={8}
                    className="bg-muted/50"
                  />
                )}
              </div>

              <Button onClick={handleCopyMessage} className="w-full">
                <Copy className="h-4 w-4 mr-2" />
                Copy Message to Clipboard
              </Button>
            </CardContent>
          </Card>

          {/* Outcome Tracking */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Track Outcome
              </CardTitle>
              <CardDescription>
                Record the result of your negotiation
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                <Button
                  variant={outcome === 'accepted' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => handleTrackOutcome('accepted')}
                  className="flex items-center gap-2"
                >
                  <CheckCircle className="h-4 w-4" />
                  Accepted
                </Button>
                <Button
                  variant={outcome === 'counter_offered' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => handleTrackOutcome('counter_offered')}
                  className="flex items-center gap-2"
                >
                  <Clock className="h-4 w-4" />
                  Counter
                </Button>
                <Button
                  variant={outcome === 'rejected' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => handleTrackOutcome('rejected')}
                  className="flex items-center gap-2"
                >
                  <XCircle className="h-4 w-4" />
                  Rejected
                </Button>
                <Button
                  variant={outcome === 'pending' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => handleTrackOutcome('pending')}
                  className="flex items-center gap-2"
                >
                  <Clock className="h-4 w-4" />
                  Pending
                </Button>
              </div>
            </CardContent>
          </Card>

          <div className="flex gap-2 pt-4">
            <Button onClick={onClose} className="flex-1">
              Close
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
