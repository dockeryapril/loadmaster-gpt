import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Info, Zap, Target, TrendingUp } from 'lucide-react';

interface NegotiationHelpCardProps {
  className?: string;
}

export function NegotiationHelpCard({ className }: NegotiationHelpCardProps) {
  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Info className="h-4 w-4 text-muted-foreground" />
          Negotiation Tools Guide
        </CardTitle>
        <CardDescription>
          Two different interfaces for different needs
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-3">
          <div className="flex items-start gap-3 p-3 bg-muted/30 rounded-lg">
            <Zap className="h-5 w-5 text-primary mt-0.5" />
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h4 className="font-medium text-sm">Quick Scripts</h4>
                <Badge variant="secondary" className="text-xs px-2 py-0.5">
                  Embedded Panel
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground mb-2">
                Fast script generation for immediate use
              </p>
              <div className="text-xs text-muted-foreground">
                • Text, Email, Phone channels<br />
                • Professional, Driver-Centered Language, Firm tones<br />
                • Ask, Settle, Bottom scripts<br />
                • AI enhancement (PRO only)
              </div>
            </div>
          </div>

          <div className="flex items-start gap-3 p-3 bg-muted/30 rounded-lg">
            <Target className="h-5 w-5 text-primary mt-0.5" />
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h4 className="font-medium text-sm">Full Workspace</h4>
                <Badge variant="secondary" className="text-xs px-2 py-0.5">
                  Negotiate Button
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground mb-2">
                Complete negotiation management system
              </p>
              <div className="text-xs text-muted-foreground">
                • Detailed load analysis<br />
                • Strategy templates & notes<br />
                • Outcome tracking<br />
                • Full negotiation history
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs text-muted-foreground pt-2 border-t">
          <TrendingUp className="h-3 w-3" />
          <span>Use Quick Scripts for speed, Full Workspace for comprehensive negotiation management</span>
        </div>
      </CardContent>
    </Card>
  );
}