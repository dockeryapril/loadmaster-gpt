import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { BusinessCostBreakdown as BusinessCostBreakdownType } from '@/utils/businessSetupCalculations';
import { DollarSign, TrendingDown, TrendingUp } from 'lucide-react';

interface BusinessCostBreakdownProps {
  breakdown: BusinessCostBreakdownType;
  className?: string;
}

export function BusinessCostBreakdown({ breakdown, className }: BusinessCostBreakdownProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  };

  const positiveItems = [
    { label: 'Gross Revenue', amount: breakdown.grossRevenue, description: 'Base rate + FSC' },
    { label: 'Revenue After Split', amount: breakdown.revenueAfterSplit, description: 'After carrier split' }
  ];

  if (breakdown.fscAdjustment !== 0) {
    positiveItems.push({
      label: breakdown.fscAdjustment > 0 ? 'FSC Received' : 'FSC Kept by Carrier',
      amount: Math.abs(breakdown.fscAdjustment),
      description: breakdown.fscAdjustment > 0 ? 'Driver receives FSC' : 'Carrier keeps FSC'
    });
  }

  if (breakdown.deadheadPay > 0) {
    positiveItems.push({
      label: 'Deadhead Pay',
      amount: breakdown.deadheadPay,
      description: 'Compensation for empty miles'
    });
  }

  if (breakdown.detentionPay > 0) {
    positiveItems.push({
      label: 'Detention Pay',
      amount: breakdown.detentionPay,
      description: 'Waiting time compensation'
    });
  }

  const deductionItems = [];

  if (breakdown.weeklyFixedCosts > 0 && breakdown.weeklyFixedCostPerMile > 0) {
    deductionItems.push({
      label: 'Fixed Costs (Per Mile)',
      amount: breakdown.weeklyFixedCostPerMile,
      description: `Weekly costs: ${formatCurrency(breakdown.weeklyFixedCosts)}`
    });
  }

  if (breakdown.adminFees > 0) {
    deductionItems.push({
      label: 'Admin Fees',
      amount: breakdown.adminFees,
      description: 'Administrative charges'
    });
  }

  if (breakdown.factoringFees > 0) {
    deductionItems.push({
      label: 'Factoring Fees',
      amount: breakdown.factoringFees,
      description: 'Invoice factoring charges'
    });
  }

  if (breakdown.fuelCosts > 0) {
    deductionItems.push({
      label: 'Fuel Costs',
      amount: breakdown.fuelCosts,
      description: 'Fuel expenses (after reimbursements)'
    });
  }

  if (breakdown.tollCosts > 0) {
    deductionItems.push({
      label: 'Toll Costs',
      amount: breakdown.tollCosts,
      description: 'Toll expenses (after reimbursements)'
    });
  }

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <DollarSign className="h-4 w-4" />
          Net Take-Home Breakdown
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Revenue Section */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm font-medium text-green-600">
            <TrendingUp className="h-3 w-3" />
            Revenue
          </div>
          {positiveItems.map((item, index) => (
            <div key={index} className="flex justify-between items-center text-sm pl-5">
              <div>
                <div className="font-medium">{item.label}</div>
                <div className="text-xs text-muted-foreground">{item.description}</div>
              </div>
              <Badge variant="secondary" className="text-green-600">
                +{formatCurrency(item.amount)}
              </Badge>
            </div>
          ))}
        </div>

        {deductionItems.length > 0 && (
          <>
            <Separator />
            {/* Deductions Section */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm font-medium text-red-600">
                <TrendingDown className="h-3 w-3" />
                Deductions
              </div>
              {deductionItems.map((item, index) => (
                <div key={index} className="flex justify-between items-center text-sm pl-5">
                  <div>
                    <div className="font-medium">{item.label}</div>
                    <div className="text-xs text-muted-foreground">{item.description}</div>
                  </div>
                  <Badge variant="destructive" className="text-red-600">
                    -{formatCurrency(item.amount)}
                  </Badge>
                </div>
              ))}
            </div>
          </>
        )}

        <Separator />
        
        {/* Net Result */}
        <div className="flex justify-between items-center font-medium">
          <span>Net Take-Home</span>
          <Badge 
            variant={breakdown.netTakeHome > 0 ? "default" : "destructive"}
            className="text-base px-3 py-1"
          >
            {formatCurrency(breakdown.netTakeHome)}
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
}