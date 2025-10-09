import { Copy, Check } from 'lucide-react';
import { useState } from 'react';
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { toast } from 'sonner';
import type { CalcResult } from '@/lib/negotiation/types';

interface NegotiationMessageSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  calculation: CalcResult;
  templates: Array<{ label: string; message: string }>;
}

export function NegotiationMessageSheet({
  open,
  onOpenChange,
  calculation,
  templates,
}: NegotiationMessageSheetProps) {
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const handleCopy = (text: string, index: number) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedIndex(index);
      toast.success('Message copied! Paste into your broker chat.');
      setTimeout(() => setCopiedIndex(null), 2000);
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const { anchor, target, floor } = calculation.negotiation;

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="max-h-[90vh]">
        <DrawerHeader>
          <DrawerTitle>Negotiation Assistant</DrawerTitle>
          <DrawerDescription>
            Copy-paste messages to negotiate with brokers
          </DrawerDescription>
        </DrawerHeader>

        <div className="overflow-y-auto px-4 pb-4 space-y-6">
          {/* Rate Tiers */}
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-muted-foreground">
              Recommended Rate Tiers
            </h3>
            
            <div className="grid gap-2">
              <Card className="p-3 border-l-4 border-l-emerald-500 bg-emerald-50 dark:bg-emerald-950/20">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-xs text-muted-foreground">Ask Rate</p>
                    <p className="text-2xl font-bold text-emerald-700 dark:text-emerald-400">
                      {formatCurrency(anchor)}
                    </p>
                  </div>
                  <p className="text-xs text-muted-foreground max-w-[160px]">
                    Start here for strong leverage
                  </p>
                </div>
              </Card>

              <Card className="p-3 border-l-4 border-l-amber-500 bg-amber-50 dark:bg-amber-950/20">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-xs text-muted-foreground">Target Rate</p>
                    <p className="text-2xl font-bold text-amber-700 dark:text-amber-400">
                      {formatCurrency(target)}
                    </p>
                  </div>
                  <p className="text-xs text-muted-foreground max-w-[160px]">
                    Realistic goal based on costs
                  </p>
                </div>
              </Card>

              <Card className="p-3 border-l-4 border-l-rose-500 bg-rose-50 dark:bg-rose-950/20">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-xs text-muted-foreground">Floor Rate</p>
                    <p className="text-2xl font-bold text-rose-700 dark:text-rose-400">
                      {formatCurrency(floor)}
                    </p>
                  </div>
                  <p className="text-xs text-muted-foreground max-w-[160px]">
                    Minimum to break even
                  </p>
                </div>
              </Card>
            </div>
          </div>

          {/* Message Templates */}
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-muted-foreground">
              Suggested Messages
            </h3>
            
            {templates.length > 0 ? (
              <div className="space-y-3">
                {templates.map((template, index) => (
                  <Card key={index} className="p-4">
                    <div className="space-y-3">
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                        {template.label}
                      </p>
                      <p className="text-sm leading-relaxed">
                        {template.message}
                      </p>
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full"
                        onClick={() => handleCopy(template.message, index)}
                      >
                        {copiedIndex === index ? (
                          <>
                            <Check className="mr-2 h-4 w-4" />
                            Copied!
                          </>
                        ) : (
                          <>
                            <Copy className="mr-2 h-4 w-4" />
                            Copy Message
                          </>
                        )}
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            ) : (
              <Card className="p-4">
                <p className="text-sm text-muted-foreground text-center">
                  No specific templates available. Use the rate tiers above to guide your negotiation.
                </p>
              </Card>
            )}
          </div>
        </div>

        <DrawerFooter>
          <DrawerClose asChild>
            <Button variant="outline">Close</Button>
          </DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
