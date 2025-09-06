import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Copy, Sparkles } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

import generateScripts, { Channel, Tone, Equipment } from './templates';
import enhanceWithAI from './enhanceWithAI';

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
  isPro?: boolean; // Add isPro prop to control AI enhancement
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
  isPro = true, // Default to PRO for backward compatibility
}: NegotiationPanelProps) {
  const [channel, setChannel] = useState<Channel>(initialChannel || 'text');
  const [tone, setTone] = useState<Tone>(initialTone || 'professional');
  const [scripts, setScripts] = useState(initialScripts || { ask: '', settle: '', bottom: '' });
  const initialized = useRef(false);
  const [improving, setImproving] = useState<null | keyof typeof scripts>(null);

  const { toast } = useToast();

  const debounceRef = useRef<NodeJS.Timeout | null>(null);

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

  const handleCopy = (stage: keyof typeof scripts) => {
    navigator.clipboard.writeText(scripts[stage]);
    toast({ description: 'Script copied to clipboard' });
  };

  const buildContext = (): string => {
    const parts: string[] = [];
    if (pickupCity && deliveryCity) parts.push(`${pickupCity} to ${deliveryCity}`);
    if (miles) parts.push(`${miles} mi`);
    if (weightLbs) parts.push(`${weightLbs} lbs`);
    if (offerTotal) parts.push(`offer $${offerTotal}`);
    if (rpm) parts.push(`${rpm} rpm`);
    return parts.join(', ');
  };

  const debouncedImprove = (stage: keyof typeof scripts) => {
    if (!isPro) return;
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    debounceRef.current = setTimeout(async () => {
      setImproving(stage);
      try {
        const improved = await enhanceWithAI({
          baseScript: scripts[stage],
          context: buildContext(),
        });
        setScripts(prev => {
          const updated = { ...prev, [stage]: improved };
          onScriptChange?.(updated);
          return updated;
        });
      } catch (err) {
        const fallback = generateScripts({
          ask: askRate,
          settle: settleRate,
          bottom: bottomRate,
          channel,
          tone,
          equipment: equipmentType,
          miles,
          ...flags,
        });
        setScripts(prev => {
          const updated = { ...prev, [stage]: fallback[stage] };
          onScriptChange?.(updated);
          return updated;
        });
        toast({
          title: 'AI enhancement failed',
          description: err instanceof Error ? err.message : 'Failed to improve script',
          variant: 'destructive',
        });
      } finally {
        setImproving(null);
      }
    }, 500);
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
            <div className="flex gap-2">
              {isPro && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => debouncedImprove(stage)}
                  disabled={improving === stage}
                >
                  <Sparkles className="h-4 w-4 mr-1" />
                  {improving === stage ? 'Improving...' : 'Improve with AI'}
                </Button>
              )}
              <Button variant="outline" size="icon" onClick={() => handleCopy(stage)}>
                <Copy className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <Textarea value={scripts[stage]} readOnly rows={channel === 'email' ? 6 : 3} />
        </div>
      ))}
    </div>
  );
}

export default NegotiationPanel;

