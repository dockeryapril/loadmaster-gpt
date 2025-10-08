import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Copy } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

import generateScripts, { Channel, Tone, Equipment } from './templates';

interface NegotiationFlags {
  isRush?: boolean;
  tarpRequired?: boolean;
  extraStops?: number;
  fuelSurchargeMentioned?: boolean;
  palletJack?: boolean;
  liftGate?: boolean;
}

interface NegotiationPanelProps {
  askRate: number;
  settleRate: number;
  bottomRate: number;
  miles?: number;
  weightLbs?: number;
  offerTotal?: number;
  rpm?: number;
  pickupCity?: string;
  deliveryCity?: string;
  equipmentType: Equipment;
  flags?: NegotiationFlags;
  onScriptChange?: (scripts: { ask: string; settle: string; bottom: string }) => void;
  initialChannel?: Channel;
  initialTone?: Tone;
  initialScripts?: { ask: string; settle: string; bottom: string };
  onChannelChange?: (channel: Channel) => void;
  onToneChange?: (tone: Tone) => void;
}

export function NegotiationPanel({
  askRate,
  settleRate,
  bottomRate,
  miles,
  weightLbs,
  offerTotal,
  rpm,
  pickupCity,
  deliveryCity,
  equipmentType,
  flags = {},
  onScriptChange,
  initialChannel,
  initialTone,
  initialScripts,
  onChannelChange,
  onToneChange,
}: NegotiationPanelProps) {
  const [channel, setChannel] = useState<Channel>(initialChannel || 'text');
  const [tone, setTone] = useState<Tone>(initialTone || 'professional');
  const [scripts, setScripts] = useState(initialScripts || { ask: '', settle: '', bottom: '' });
  const initialized = useRef(false);

  const { toast } = useToast();

  useEffect(() => {
    if (initialScripts && !initialized.current) {
      initialized.current = true;
      setScripts(initialScripts);
      onScriptChange?.(initialScripts);
      return;
    }
    const newScripts = generateScripts({
      ask: askRate,
      settle: settleRate,
      bottom: bottomRate,
      channel,
      tone,
      equipment: equipmentType,
      miles,
      ...flags,
    });
    setScripts(newScripts);
    onScriptChange?.(newScripts);
  }, [
    askRate,
    settleRate,
    bottomRate,
    channel,
    tone,
    equipmentType,
    miles,
    flags?.isRush,
    flags?.tarpRequired,
    flags?.extraStops,
    flags?.fuelSurchargeMentioned,
    flags?.palletJack,
    flags?.liftGate,
    onScriptChange,
    initialScripts,
  ]);

  useEffect(() => {
    if (initialChannel) setChannel(initialChannel);
  }, [initialChannel]);

  useEffect(() => {
    if (initialTone) setTone(initialTone);
  }, [initialTone]);

  const handleChannelChange = (value: Channel) => {
    setChannel(value);
    onChannelChange?.(value);
  };

  const handleToneChange = (value: Tone) => {
    setTone(value);
    onToneChange?.(value);
  };

  const handleCopy = async (stage: keyof typeof scripts) => {
    try {
      // Use the modern clipboard API with proper plain text handling
      await navigator.clipboard.writeText(scripts[stage]);
      toast({ description: 'Script copied to clipboard' });
    } catch (error) {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = scripts[stage];
      textArea.style.position = 'fixed';
      textArea.style.opacity = '0';
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      toast({ description: 'Script copied to clipboard' });
    }
  };


  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4 flex-wrap">
        <Tabs value={channel} onValueChange={handleChannelChange} className="h-10">
          <TabsList>
            <TabsTrigger value="text">Text</TabsTrigger>
            <TabsTrigger value="email">Email</TabsTrigger>
            <TabsTrigger value="phone">Phone</TabsTrigger>
          </TabsList>
        </Tabs>

        <Select value={tone} onValueChange={handleToneChange}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Tone" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="professional">Professional</SelectItem>
            <SelectItem value="driver">Driver</SelectItem>
            <SelectItem value="firm">Firm</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {(['ask', 'settle', 'bottom'] as const).map(stage => (
        <div key={stage} className="space-y-2">
          <div className="flex items-center justify-between">
            <h3 className="font-medium capitalize">{stage}</h3>
            <Button variant="outline" size="icon" type="button" onClick={() => handleCopy(stage)}>
              <Copy className="h-4 w-4" />
            </Button>
          </div>
          <Textarea value={scripts[stage]} readOnly rows={channel === 'email' ? 6 : 3} />
        </div>
      ))}
    </div>
  );
}

export default NegotiationPanel;

