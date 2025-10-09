import { useState } from 'react';
import { ChevronDown, ChevronUp, HelpCircle } from 'lucide-react';
import type { DetailedProfitCalculation } from '@/types/load';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';

function formatCurrency(value: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 2,
  }).format(value);
}

interface ProfitBreakdownProps {
  calculation: DetailedProfitCalculation;
}

export function ProfitBreakdown({ calculation }: ProfitBreakdownProps) {
  const [showBreakdown, setShowBreakdown] = useState(false);
  const [showFormula, setShowFormula] = useState(false);

  const { breakdown, fuelPriceUsed, timestamp, adjustments } = calculation;

  return (
    <div className="space-y-3">
      <Collapsible open={showBreakdown} onOpenChange={setShowBreakdown}>
        <CollapsibleTrigger asChild>
          <button className="flex w-full items-center justify-between text-sm font-medium text-primary hover:underline">
            <span>Show breakdown</span>
            {showBreakdown ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </button>
        </CollapsibleTrigger>
        <CollapsibleContent className="mt-4 space-y-3 text-sm">
          <div className="space-y-2">
            <p className="font-semibold text-foreground">Revenue:</p>
            <div className="space-y-1 pl-4 text-muted-foreground">
              <div className="flex justify-between">
                <span>Linehaul rate:</span>
                <span className="font-medium text-foreground">{formatCurrency(breakdown.linehaulRate)}</span>
              </div>
              <div className="flex justify-between">
                <span>FSC:</span>
                <span className="font-medium text-foreground">{formatCurrency(breakdown.fsc)}</span>
              </div>
              {!adjustments.includeFsc && adjustments.originalFsc > 0 && (
                <p className="text-right text-xs text-muted-foreground">
                  Carrier keeps {formatCurrency(adjustments.originalFsc)} FSC (excluded from your share)
                </p>
              )}
              <div className="mt-2 flex justify-between border-t border-border pt-2 font-semibold text-foreground">
                <span>Total gross revenue:</span>
                <span>{formatCurrency(breakdown.grossRevenue)}</span>
              </div>
              {breakdown.splitPercent < 100 && (
                <div className="flex justify-between text-primary">
                  <span>Your split ({breakdown.splitPercent}%):</span>
                  <span className="font-medium">{formatCurrency(breakdown.yourShare)}</span>
                </div>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <p className="font-semibold text-foreground">Costs:</p>
            <div className="space-y-1 pl-4 text-muted-foreground">
              <div className="flex justify-between">
                <span>Fuel:</span>
                <span className="font-medium text-foreground">{formatCurrency(breakdown.fuelCost)}</span>
              </div>
              {!adjustments.includeFuel && adjustments.originalFuelCost > 0 && (
                <p className="text-right text-xs text-muted-foreground">
                  Carrier covers {formatCurrency(adjustments.originalFuelCost)} in fuel (not subtracted)
                </p>
              )}
              <div className="flex justify-between">
                <span>Tolls:</span>
                <span className="font-medium text-foreground">{formatCurrency(breakdown.tollCost)}</span>
              </div>
              {!adjustments.includeTolls && adjustments.originalTolls > 0 && (
                <p className="text-right text-xs text-muted-foreground">
                  Carrier covers {formatCurrency(adjustments.originalTolls)} in tolls (not subtracted)
                </p>
              )}
              <div className="flex justify-between">
                <span>Variable costs:</span>
                <span className="font-medium text-foreground">{formatCurrency(breakdown.variableCosts)}</span>
              </div>
              <div className="flex justify-between">
                <span>Fixed costs (prorated):</span>
                <span className="font-medium text-foreground">{formatCurrency(breakdown.fixedCosts)}</span>
              </div>
              <div className="mt-2 flex justify-between border-t border-border pt-2 font-semibold text-foreground">
                <span>Total costs:</span>
                <span>{formatCurrency(breakdown.totalCosts)}</span>
              </div>
            </div>
          </div>

          <div className="rounded-lg bg-primary/5 p-3">
            <div className="flex justify-between text-base font-semibold text-foreground">
              <span>{breakdown.splitPercent < 100 ? 'Your profit:' : 'Net profit:'}</span>
              <span className={breakdown.netProfit >= 0 ? 'text-emerald-600' : 'text-rose-600'}>
                {formatCurrency(breakdown.netProfit)}
              </span>
            </div>
          </div>

          <p className="text-xs text-muted-foreground">
            Calculated at {new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} using fuel price {formatCurrency(fuelPriceUsed)}/gal
          </p>
        </CollapsibleContent>
      </Collapsible>

      <Collapsible open={showFormula} onOpenChange={setShowFormula}>
        <CollapsibleTrigger asChild>
          <button className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary">
            <HelpCircle className="h-3.5 w-3.5" />
            <span>How is this calculated?</span>
          </button>
        </CollapsibleTrigger>
        <CollapsibleContent className="mt-3 rounded-lg bg-muted/50 p-3 text-xs text-muted-foreground">
          <p className="font-semibold text-foreground">Calculation Formula:</p>
          <ul className="mt-2 space-y-1 pl-4">
            <li>
              <strong>Gross revenue</strong> = Linehaul rate
              {adjustments.includeFsc ? ' + FSC' : ' (FSC excluded)'}
            </li>
            {breakdown.splitPercent < 100 && (
              <li><strong>Your share</strong> = Gross revenue × ({breakdown.splitPercent}% ÷ 100)</li>
            )}
            <li><strong>Fuel cost</strong> = (Miles ÷ MPG) × Fuel price per gallon</li>
            {!adjustments.includeFuel && (
              <li className="text-muted-foreground">Fuel excluded from driver costs</li>
            )}
            <li><strong>Variable costs</strong> = Miles × Variable cost per mile</li>
            <li><strong>Fixed costs</strong> = (Daily fixed costs ÷ 2500) × Miles</li>
            <li className="pt-1">
              <strong>{breakdown.splitPercent < 100 ? 'Your profit' : 'Net profit'}</strong> =
              {breakdown.splitPercent < 100 ? ' Your share' : ' Gross revenue'}
              {adjustments.includeFuel ? ' − Fuel' : ''}
              {adjustments.includeTolls ? ' − Tolls' : ''} − Variable − Fixed
            </li>
          </ul>
          <p className="mt-2 italic">
            Fixed costs are prorated based on industry average of 2,500 miles per week.
          </p>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
}
