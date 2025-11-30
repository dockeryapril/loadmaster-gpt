import { ArrowLeft, ExternalLink } from 'lucide-react';
import { TableauEmbed } from '@/components/TableauEmbed';
import { Button } from '@/components/ui/button';

export default function MarketInsights() {
  const TABLEAU_VIZ_URL = 'https://public.tableau.com/views/WeeklyNationalRPMbyDivisionFinal/1_MapRPMbyModeandEquipNEWDash2';

  return (
    <div className="min-h-screen bg-muted/30">
      {/* Header */}
      <header className="border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              asChild
              className="gap-2"
            >
              <a href="/">
                <ArrowLeft className="h-4 w-4" />
                Back to Calculator
              </a>
            </Button>
          </div>
          <Button
            variant="outline"
            size="sm"
            asChild
            className="gap-2"
          >
            <a 
              href="https://spot.ftrintel.com/equipment" 
              target="_blank" 
              rel="noopener noreferrer"
            >
              <ExternalLink className="h-4 w-4" />
              View Source
            </a>
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-7xl px-4 py-6 md:py-8">
        <div className="space-y-4 md:space-y-6">
          {/* Page Header */}
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
              📊 Market Intelligence
            </div>
            <h1 className="text-3xl font-semibold leading-tight text-foreground md:text-4xl">
              Weekly National RPM by Division
            </h1>
            <p className="text-sm text-muted-foreground md:text-base">
              Real-time freight market data powered by FTR Intel. Track national rate trends by equipment type and division to make informed load decisions.
            </p>
          </div>

          {/* Info Banner */}
          <div className="rounded-lg border border-border bg-background/80 p-3 backdrop-blur md:p-4">
            <div className="flex items-start gap-2 md:gap-3">
              <div className="rounded-full bg-primary/10 p-1.5 md:p-2">
                <ExternalLink className="h-3 w-3 text-primary md:h-4 md:w-4" />
              </div>
              <div className="flex-1 space-y-1">
                <p className="text-xs font-medium text-foreground md:text-sm">
                  External Data Source
                </p>
                <p className="text-xs text-muted-foreground">
                  This visualization is hosted by Tableau Public and sourced from FTR Intel. Data updates weekly and reflects industry-wide rate trends.
                </p>
              </div>
            </div>
          </div>

          {/* Tableau Embed */}
          <div className="overflow-hidden rounded-2xl border border-border bg-background/80 p-4 shadow-sm backdrop-blur md:p-6">
            <TableauEmbed 
              vizUrl={TABLEAU_VIZ_URL}
              className="w-full"
            />
          </div>

          {/* Footer Note */}
          <div className="text-center text-xs text-muted-foreground">
            <p>
              Data provided by{' '}
              <a 
                href="https://spot.ftrintel.com/equipment" 
                target="_blank" 
                rel="noopener noreferrer"
                className="font-medium text-primary hover:underline"
              >
                FTR Intel
              </a>
              {' '}via Tableau Public
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
