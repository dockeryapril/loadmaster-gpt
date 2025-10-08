import { useMemo } from 'react';
import { useStore } from '../state/store';
import { calculateProfit } from '../utils/calculateProfit';

export const ProfitabilityCalculator = () => {
  const { currentLoad, costProfile } = useStore();

  const result = useMemo(() => {
    if (!currentLoad) {
      return null;
    }
    return calculateProfit(currentLoad, costProfile);
  }, [currentLoad, costProfile]);

  if (!currentLoad || !result) {
    return null;
  }

  return (
    <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 shadow">
      <h2 className="text-lg font-semibold text-emerald-900">Profitability</h2>
      <div className="mt-2 space-y-1 text-sm text-emerald-900">
        <p>
          <span className="font-medium">RPM:</span> ${result.rpm}
        </p>
        <p>
          <span className="font-medium">Margin:</span> ${result.margin}
        </p>
      </div>
      <p
        className={`mt-3 text-sm font-semibold ${result.takeIt ? 'text-emerald-700' : 'text-red-600'}`}
      >
        {result.takeIt ? '✅ Take it' : '❌ Skip it'}
      </p>
    </div>
  );
};
